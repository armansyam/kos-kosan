export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Only protect page routes, NOT API routes.
     * Public: / (landing), /login, /api/*, /_next/*, /favicon.ico
     */
    '/((?!login|api/|_next/static|_next/image|favicon.ico|ams-logo.png|$).*)',
  ],
};
