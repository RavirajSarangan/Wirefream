import { NextRequest, NextResponse } from 'next/server';
import { validateEidFormat, registerStudent, checkEidExists } from '@/lib/student-auth-utils';

export async function POST(req: NextRequest) {
    try {
        const { eid, studentName, email, phone, department, section, studentYear } = await req.json();

        // Validate required fields
        if (!eid || !studentName) {
            return NextResponse.json(
                { error: 'ESU Eid and Student Name are required' },
                { status: 400 }
            );
        }

        // Validate ESU Eid format
        if (!validateEidFormat(eid)) {
            return NextResponse.json(
                { error: 'Invalid ESU Eid format. Must be alphanumeric with slashes/hyphens (5-50 chars)' },
                { status: 400 }
            );
        }

        // Check if Eid already exists
        const exists = await checkEidExists(eid);
        if (exists) {
            return NextResponse.json(
                { error: 'This ESU Eid is already registered' },
                { status: 409 }
            );
        }

        // Register student
        const student = await registerStudent({
            eid,
            studentName,
            email: email || undefined,
            phone: phone || undefined,
            department: department || undefined,
            section: section || undefined,
            studentYear: studentYear || undefined
        });

        if (!student) {
            return NextResponse.json(
                { error: 'Failed to register student' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Registration successful. Please wait for admin approval.',
            student: {
                id: student.id,
                eid: student.eid,
                studentName: student.studentName,
                status: student.status,
                registrationDate: student.registrationDate
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to register student' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const eid = req.nextUrl.searchParams.get('eid');

        if (!eid) {
            return NextResponse.json(
                { error: 'ESU Eid parameter required' },
                { status: 400 }
            );
        }

        const { getStudentByEid } = await import('@/lib/student-auth-utils');
        const student = await getStudentByEid(eid);

        if (!student) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            student: {
                eid: student.eid,
                studentName: student.studentName,
                email: student.email,
                phone: student.phone,
                department: student.department,
                section: student.section,
                studentYear: student.studentYear,
                status: student.status,
                registrationDate: student.registrationDate,
                approvalDate: student.approvalDate
            }
        });

    } catch (error) {
        console.error('Error fetching student:', error);
        return NextResponse.json(
            { error: 'Failed to fetch student information' },
            { status: 500 }
        );
    }
}
