import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess, logAdminAction } from '@/lib/auth-utils';
import { approveStudent, getStudentByEid } from '@/lib/student-queries';

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const eid = searchParams.get('eid');
        const { adminEmail, reason, sections, validityDays, documentUrl } = await req.json();

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        if (!eid) {
            return NextResponse.json(
                { error: 'Student Eid required' },
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

        if (student.status === 'approved') {
            return NextResponse.json(
                { error: 'Student already approved' },
                { status: 409 }
            );
        }

        // Approve student
        const approvedStudent = await approveStudent(
            eid,
            adminEmail,
            sections || student.section || '',
            validityDays || 365,
            documentUrl
        );

        if (!approvedStudent) {
            return NextResponse.json(
                { error: 'Failed to approve student' },
                { status: 500 }
            );
        }

        // Log the action
        await logAdminAction(
            adminEmail,
            'student_approved',
            eid,
            'user',
            {
                studentName: student.studentName,
                section: student.section,
                department: student.department,
                reason
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Student access approved successfully',
            student: {
                eid: approvedStudent.eid,
                studentName: approvedStudent.studentName,
                section: approvedStudent.section,
                department: approvedStudent.department,
                status: approvedStudent.status,
                approvalDate: approvedStudent.approvalDate,
                approvedBy: approvedStudent.approvedBy,
                documentUrl: approvedStudent.approvalDocumentUrl
            }
        });

    } catch (error) {
        console.error('Error approving student:', error);
        return NextResponse.json(
            { error: 'Failed to approve student' },
            { status: 500 }
        );
    }
}
