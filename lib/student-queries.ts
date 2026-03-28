import { db } from "@/configs/db";
import {
    StudentAccessTable,
    SectionResourcesTable,
    StudentAccessHistoryTable,
    AccessApprovalLogsTable
} from "@/configs/schema";
import { eq, desc, and, count } from "drizzle-orm";

/**
 * Get student by ESU ID
 */
export async function getStudentByEid(eid: string) {
    try {
        const students = await db
            .select()
            .from(StudentAccessTable)
            .where(eq(StudentAccessTable.eid, eid));

        return students.length > 0 ? students[0] : null;
    } catch (error) {
        console.error('Error fetching student:', error);
        return null;
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
 * Get resources for approved student by section and type
 */
export async function getStudentResources(eid: string, resourceType?: string) {
    try {
        const student = await getStudentByEid(eid);

        if (!student?.status || student.status !== 'approved') {
            return [];
        }

        let resources: any[];

        if (resourceType) {
            resources = await db
                .select()
                .from(SectionResourcesTable)
                .where(
                    and(
                        eq(SectionResourcesTable.sectionName, student.section || ''),
                        eq(SectionResourcesTable.departmentName, student.department || ''),
                        eq(SectionResourcesTable.visibleToApproved, 'true'),
                        eq(SectionResourcesTable.resourceType, resourceType)
                    )
                )
                .orderBy(desc(SectionResourcesTable.createdAt));
        } else {
            resources = await db
                .select()
                .from(SectionResourcesTable)
                .where(
                    and(
                        eq(SectionResourcesTable.sectionName, student.section || ''),
                        eq(SectionResourcesTable.departmentName, student.department || ''),
                        eq(SectionResourcesTable.visibleToApproved, 'true')
                    )
                )
                .orderBy(desc(SectionResourcesTable.createdAt));
        }

        return resources;
    } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
}

/**
 * Track resource access by student
 */
export async function trackResourceAccess(
    eid: string,
    resourceId: number,
    action: 'view' | 'download',
    ipAddress?: string
) {
    try {
        await db.insert(StudentAccessHistoryTable).values({
            eid,
            resourceId,
            action,
            ipAddress: ipAddress || 'unknown',
            accessedAt: new Date()
        });
    } catch (error) {
        console.error('Error tracking access:', error);
    }
}

/**
 * Get all pending student applications
 */
export async function getPendingApplications(limit = 50, offset = 0) {
    try {
        const students = await db
            .select()
            .from(StudentAccessTable)
            .where(eq(StudentAccessTable.status, 'pending'))
            .orderBy(desc(StudentAccessTable.registrationDate))
            .limit(limit)
            .offset(offset);

        const countResult = await db
            .select({ value: count() })
            .from(StudentAccessTable)
            .where(eq(StudentAccessTable.status, 'pending'));

        return { students, total: countResult[0]?.value || 0 };
    } catch (error) {
        console.error('Error fetching pending applications:', error);
        return { students: [], total: 0 };
    }
}

/**
 * Get approved students by section
 */
export async function getApprovedStudentsBySection(section: string) {
    try {
        const students = await db
            .select()
            .from(StudentAccessTable)
            .where(
                and(
                    eq(StudentAccessTable.status, 'approved'),
                    eq(StudentAccessTable.section, section)
                )
            )
            .orderBy(desc(StudentAccessTable.approvalDate));

        return students;
    } catch (error) {
        console.error('Error fetching approved students:', error);
        return [];
    }
}

/**
 * Approve student access
 */
export async function approveStudent(
    eid: string,
    adminEmail: string,
    sections: string,
    validityDays = 365,
    documentUrl?: string
) {
    try {
        // Update student access status
        const students = await db
            .update(StudentAccessTable)
            .set({
                status: 'approved',
                approvedBy: adminEmail,
                approvalDate: new Date(),
                approvalDocumentUrl: documentUrl
            })
            .where(eq(StudentAccessTable.eid, eid))
            .returning();

        // Log the approval action
        if (students.length > 0) {
            await db.insert(AccessApprovalLogsTable).values({
                eid,
                adminEmail,
                action: 'approved',
                sections,
                validityDays,
                approvalDocumentUrl: documentUrl,
                timestamp: new Date()
            });
        }

        return students.length > 0 ? students[0] : null;
    } catch (error) {
        console.error('Error approving student:', error);
        throw error;
    }
}

/**
 * Deny student access
 */
export async function denyStudent(
    eid: string,
    adminEmail: string,
    reason: string
) {
    try {
        // Update student access status
        const students = await db
            .update(StudentAccessTable)
            .set({
                status: 'denied',
                approvedBy: adminEmail,
                rejectionReason: reason,
                approvalDate: new Date()
            })
            .where(eq(StudentAccessTable.eid, eid))
            .returning();

        // Log the denial action
        if (students.length > 0) {
            await db.insert(AccessApprovalLogsTable).values({
                eid,
                adminEmail,
                action: 'denied',
                reason,
                timestamp: new Date()
            });
        }

        return students.length > 0 ? students[0] : null;
    } catch (error) {
        console.error('Error denying student:', error);
        throw error;
    }
}

/**
 * Get approval history for student
 */
export async function getStudentApprovalHistory(eid: string) {
    try {
        const logs = await db
            .select()
            .from(AccessApprovalLogsTable)
            .where(eq(AccessApprovalLogsTable.eid, eid))
            .orderBy(desc(AccessApprovalLogsTable.timestamp));

        return logs;
    } catch (error) {
        console.error('Error fetching approval history:', error);
        return [];
    }
}

/**
 * Add resource for a section
 */
export async function addSectionResource(data: {
    sectionName: string;
    departmentName: string;
    studentYear?: string;
    resourceType: string;
    resourceTitle: string;
    resourceDescription?: string;
    resourceUrl: string;
    fileSize?: number;
    fileType?: string;
    createdBy: string;
}) {
    try {
        const result = await db
            .insert(SectionResourcesTable)
            .values({
                sectionName: data.sectionName,
                departmentName: data.departmentName,
                studentYear: data.studentYear || null,
                resourceType: data.resourceType,
                resourceTitle: data.resourceTitle,
                resourceDescription: data.resourceDescription || null,
                resourceUrl: data.resourceUrl,
                fileSize: data.fileSize || 0,
                fileType: data.fileType || null,
                createdBy: data.createdBy,
                visibleToApproved: 'true'
            })
            .returning();

        return result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Error adding resource:', error);
        throw error;
    }
}

/**
 * Get student statistics for admin reports
 */
export async function getStudentStatistics() {
    try {
        const [
            totalResult,
            approvedResult,
            pendingResult,
            deniedResult
        ] = await Promise.all([
            db.select({ value: count() }).from(StudentAccessTable),
            db.select({ value: count() }).from(StudentAccessTable)
                .where(eq(StudentAccessTable.status, 'approved')),
            db.select({ value: count() }).from(StudentAccessTable)
                .where(eq(StudentAccessTable.status, 'pending')),
            db.select({ value: count() }).from(StudentAccessTable)
                .where(eq(StudentAccessTable.status, 'denied'))
        ]);

        // Get approved students grouped by section for section-wise count
        const bySectionResult = await db
            .select({
                section: StudentAccessTable.section,
                count: count()
            })
            .from(StudentAccessTable)
            .where(eq(StudentAccessTable.status, 'approved'))
            .groupBy(StudentAccessTable.section);

        const bySection: Record<string, number> = {};
        bySectionResult.forEach(row => {
            if (row.section) {
                bySection[row.section] = row.count;
            }
        });

        return {
            total: totalResult[0]?.value || 0,
            approved: approvedResult[0]?.value || 0,
            pending: pendingResult[0]?.value || 0,
            denied: deniedResult[0]?.value || 0,
            bySection
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return { total: 0, approved: 0, pending: 0, denied: 0, bySection: {} };
    }
}
