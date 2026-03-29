import { db } from "@/configs/db";
import { StudentAccessTable } from "@/configs/schema";
import { eq } from "drizzle-orm";

/**
 * Validate ESU Student ID format
 * ESU Eid format: Should be alphanumeric, typically like "ESU/2024/001" or similar
 */
export function validateEidFormat(eid: string): boolean {
    if (!eid || eid.trim().length === 0) return false;
    // Accept alphanumeric with slashes and hyphens
    const eidRegex = /^[A-Za-z0-9/-]+$/;
    return eidRegex.test(eid) && eid.length >= 5 && eid.length <= 50;
}

/**
 * Check if ESU Eid already exists
 */
export async function checkEidExists(eid: string): Promise<boolean> {
    try {
        const result = await db
            .select()
            .from(StudentAccessTable)
            .where(eq(StudentAccessTable.eid, eid));

        return result.length > 0;
    } catch (error) {
        console.error('Error checking Eid:', error);
        return false;
    }
}

/**
 * Get student by ESU Eid
 */
export async function getStudentByEid(eid: string) {
    try {
        const result = await db
            .select()
            .from(StudentAccessTable)
            .where(eq(StudentAccessTable.eid, eid));

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error fetching student:', error);
        return null;
    }
}

/**
 * Register new student
 */
export async function registerStudent(data: {
    eid: string;
    studentName: string;
    email?: string;
    phone?: string;
    department?: string;
    section?: string;
    studentYear?: string;
}) {
    try {
        // Validate Eid format
        if (!validateEidFormat(data.eid)) {
            throw new Error('Invalid ESU Eid format');
        }

        // Check if already exists
        const exists = await checkEidExists(data.eid);
        if (exists) {
            throw new Error('Student with this Eid already registered');
        }

        // Create student record
        const result = await db
            .insert(StudentAccessTable)
            .values({
                eid: data.eid,
                studentName: data.studentName,
                email: data.email || null,
                phone: data.phone || null,
                department: data.department || null,
                section: data.section || null,
                studentYear: data.studentYear || null,
                status: 'pending'
            })
            .returning();

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error registering student:', error);
        throw error;
    }
}

/**
 * Check if student is approved
 */
export async function isStudentApproved(eid: string): Promise<boolean> {
    try {
        const student = await getStudentByEid(eid);
        return student ? student.status === 'approved' : false;
    } catch (error) {
        console.error('Error checking student approval:', error);
        return false;
    }
}

/**
 * Update student last accessed time
 */
export async function updateLastAccessed(eid: string) {
    try {
        await db
            .update(StudentAccessTable)
            .set({ lastAccessedAt: new Date() })
            .where(eq(StudentAccessTable.eid, eid));
    } catch (error) {
        console.error('Error updating last accessed:', error);
    }
}

/**
 * Get student access status
 */
export async function getStudentStatus(eid: string) {
    try {
        const student = await getStudentByEid(eid);
        if (!student) {
            return {
                found: false,
                status: 'not_found'
            };
        }

        return {
            found: true,
            status: student.status,
            studentName: student.studentName,
            section: student.section,
            department: student.department,
            studentYear: student.studentYear,
            approvalDate: student.approvalDate,
            rejectionReason: student.rejectionReason,
            documentUrl: student.approvalDocumentUrl
        };
    } catch (error) {
        console.error('Error getting student status:', error);
        return { found: false, status: 'error' };
    }
}
