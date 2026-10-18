import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy Convention
 * Replaces deprecated middleware.ts in Next.js 16+
 */
export function proxy(request: NextRequest) {
  // Clone request headers and add server tracking metadata
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-codiary-proxy-timestamp', new Date().toISOString());

  // Pass updated headers upstream to page/API handlers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
