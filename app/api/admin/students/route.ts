import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth-utils';
import { getPendingApplications } from '@/lib/student-queries';

export async function GET(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const status = req.nextUrl.searchParams.get('status') || 'pending'; // pending, approved, all
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        // Get pending applications
        if (status === 'pending') {
            const { students, total } = await getPendingApplications(limit, offset);

            return NextResponse.json({
                success: true,
                status: 'pending',
                students: students.map(s => ({
                    id: s.id,
                    eid: s.eid,
                    studentName: s.studentName,
                    email: s.email,
                    phone: s.phone,
                    department: s.department,
                    section: s.section,
                    studentYear: s.studentYear,
                    registrationDate: s.registrationDate,
                    status: s.status
                })),
                total,
                limit,
                offset
            });
        }

        // For other statuses, fetch all and filter
        const { StudentAccessTable } = await import('@/configs/schema');
        const { db } = await import('@/configs/db');
        const { eq, desc } = await import('drizzle-orm');

        const query = status === 'all'
            ? db.select().from(StudentAccessTable).orderBy(desc(StudentAccessTable.registrationDate))
            : db.select().from(StudentAccessTable).where(eq(StudentAccessTable.status, status)).orderBy(desc(StudentAccessTable.registrationDate));

        const results = await query.limit(limit).offset(offset);

        return NextResponse.json({
            success: true,
            status,
            students: results.map(s => ({
                id: s.id,
                eid: s.eid,
                studentName: s.studentName,
                email: s.email,
                phone: s.phone,
                department: s.department,
                section: s.section,
                studentYear: s.studentYear,
                registrationDate: s.registrationDate,
                status: s.status,
                approvalDate: s.approvalDate,
                approvedBy: s.approvedBy
            })),
            limit,
            offset
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { error: 'Failed to fetch student applications' },
            { status: 500 }
        );
    }
}
