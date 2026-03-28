import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth-utils';
import { getAnalytics } from '@/lib/admin-queries';
import { db } from '@/configs/db';
import {
    usersTable,
    WireframeToCodeTable,
    PlagiarismChecksTable
} from '@/configs/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const type = req.nextUrl.searchParams.get('type') || 'overview';

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        let data = {};

        switch (type) {
            case 'overview':
                data = await getAnalytics();
                break;

            case 'user-growth':
                // Get user creation data over time (last 30 days simulated)
                const allUsers = await db.select().from(usersTable);
                data = {
                    totalUsers: allUsers.length,
                    activeUsers: allUsers.filter(u => u.isActive === 'true').length,
                    trend: 'up'
                };
                break;

            case 'feature-usage':
                const wireframes = await db
                    .select()
                    .from(WireframeToCodeTable);
                const plagiarism = await db
                    .select()
                    .from(PlagiarismChecksTable);

                data = {
                    features: [
                        {
                            name: 'Wireframe to Code',
                            count: wireframes.length,
                            percentage: Math.round(
                                (wireframes.length / (wireframes.length + plagiarism.length)) * 100
                            ) || 0
                        },
                        {
                            name: 'Plagiarism Checker',
                            count: plagiarism.length,
                            percentage: Math.round(
                                (plagiarism.length / (wireframes.length + plagiarism.length)) * 100
                            ) || 0
                        }
                    ]
                };
                break;

            case 'credit-usage':
                const usersWithCredits = await db.select().from(usersTable);
                const totalCreditsIssued = usersWithCredits.reduce(
                    (sum, u) => sum + (u.credits || 0),
                    0
                );
                const totalCreditsConsumed = usersWithCredits.length * 3; // Approximate

                data = {
                    totalIssued: totalCreditsIssued,
                    totalConsumed: totalCreditsConsumed,
                    remaining: totalCreditsIssued - totalCreditsConsumed,
                    averagePerUser: Math.round(totalCreditsIssued / usersWithCredits.length)
                };
                break;

            default:
                data = await getAnalytics();
        }

        return NextResponse.json({
            success: true,
            type,
            data
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
