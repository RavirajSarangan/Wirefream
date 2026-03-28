import { NextRequest, NextResponse } from 'next/server';
import { getStudentStatus } from '@/lib/student-auth-utils';

export async function GET(req: NextRequest) {
    try {
        const eid = req.nextUrl.searchParams.get('eid');

        if (!eid) {
            return NextResponse.json(
                { error: 'ESU Eid parameter required' },
                { status: 400 }
            );
        }

        const status = await getStudentStatus(eid);

        return NextResponse.json({
            success: true,
            eid,
            ...status
        });

    } catch (error) {
        console.error('Error checking status:', error);
        return NextResponse.json(
            { error: 'Failed to check student status' },
            { status: 500 }
        );
    }
}
