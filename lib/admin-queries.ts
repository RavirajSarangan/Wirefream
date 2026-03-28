import { db } from "@/configs/db";
import {
    usersTable,
    WireframeToCodeTable,
    PlagiarismChecksTable,
    CoverPagesTable,
    AdminAuditLogsTable,
    UserSuspiciousFlagsTable
} from "@/configs/schema";
import { eq, desc, like, or, count, sum, sql } from "drizzle-orm";

/**
 * Fetch all users with optional filters
 */
export async function fetchAllUsers(
    limit = 50,
    offset = 0,
    searchTerm?: string
) {
    try {
        let users: any[];

        if (searchTerm) {
            users = await db
                .select()
                .from(usersTable)
                .where(
                    or(
                        like(usersTable.email, `%${searchTerm}%`),
                        like(usersTable.name, `%${searchTerm}%`)
                    )
                )
                .orderBy(desc(usersTable.id))
                .limit(limit)
                .offset(offset);
        } else {
            users = await db
                .select()
                .from(usersTable)
                .orderBy(desc(usersTable.id))
                .limit(limit)
                .offset(offset);
        }

        const countResult = await db
            .select({ value: count() })
            .from(usersTable);
        const total = countResult[0]?.value || 0;

        return { users, total };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { users: [], total: 0 };
    }
}

/**
 * Fetch user by ID
 */
export async function fetchUserById(id: number) {
    try {
        const result = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, id));

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Update user
 */
export async function updateUser(
    id: number,
    data: {
        credits?: number;
        role?: 'user' | 'admin';
        isActive?: 'true' | 'false';
    }
) {
    try {
        const result = await db
            .update(usersTable)
            .set({
                ...(data.credits !== undefined && { credits: data.credits }),
                ...(data.role && { role: data.role }),
                ...(data.isActive && { isActive: data.isActive })
            })
            .where(eq(usersTable.id, id))
            .returning();

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error updating user:', error);
        return null;
    }
}

/**
 * Delete user
 */
export async function deleteUser(id: number) {
    try {
        await db.delete(usersTable).where(eq(usersTable.id, id));
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
}

/**
 * Get all user-generated content
 */
export async function fetchAllContent(limit = 50, offset = 0) {
    try {
        const [wireframes, plagiarism, coverPages] = await Promise.all([
            db
                .select()
                .from(WireframeToCodeTable)
                .orderBy(desc(WireframeToCodeTable.createdAt))
                .limit(limit)
                .offset(offset),
            db
                .select()
                .from(PlagiarismChecksTable)
                .orderBy(desc(PlagiarismChecksTable.createdAt))
                .limit(limit)
                .offset(offset),
            db
                .select()
                .from(CoverPagesTable)
                .orderBy(desc(CoverPagesTable.createdAt))
                .limit(limit)
                .offset(offset)
        ]);

        const content = [
            ...wireframes.map(w => ({ ...w, type: 'wireframe-to-code' })),
            ...plagiarism.map(p => ({ ...p, type: 'plagiarism-check' })),
            ...coverPages.map(c => ({ ...c, type: 'cover-page' }))
        ].sort(
            (a, b) =>
                new Date((b as any).createdAt).getTime() -
                new Date((a as any).createdAt).getTime()
        );

        return { content, total: content.length };
    } catch (error) {
        console.error('Error fetching content:', error);
        return { content: [], total: 0 };
    }
}

/**
 * Delete content by UID
 */
export async function deleteContent(uid: string) {
    try {
        await Promise.all([
            db.delete(WireframeToCodeTable).where(eq(WireframeToCodeTable.uid, uid)),
            db.delete(PlagiarismChecksTable).where(eq(PlagiarismChecksTable.uid, uid)),
            db.delete(CoverPagesTable).where(eq(CoverPagesTable.uid, uid))
        ]);
        return true;
    } catch (error) {
        console.error('Error deleting content:', error);
        return false;
    }
}

/**
 * Get analytics data
 */
export async function getAnalytics() {
    try {
        const [
            userCount,
            activeCount,
            adminCount,
            wireframeCount,
            plagiarismCount,
            coverPageCount,
            creditsSumResult
        ] = await Promise.all([
            db.select({ value: count() }).from(usersTable),
            db.select({ value: count() }).from(usersTable)
                .where(eq(usersTable.isActive, 'true')),
            db.select({ value: count() }).from(usersTable)
                .where(eq(usersTable.role, 'admin')),
            db.select({ value: count() }).from(WireframeToCodeTable),
            db.select({ value: count() }).from(PlagiarismChecksTable),
            db.select({ value: count() }).from(CoverPagesTable),
            db.select({ total: sum(usersTable.credits) }).from(usersTable)
        ]);

        const totalCreditsIssued = creditsSumResult[0]?.total ? Number(creditsSumResult[0].total) : 0;

        return {
            totalUsers: userCount[0]?.value || 0,
            activeUsers: activeCount[0]?.value || 0,
            adminCount: adminCount[0]?.value || 0,
            todaySignups: 0, // Would need createdAt tracking
            totalCreditsIssued: totalCreditsIssued,
            wireframesGenerated: wireframeCount[0]?.value || 0,
            plagiarismChecksRun: plagiarismCount[0]?.value || 0,
            coverPagesCreated: coverPageCount[0]?.value || 0
        };
    } catch (error) {
        console.error('Error getting analytics:', error);
        return {
            totalUsers: 0,
            activeUsers: 0,
            adminCount: 0,
            todaySignups: 0,
            totalCreditsIssued: 0,
            wireframesGenerated: 0,
            plagiarismChecksRun: 0,
            coverPagesCreated: 0
        };
    }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(limit = 50, offset = 0) {
    try {
        const logs = await db
            .select()
            .from(AdminAuditLogsTable)
            .orderBy(desc(AdminAuditLogsTable.createdAt))
            .limit(limit)
            .offset(offset);

        const countResult = await db
            .select({ value: count() })
            .from(AdminAuditLogsTable);

        return { logs, total: countResult[0]?.value || 0 };
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return { logs: [], total: 0 };
    }
}

/**
 * Get user suspicious flags
 */
export async function getUserFlags(userId?: number) {
    try {
        let flags: any[];

        if (userId) {
            flags = await db
                .select()
                .from(UserSuspiciousFlagsTable)
                .where(eq(UserSuspiciousFlagsTable.userId, userId))
                .orderBy(desc(UserSuspiciousFlagsTable.flaggedAt));
        } else {
            flags = await db
                .select()
                .from(UserSuspiciousFlagsTable)
                .orderBy(desc(UserSuspiciousFlagsTable.flaggedAt));
        }

        return flags;
    } catch (error) {
        console.error('Error fetching user flags:', error);
        return [];
    }
}

/**
 * Flag user for suspicious activity
 */
export async function flagUserActivity(
    userId: number,
    flagType: string,
    description: string
) {
    try {
        const result = await db
            .insert(UserSuspiciousFlagsTable)
            .values({
                userId,
                flagType,
                description,
                status: 'pending'
            })
            .returning();

        // Increment suspiciousActivity counter using SQL
        await db
            .update(usersTable)
            .set({
                suspiciousActivity: sql`${usersTable.suspiciousActivity} + 1`
            })
            .where(eq(usersTable.id, userId));

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error flagging user:', error);
        return null;
    }
}
