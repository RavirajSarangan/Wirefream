import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/auth-utils';
import { denyStudent, getStudentByEid } from '@/lib/student-queries';

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const eid = searchParams.get('eid');
        const { adminEmail, reason } = await req.json();

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        if (!eid || !reason) {
            return NextResponse.json(
                { error: 'Student Eid and denial reason required' },
                { status: 400 }
            );
        }

        // Check if student exists
        const student = await getStudentByEid(eid);
        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        if (student.status !== 'pending') {
            return NextResponse.json(
                { error: 'Can only deny pending applications' },
                { status: 409 }
            );
        }

        // Deny student
        const deniedStudent = await denyStudent(eid, adminEmail, reason);

        if (!deniedStudent) {
            return NextResponse.json(
                { error: 'Failed to deny student' },
                { status: 500 }
            );
        }

        // Log the action
        await logAdminAction(
            adminEmail,
            'student_denied',
            eid,
            'user',
            {
                studentName: student.studentName,
                section: student.section,
                reason
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Student application denied',
            student: {
                eid: deniedStudent.eid,
                studentName: deniedStudent.studentName,
                status: deniedStudent.status,
                rejectionReason: deniedStudent.rejectionReason
            }
        });

    } catch (error) {
        console.error('Error denying student:', error);
        return NextResponse.json(
            { error: 'Failed to deny student' },
            { status: 500 }
        );
    }
}
