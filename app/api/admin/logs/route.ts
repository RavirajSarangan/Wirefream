import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth-utils';
import { getAuditLogs, getUserFlags } from '@/lib/admin-queries';
import { db } from '@/configs/db';
import { IPAccessLogsTable } from '@/configs/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const adminEmail = req.nextUrl.searchParams.get('adminEmail');
        const logType = req.nextUrl.searchParams.get('type') || 'audit';
        const limit = Number.parseInt(req.nextUrl.searchParams.get('limit') || '50');
        const offset = Number.parseInt(req.nextUrl.searchParams.get('offset') || '0');

        // Verify admin access
        if (!adminEmail || !(await verifyAdminAccess(adminEmail))) {
            return NextResponse.json(
                { error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        let logs: any = [];
        let total = 0;

        switch (logType) {
            case 'audit': {
                const auditData = await getAuditLogs(limit, offset);
                logs = auditData.logs;
                total = auditData.total;
                break;
            }

            case 'access': {
                const accessLogs = await db
                    .select()
                    .from(IPAccessLogsTable)
                    .orderBy(desc(IPAccessLogsTable.createdAt))
                    .limit(limit)
                    .offset(offset);

                const allAccessLogs = await db.select().from(IPAccessLogsTable);

                logs = accessLogs;
                total = allAccessLogs.length;
                break;
            }

            case 'suspicious': {
                const flags = await getUserFlags();
                logs = flags.slice(offset, offset + limit);
                total = flags.length;
                break;
            }

            default: {
                const defaultLogs = await getAuditLogs(limit, offset);
                logs = defaultLogs.logs;
                total = defaultLogs.total;
            }
        }

        return NextResponse.json({
            success: true,
            type: logType,
            logs,
            total,
            limit,
            offset
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
