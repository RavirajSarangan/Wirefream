import { db } from "@/configs/db";
import { usersTable } from "@/configs/schema";
import { eq } from "drizzle-orm";

/**
 * Check if a user has admin role
 */
export async function isUserAdmin(email: string): Promise<boolean> {
    try {
        const result = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

        if (result.length === 0) return false;
        return result[0].role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
    try {
        const result = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Check if user is active
 */
export async function isUserActive(email: string): Promise<boolean> {
    try {
        const user = await getUserByEmail(email);
        if (!user) return false;
        return user.isActive === 'true';
    } catch (error) {
        console.error('Error checking user active status:', error);
        return false;
    }
}

/**
 * Verify admin access - both authenticated and has admin role
 */
export async function verifyAdminAccess(email: string): Promise<boolean> {
    if (!email) return false;

    const isAdmin = await isUserAdmin(email);
    const isActive = await isUserActive(email);

    return isAdmin && isActive;
}

/**
 * Log admin action
 */
export async function logAdminAction(
    adminEmail: string,
    action: string,
    targetUserId: string | null,
    targetType: 'user' | 'content' | 'system',
    details: any
) {
    try {
        const { AdminAuditLogsTable } = await import('@/configs/schema');

        await db.insert(AdminAuditLogsTable).values({
            adminEmail,
            action,
            targetUserId: targetUserId || undefined,
            targetType,
            details: details || {},
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}

/**
 * Update user last login
 */
export async function updateLastLogin(email: string) {
    try {
        await db
            .update(usersTable)
            .set({ lastLoginAt: new Date() })
            .where(eq(usersTable.email, email));
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}
