'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';

const loginSchema = z.object({
  tenantSlug: z.string().min(1, 'Restaurant slug is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mfaToken: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.mfaRequired) {
        setMfaRequired(true);
        toast('Enter your 2FA code', { icon: '🔐' });
        return;
      }
      setAuth(res);
      toast.success(`Welcome back, ${res.user.firstName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-900 via-orange-900 to-red-950 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-700/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-800/20 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-sm">
          <Image
            src="https://www.bistrobrain.com/wp-content/uploads/2025/02/cropped-Logo-01-1.png"
            alt="Bistro Brain"
            width={200}
            height={80}
            className="mx-auto mb-8 drop-shadow-2xl"
            unoptimized
          />
          <h2 className="text-3xl font-bold text-white leading-tight">
            Your Turnkey Partner in Building Profitable F&amp;B Businesses
          </h2>
          <p className="text-amber-200/80 mt-4 text-sm leading-relaxed">
            Smart restaurant management — POS, kitchen display, inventory, finance and CRM, all in one platform.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-300">75+</p>
              <p className="text-xs text-amber-200/60 mt-1">Projects Delivered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">24+</p>
              <p className="text-xs text-amber-200/60 mt-1">Years Experience</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">99%</p>
              <p className="text-xs text-amber-200/60 mt-1">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <Image
            src="https://www.bistrobrain.com/wp-content/uploads/2025/02/cropped-Logo-01-1.png"
            alt="Bistro Brain"
            width={160}
            height={60}
            className="mx-auto mb-3"
            unoptimized
          />
          <p className="text-slate-400 text-sm">Restaurant Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Tenant Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Restaurant Slug</label>
              <input
                {...register('tenantSlug')}
                type="text"
                placeholder="my-restaurant"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              {errors.tenantSlug && <p className="mt-1 text-xs text-red-400">{errors.tenantSlug.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@restaurant.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* MFA Token (conditional) */}
            {mfaRequired && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Two-Factor Code</label>
                <input
                  {...register('mfaToken')}
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-yellow-500 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all text-center text-2xl tracking-widest"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/50"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/register" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
              New restaurant? Start free 14-day trial →
            </a>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2026 Bistro Brain Hospitality. All rights reserved.
        </p>
      </div>
      </div>
    </div>
  );
}
