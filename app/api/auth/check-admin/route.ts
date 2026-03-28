import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Email parameter required' },
                { status: 400 }
            );
        }

        const isAdmin = await verifyAdminAccess(email);

        return NextResponse.json({
            isAdmin,
            email,
            message: isAdmin ? 'Admin access granted' : 'Access denied'
        });
    } catch (error) {
        console.error('Error checking admin access:', error);
        return NextResponse.json(
            { error: 'Failed to verify admin access', isAdmin: false },
            { status: 500 }
        );
    }
}
