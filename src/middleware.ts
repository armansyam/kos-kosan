export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - / (root/landing page - public)
     * - /login (public)
     * - /api/auth (auth API)
     * - /_next (Next.js internals)
     * - /favicon.ico
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|$).*)',
  ],
};