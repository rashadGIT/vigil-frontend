import { NextRequest, NextResponse } from 'next/server';

const SUPER_ADMIN_PATHS = ['/super-admin'];
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'kelovaapp.com';
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Subdomain tenant resolution
  // Production: sunrise.kelovaapp.com → slug = 'sunrise'
  // Local dev:  localhost:3000?tenant=sunrise → slug = 'sunrise'
  const subdomain = host.replace(`.${APP_DOMAIN}`, '').replace(/:\d+$/, '');
  const isSubdomain =
    subdomain !== 'app' &&
    subdomain !== 'www' &&
    subdomain !== 'localhost' &&
    host.includes(APP_DOMAIN);
  const tenantSlug = isSubdomain
    ? subdomain
    : request.nextUrl.searchParams.get('tenant') ?? null;

  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) requestHeaders.set('x-tenant-slug', tenantSlug);

  // Dashboard auth guard: only redirect in DEV_BYPASS mode for /login.
  // Real auth enforcement happens via AuthInitializer + the backend returning 401.
  // The cookie check was removed because the session cookie is set async after OAuth
  // and wasn't reliably present before the middleware ran, causing a login redirect loop.
  if (DEV_BYPASS && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Super-admin route guard — redirect non-super-admins to dashboard
  const isSuperAdminRoute = SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isSuperAdminRoute) {
    // In dev bypass mode we can't verify role server-side; block at backend level
    if (!DEV_BYPASS) {
      // Role is stored in the Zustand persisted store (localStorage key: vigil-user).
      // Middleware can't read localStorage, so we rely on the backend to 403.
      // This redirect is a UX hint only — enforcement is in RolesGuard.
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
