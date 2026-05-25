import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(tenantId: string, email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { tenantId, email, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: dto.tenantSlug, isActive: true },
    });
    if (!tenant) throw new UnauthorizedException('Restaurant not found or inactive');

    const user = await this.validateUser(tenant.id, dto.email, dto.password);

    if (user.mfaEnabled) {
      if (!dto.mfaToken) {
        return { mfaRequired: true, userId: user.id };
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: dto.mfaToken,
        window: 1,
      });
      if (!verified) throw new UnauthorizedException('Invalid MFA token');
    }

    const tokens = await this.generateTokens(user.id, tenant.id, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress, refreshToken: tokens.refreshToken },
    });

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.logActivity(tenant.id, user.id, 'LOGIN', 'auth', null, { ipAddress });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        branchId: user.branchId,
        permissions: user.permissions,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        currency: tenant.currency,
        timezone: tenant.timezone,
        subscriptionPlan: tenant.subscriptionPlan,
      },
      ...tokens,
    };
  }

  async registerTenant(dto: RegisterTenantDto) {
    const existing = await this.prisma.tenant.findFirst({
      where: { OR: [{ slug: dto.slug }, { email: dto.email }] },
    });
    if (existing) throw new ConflictException('Restaurant with this slug or email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const tenant = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.restaurantName,
          slug: dto.slug,
          email: dto.email,
          phone: dto.phone,
          currency: dto.currency || 'INR',
          timezone: dto.timezone || 'Asia/Kolkata',
          trialEndsAt,
          subscriptionPlan: 'TRIAL',
          subscriptionStatus: 'ACTIVE',
        },
      });

      const owner = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          email: dto.email,
          phone: dto.phone,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'OWNER',
          isActive: true,
        },
      });

      await tx.branch.create({
        data: {
          tenantId: newTenant.id,
          name: dto.restaurantName,
          code: 'MAIN',
          phone: dto.phone,
          email: dto.email,
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: newTenant.id,
          plan: 'TRIAL',
          status: 'ACTIVE',
          billingCycle: 'MONTHLY',
          amount: 0,
          startDate: new Date(),
          endDate: trialEndsAt,
          trialEndDate: trialEndsAt,
        },
      });

      return { tenant: newTenant, owner };
    });

    const tokens = await this.generateTokens(tenant.owner.id, tenant.tenant.id, 'OWNER');

    return {
      message: 'Restaurant registered successfully. 14-day free trial started.',
      tenant: { id: tenant.tenant.id, name: tenant.tenant.name, slug: tenant.tenant.slug },
      user: { id: tenant.owner.id, email: tenant.owner.email, role: tenant.owner.role },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const session = await this.prisma.userSession.findFirst({
        where: { token: refreshToken, expiresAt: { gt: new Date() } },
      });
      if (!session) throw new UnauthorizedException('Session expired');

      const tokens = await this.generateTokens(payload.sub, payload.tenantId, payload.role);

      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { token: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.userSession.deleteMany({ where: { userId, token: refreshToken } });
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return { message: 'Logged out successfully' };
  }

  async enableMFA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const secret = speakeasy.generateSecret({
      name: `Bistro Brain:${user.email}`,
      length: 32,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCode };
  }

  async verifyAndEnableMFA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA setup not initiated');

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) throw new BadRequestException('Invalid verification code');

    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    return { message: 'MFA enabled successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new BadRequestException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });

    await this.prisma.userSession.deleteMany({ where: { userId } });
    return { message: 'Password changed successfully. Please login again.' };
  }

  private async generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async logActivity(tenantId: string, userId: string, action: string, entity: string, entityId: string | null, data: object) {
    await this.prisma.activityLog.create({
      data: { tenantId, userId, action, entity, entityId, newData: data },
    }).catch((err) => this.logger.error('Failed to log activity', err));
  }
}
