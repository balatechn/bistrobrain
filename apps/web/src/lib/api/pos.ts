import apiClient from './client';

export const posApi = {
  getCategories: async () => {
    const res = await apiClient.get('/menu/categories');
    return res.data;
  },
  getMenuItems: async (params?: any) => {
    const res = await apiClient.get('/menu/items', { params });
    return res.data;
  },
  getTables: async () => {
    const res = await apiClient.get('/tables');
    return res.data;
  },
  createOrder: async (data: any) => {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },
  getOrders: async (params?: any) => {
    const res = await apiClient.get('/orders', { params });
    return res.data;
  },
  getOrderById: async (id: string) => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/orders/${id}/status`, { status });
    return res.data;
  },
  getDashboardStats: async () => {
    const res = await apiClient.get('/orders/dashboard');
    return res.data;
  },
  processPayment: async (orderId: string, data: any) => {
    const res = await apiClient.post(`/payments/${orderId}`, data);
    return res.data;
  },
};
