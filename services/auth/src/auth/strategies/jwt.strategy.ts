import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; tenantId: string; role: string }) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, isActive: true, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        branchId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        permissions: true,
        avatar: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');
    return { ...user, sub: user.id };
  }
}
