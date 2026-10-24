import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const { pathname, searchParams } = request.nextUrl;

  const bypassSecret = process.env.MAINTENANCE_SECRET;
  const bypassParam = searchParams.get('bypass');
  const bypassCookie = request.cookies.get('maintenance_bypass')?.value;

  const isBypassed = Boolean(
    bypassSecret && (bypassParam === bypassSecret || bypassCookie === bypassSecret)
  );

  // If visitor provides ?bypass=YOUR_SECRET, set cookie and reload clean URL
  if (bypassSecret && bypassParam === bypassSecret) {
    const cleanUrl = new URL(request.url);
    cleanUrl.searchParams.delete('bypass');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set('maintenance_bypass', bypassSecret, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  // When Maintenance Mode is disabled or user is bypassed
  if (!isMaintenanceMode || isBypassed) {
    // If visitor visits /maintenance directly while site is live, send to homepage
    if (pathname === '/maintenance') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // When Maintenance Mode is ENABLED:
  // 1. API routes get structured 503 JSON response
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: 'Service Unavailable',
        message: 'System is currently undergoing maintenance. Please try again later.',
      },
      { status: 503 }
    );
  }

  // 2. Allow the maintenance page itself to render
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // 3. Rewrite all other pages to /maintenance
  // Rewriting keeps the current URL so user can just refresh when maintenance is over
  return NextResponse.rewrite(new URL('/maintenance', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png
     * - static asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
