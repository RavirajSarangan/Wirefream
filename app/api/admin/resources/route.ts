import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth-utils';
import { db } from '@/configs/db';
import { SectionResourcesTable } from '@/configs/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const { adminEmail, section, department, resourceTitle, resourceDescription, resourceUrl, resourceType, fileSize, fileType } = await req.json();

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        if (!section || !resourceTitle || !resourceUrl || !resourceType) {
            return NextResponse.json(
                { error: 'Required fields: section, resourceTitle, resourceUrl, resourceType' },
                { status: 400 }
            );
        }

        // Add resource
        const resource = await db.insert(SectionResourcesTable).values({
            sectionName: section,
            departmentName: department,
            resourceTitle,
            resourceDescription,
            resourceUrl,
            resourceType,
            fileSize: fileSize ? Number.parseInt(fileSize) : 0,
            fileType,
            createdBy: adminEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
            visibleToApproved: 'true',
            downloadCount: 0,
        }).returning();

        return NextResponse.json({
            success: true,
            message: 'Resource added successfully',
            resource: resource[0],
        }, { status: 201 });

    } catch (error) {
        console.error('Error adding resource:', error);
        return NextResponse.json(
            { error: 'Failed to add resource' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const section = req.nextUrl.searchParams.get('section');
        const limit = Number.parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const offset = Number.parseInt(req.nextUrl.searchParams.get('offset') || '0');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        // Get resources
        let resources: any[];

        if (section) {
            resources = await db
                .select()
                .from(SectionResourcesTable)
                .where(eq(SectionResourcesTable.sectionName, section))
                .limit(limit)
                .offset(offset);
        } else {
            resources = await db
                .select()
                .from(SectionResourcesTable)
                .limit(limit)
                .offset(offset);
        }

        return NextResponse.json({
            success: true,
            resources,
            count: resources.length,
        });

    } catch (error) {
        console.error('Error fetching resources:', error);
        return NextResponse.json(
            { error: 'Failed to fetch resources' },
            { status: 500 }
        );
    }
}
