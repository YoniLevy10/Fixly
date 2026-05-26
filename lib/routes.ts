export const routes = {
  home: '/',
  newRequest: '/request/new',
  request: (id: string) => `/request/${id}`,
  category: (slug: string) => `/categories/${slug}`,
  professional: (id: string) => `/professionals/${id}`,
  proDashboard: '/pro/dashboard',
  proRequests: '/pro/requests',
  admin: '/admin',
}
