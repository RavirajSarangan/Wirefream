import { NextRequest, NextResponse } from 'next/server';

// Admin routes that require authentication and admin role
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Check if this is an admin route
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isAdminRoute) {
        // Get user email from Firebase token cookie or header
        const token = request.cookies.get('__session')?.value;

        if (!token) {
            // No token, redirect to login
            return NextResponse.redirect(new URL('/', request.url));
        }

        // For now, we'll check admin status via API call
        // In production, you'd verify the Firebase token first
        try {
            // The actual verification will happen in route handlers
            // This middleware just ensures there's a token
            return NextResponse.next();
        } catch (error) {
            console.error('Middleware error:', error);
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
