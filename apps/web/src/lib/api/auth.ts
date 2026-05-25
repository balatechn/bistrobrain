import apiClient from './client';

export const authApi = {
  login: async (data: { tenantSlug: string; email: string; password: string; mfaToken?: string }) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  logout: async (refreshToken: string) => {
    const res = await apiClient.post('/auth/logout', { refreshToken });
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};
