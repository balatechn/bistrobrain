/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Bistro Brain Admin',
  },
  async rewrites() {
    return [
      { source: '/api/v1/auth/:path*', destination: 'http://auth:4001/api/v1/auth/:path*' },
      { source: '/api/v1/orders/:path*', destination: 'http://pos:4002/api/v1/orders/:path*' },
      { source: '/api/v1/menu/:path*', destination: 'http://pos:4002/api/v1/menu/:path*' },
      { source: '/api/v1/tables/:path*', destination: 'http://pos:4002/api/v1/tables/:path*' },
      { source: '/api/v1/payments/:path*', destination: 'http://pos:4002/api/v1/payments/:path*' },
      { source: '/api/v1/kot/:path*', destination: 'http://pos:4002/api/v1/kot/:path*' },
      { source: '/api/v1/inventory/:path*', destination: 'http://inventory:4003/api/v1/inventory/:path*' },
      { source: '/api/v1/grn/:path*', destination: 'http://inventory:4003/api/v1/grn/:path*' },
      { source: '/api/v1/recipes/:path*', destination: 'http://inventory:4003/api/v1/recipes/:path*' },
      { source: '/api/v1/accounts/:path*', destination: 'http://finance:4004/api/v1/accounts/:path*' },
      { source: '/api/v1/journals/:path*', destination: 'http://finance:4004/api/v1/journals/:path*' },
      { source: '/api/v1/expenses/:path*', destination: 'http://finance:4004/api/v1/expenses/:path*' },
      { source: '/api/v1/customers/:path*', destination: 'http://crm:4005/api/v1/customers/:path*' },
      { source: '/api/v1/loyalty/:path*', destination: 'http://crm:4005/api/v1/loyalty/:path*' },
      { source: '/api/v1/vendors/:path*', destination: 'http://purchase:4006/api/v1/vendors/:path*' },
      { source: '/api/v1/purchase-orders/:path*', destination: 'http://purchase:4006/api/v1/purchase-orders/:path*' },
      { source: '/api/v1/indents/:path*', destination: 'http://purchase:4006/api/v1/indents/:path*' },
      { source: '/api/v1/kitchen/:path*', destination: 'http://kitchen:4007/api/v1/kitchen/:path*' },
      { source: '/api/v1/employees/:path*', destination: 'http://hr:4008/api/v1/employees/:path*' },
      { source: '/api/v1/shifts/:path*', destination: 'http://hr:4008/api/v1/shifts/:path*' },
      { source: '/api/v1/reports/:path*', destination: 'http://reporting:4009/api/v1/reports/:path*' },
      { source: '/api/v1/analytics/:path*', destination: 'http://reporting:4009/api/v1/analytics/:path*' },
      { source: '/api/v1/notifications/:path*', destination: 'http://notifications:4010/api/v1/notifications/:path*' },
    ];
  },
};

module.exports = nextConfig;
