import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
  permissions?: any;
  avatar?: string;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  currency: string;
  timezone: string;
  subscriptionPlan: string;
}

interface AuthState {
  user: User | null;
  tenant: TenantInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { user: User; tenant: TenantInfo; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  updateToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, tenant, accessToken, refreshToken }) => {
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, tenant: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        if (typeof window !== 'undefined') window.location.href = '/login';
      },

      updateToken: (accessToken: string) => set({ accessToken }),
    }),
    {
      name: 'bistrobrain-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
