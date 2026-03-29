import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/auth-utils';
import {
    fetchAllUsers,
    updateUser,
    deleteUser
} from '@/lib/admin-queries';

export async function GET(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
        const search = req.nextUrl.searchParams.get('search');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        const { users, total } = await fetchAllUsers(limit, offset, search || undefined);

        return NextResponse.json({
            success: true,
            users,
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { adminEmail, userId, data } = await req.json();

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        // Update user
        const updatedUser = await updateUser(userId, data);

        if (!updatedUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Log the action
        await logAdminAction(
            adminEmail,
            'user_updated',
            userId.toString(),
            'user',
            { changes: data }
        );

        return NextResponse.json({
            success: true,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const userId = req.nextUrl.searchParams.get('userId');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            );
        }

        // Delete user
        const deleted = await deleteUser(parseInt(userId));

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete user' },
                { status: 500 }
            );
        }

        // Log the action
        await logAdminAction(
            adminEmail,
            'user_deleted',
            userId,
            'user',
            { deletedUserId: userId }
        );

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
