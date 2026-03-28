import { NextRequest, NextResponse } from 'next/server';
import { getStudentResources, isStudentApproved, trackResourceAccess } from '@/lib/student-queries';

export async function GET(req: NextRequest) {
    try {
        const eid = req.nextUrl.searchParams.get('eid');
        const resourceType = req.nextUrl.searchParams.get('type'); // 'study-docs', 'video', 'assignments', 'course-info'
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        if (!eid) {
            return NextResponse.json(
                { error: 'ESU Eid parameter required' },
                { status: 400 }
            );
        }

        // Check if student is approved
        const approved = await isStudentApproved(eid);
        if (!approved) {
            return NextResponse.json(
                { error: 'Student access not approved. Please wait for admin approval.' },
                { status: 403 }
            );
        }

        // Get resources for student's section
        const resources = await getStudentResources(eid, resourceType || undefined);

        // Track access
        await trackResourceAccess(eid, 0, 'view', ipAddress);

        return NextResponse.json({
            success: true,
            eid,
            resourceType: resourceType || 'all',
            resourceCount: resources.length,
            resources: resources.map(r => ({
                id: r.id,
                title: r.resourceTitle,
                description: r.resourceDescription,
                type: r.resourceType,
                url: r.resourceUrl,
                fileType: r.fileType,
                fileSize: r.fileSize,
                downloads: r.downloadCount,
                createdAt: r.createdAt
            }))
        });

    } catch (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resources' },
            { status: 500 }
        );
    }
}
