import { Request } from 'express';

export const getRefreshCookieName = (req: Request) => {
  const clientApp = req.headers['x-client-app'];
  return clientApp === 'dashboard' ? 'dashboardRefreshToken' : 'refreshToken';
};
