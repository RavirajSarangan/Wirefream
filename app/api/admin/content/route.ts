import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/auth-utils';
import { fetchAllContent, deleteContent, flagUserActivity } from '@/lib/admin-queries';

export async function GET(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        const { content, total } = await fetchAllContent(limit, offset);

        return NextResponse.json({
            success: true,
            content,
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        return NextResponse.json(
            { error: 'Failed to fetch content' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const contentUid = req.nextUrl.searchParams.get('uid');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        if (!contentUid) {
            return NextResponse.json(
                { error: 'Content UID required' },
                { status: 400 }
            );
        }

        // Delete content
        const deleted = await deleteContent(contentUid);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Failed to delete content' },
                { status: 500 }
            );
        }

        // Log the action
        await logAdminAction(
            adminEmail,
            'content_deleted',
            contentUid,
            'content',
            { deletedContentUid: contentUid }
        );

        return NextResponse.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting content:', error);
        return NextResponse.json(
            { error: 'Failed to delete content' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { adminEmail, contentUid, action, reason, userId } = await req.json();

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        if (action === 'flag' && userId) {
            // Flag content as suspicious
            await flagUserActivity(userId, 'suspicious_content', reason);

            // Log the action
            await logAdminAction(
                adminEmail,
                'content_flagged',
                contentUid,
                'content',
                { reason }
            );

            return NextResponse.json({
                success: true,
                message: 'Content flagged successfully'
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error processing content action:', error);
        return NextResponse.json(
            { error: 'Failed to process action' },
            { status: 500 }
        );
    }
}
