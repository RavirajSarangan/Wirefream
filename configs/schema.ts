import { integer, json, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    credits: integer().default(0),
    role: varchar({ length: 50 }).default('user'), // 'user' or 'admin'
    isActive: varchar({ length: 10 }).default('true'), // 'true' or 'false' - for blocking users
    suspiciousActivity: integer().default(0), // counter for flagged activities
    lastLoginAt: timestamp() // for audit trail
});

export const WireframeToCodeTable = pgTable("wireframeToCode", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    imageUrl: varchar(),
    model: varchar(),
    description: varchar(),
    code: json(),
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});


export const PlagiarismChecksTable = pgTable("plagiarismChecks", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    originalText: varchar(), // Large text content
    fileName: varchar(),
    fileUrl: varchar(), // Firebase Storage URL (optional)
    similarityScore: integer(), // 0-100 percentage
    aiDetectionScore: integer(), // 0-100 AI-generated content likelihood
    matchedSources: json(), // Array of matched URLs and texts
    sourceBreakdown: json(), // Detailed source analysis with URLs, types, percentages
    aiAnalysis: json(), // Detailed AI findings
    paraphrasingDetected: varchar(), // 'yes', 'no', 'partial'
    aiModelUsed: varchar(), // Which AI model was used for analysis
    status: varchar(), // 'processing', 'completed', 'failed'
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});

export const CodeRefinementsTable = pgTable("codeRefinements", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    wireframeId: integer().references(() => WireframeToCodeTable.id),
    userMessage: varchar(), // User's refinement request
    aiResponse: varchar(), // AI's refined code
    codeVersion: integer(), // Version number (1, 2, 3...)
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});

export const AppFlowGeneratorTable = pgTable("appFlowGenerator", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    appName: varchar(),
    appDescription: varchar(), // User's input description
    screenList: json(), // Array of screens with name, purpose, elements
    flowDiagramData: json(), // Mermaid syntax and diagram structure
    userJourneyData: json(), // User journey map steps
    model: varchar(), // AI model used
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});

export const CoverPagesTable = pgTable("coverPages", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    institutionName: varchar(),
    title: varchar(),
    subject: varchar(),
    studentName: varchar(),
    indexNumber: varchar(),
    className: varchar(),
    teacherName: varchar(),
    date: varchar(),
    template: varchar(), // classic, modern, minimal, formal, creative, professional
    pageSize: varchar(), // a4, letter, legal, a3
    logoUrl: varchar(), // Firebase Storage URL for uploaded logo
    aiModel: varchar(), // AI model used
    generationMethod: varchar(), // 'manual' or 'prompt'
    originalPrompt: varchar(), // Original AI prompt if generated via AI
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});

// PDF Password Protection
export const ProtectedPDFsTable = pgTable("protectedPDFs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    originalFileName: varchar(),
    originalFileUrl: varchar(), // Firebase Storage URL
    protectedFileUrl: varchar(), // Firebase Storage URL for encrypted PDF
    protectionType: varchar(), // 'password', 'certificate', 'both'
    permissions: json(), // { print: boolean, copy: boolean, modify: boolean, annotate: boolean }
    encryptionLevel: varchar(), // '128bit', '256bit'
    fileSize: integer(), // in bytes
    expiryDate: timestamp(), // Optional expiry for access
    downloadCount: integer().default(0),
    status: varchar(), // 'processing', 'completed', 'failed', 'expired'
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});



// IP Whitelist for Security
export const IPWhitelistTable = pgTable("ipWhitelist", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    ipAddress: varchar(), // Single IP or CIDR range
    ipType: varchar(), // 'single', 'range', 'cidr'
    description: varchar(), // User's note about this IP
    isActive: varchar().default('true'), // 'true' or 'false'
    lastUsedAt: timestamp(),
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});

// IP Access Logs
export const IPAccessLogsTable = pgTable("ipAccessLogs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    ipAddress: varchar(),
    userAgent: varchar(),
    endpoint: varchar(), // API endpoint accessed
    method: varchar(), // GET, POST, etc.
    statusCode: integer(),
    country: varchar(), // Geo-resolved country
    city: varchar(), // Geo-resolved city
    isAllowed: varchar(), // 'true' or 'false'
    denialReason: varchar(), // If blocked, why
    createdAt: timestamp().defaultNow()
});

// Two-Factor Authentication Settings
export const TwoFactorAuthTable = pgTable("twoFactorAuth", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    userEmail: varchar().notNull(),
    isEnabled: varchar().default('false'), // 'true' or 'false'
    secretKey: varchar(), // Encrypted TOTP secret
    backupCodes: json(), // Array of encrypted backup codes
    backupCodesUsed: json(), // Array of used backup code indices
    preferredMethod: varchar().default('authenticator'), // 'authenticator', 'sms', 'email'
    phoneNumber: varchar(), // For SMS verification
    lastVerifiedAt: timestamp(),
    failedAttempts: integer().default(0),
    lockedUntil: timestamp(),
    trustedDevices: json(), // Array of device fingerprints
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow()
});

// Admin Audit Logs - Track all admin actions
export const AdminAuditLogsTable = pgTable("adminAuditLogs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    adminEmail: varchar().notNull(),
    action: varchar().notNull(), // e.g., 'user_deleted', 'content_removed', 'user_role_changed'
    targetUserId: varchar(), // user/content affected
    targetType: varchar(), // 'user', 'content', 'system'
    details: json(), // detailed info about the action
    createdAt: timestamp().defaultNow()
});

// User Suspicious Flags - Track flagged activities
export const UserSuspiciousFlagsTable = pgTable("userSuspiciousFlags", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer(),
    flagType: varchar(), // e.g., 'plagiarism_abuse', 'spam', 'inappropriate_content'
    description: varchar(),
    flaggedAt: timestamp().defaultNow(),
    resolvedAt: timestamp(),
    resolvedBy: varchar(),
    status: varchar().default('pending') // 'pending', 'resolved', 'dismissed'
});

// Admin Reports - Generated reports
export const AdminReportsTable = pgTable("adminReports", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    reportType: varchar(), // 'user_activity', 'plagiarism_trends', 'feature_usage', 'system_health'
    generatedBy: varchar(), // admin email
    description: varchar(),
    data: json(), // Report data/findings
    createdAt: timestamp().defaultNow(),
    viewedAt: timestamp(),
    expiresAt: timestamp()
});

// ESU Student Access Management - Student registrations
export const StudentAccessTable = pgTable("studentAccess", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    eid: varchar({ length: 50 }).notNull().unique(), // ESU Student ID - REQUIRED & UNIQUE
    studentName: varchar({ length: 255 }).notNull(), // Student name - REQUIRED
    email: varchar({ length: 255 }), // Optional email
    phone: varchar({ length: 20 }), // Optional phone
    department: varchar({ length: 100 }), // e.g., 'Engineering', 'Management', 'Science'
    section: varchar({ length: 50 }), // e.g., 'I', 'II', 'III'
    studentYear: varchar({ length: 50 }), // e.g., 'First Year', 'Second Year', 'Final Year'
    registrationDate: timestamp().defaultNow(),
    status: varchar({ length: 20 }).default('pending'), // 'pending', 'approved', 'denied'
    approvedBy: varchar(), // admin email who approved
    approvalDate: timestamp(),
    rejectionReason: varchar(), // if denied
    lastAccessedAt: timestamp(),
    approvalDocumentUrl: varchar() // URL to generated approval document
});

// Section Resources - Study materials and content
export const SectionResourcesTable = pgTable("sectionResources", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sectionName: varchar({ length: 50 }), // e.g., 'I', 'II', 'III'
    departmentName: varchar({ length: 100 }), // e.g., 'Engineering'
    studentYear: varchar({ length: 50 }), // e.g., 'First Year'
    resourceType: varchar({ length: 50 }), // 'study-docs', 'video', 'assignments', 'course-info'
    resourceTitle: varchar({ length: 255 }).notNull(),
    resourceDescription: varchar(),
    resourceUrl: varchar(), // Firebase Storage URL or external link
    fileSize: integer(), // in bytes
    fileType: varchar({ length: 50 }), // e.g., 'pdf', 'mp4', 'docx'
    createdBy: varchar(), // admin or instructor email
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow(),
    visibleToApproved: varchar({ length: 10 }).default('true'), // 'true' or 'false'
    downloadCount: integer().default(0)
});

// Student Access History - Track resource access
export const StudentAccessHistoryTable = pgTable("studentAccessHistory", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    eid: varchar({ length: 50 }).notNull(), // Student ESU ID
    resourceId: integer(), // Reference to SectionResourcesTable
    action: varchar({ length: 50 }), // 'view', 'download'
    accessedAt: timestamp().defaultNow(),
    duration: integer(), // time spent in seconds
    ipAddress: varchar({ length: 50 }),
    userAgent: varchar() // browser/device info
});

// Access Approval Logs - Audit trail for student approvals
export const AccessApprovalLogsTable = pgTable("accessApprovalLogs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    eid: varchar({ length: 50 }).notNull(), // Student ESU ID
    adminEmail: varchar().notNull(), // Admin who approved/denied
    action: varchar({ length: 20 }), // 'approved', 'denied'
    reason: varchar(), // approval or rejection reason
    sections: varchar(), // approved sections (comma-separated)
    validityDays: integer(), // days for which access is valid
    approvalDocumentUrl: varchar(), // link to generated document
    timestamp: timestamp().defaultNow()
});
