-- Drizzle migration: Add ESU Student Access Management System
-- This migration creates tables for student registration, approvals, and resource access management

-- Create Student Access table (Main student records)
CREATE TABLE IF NOT EXISTS "studentAccess" (
    id SERIAL PRIMARY KEY,
    eid varchar(50) NOT NULL UNIQUE,
    "studentName" varchar(255) NOT NULL,
    email varchar(255),
    phone varchar(20),
    department varchar(100),
    section varchar(50),
    "studentYear" varchar(50),
    "registrationDate" timestamp DEFAULT NOW(),
    status varchar(20) DEFAULT 'pending',
    "approvedBy" varchar,
    "approvalDate" timestamp,
    "rejectionReason" varchar,
    "lastAccessedAt" timestamp,
    "approvalDocumentUrl" varchar
);

-- Create Section Resources table
CREATE TABLE IF NOT EXISTS "sectionResources" (
    id SERIAL PRIMARY KEY,
    "sectionName" varchar(50),
    "departmentName" varchar(100),
    "studentYear" varchar(50),
    "resourceType" varchar(50),
    "resourceTitle" varchar(255) NOT NULL,
    "resourceDescription" varchar,
    "resourceUrl" varchar,
    "fileSize" integer,
    "fileType" varchar(50),
    "createdBy" varchar,
    "createdAt" timestamp DEFAULT NOW(),
    "updatedAt" timestamp DEFAULT NOW(),
    "visibleToApproved" varchar(10) DEFAULT 'true',
    "downloadCount" integer DEFAULT 0
);

-- Create Student Access History table
CREATE TABLE IF NOT EXISTS "studentAccessHistory" (
    id SERIAL PRIMARY KEY,
    eid varchar(50) NOT NULL,
    "resourceId" integer,
    action varchar(50),
    "accessedAt" timestamp DEFAULT NOW(),
    duration integer,
    "ipAddress" varchar(50),
    "userAgent" varchar
);

-- Create Access Approval Logs table (Audit trail)
CREATE TABLE IF NOT EXISTS "accessApprovalLogs" (
    id SERIAL PRIMARY KEY,
    eid varchar(50) NOT NULL,
    "adminEmail" varchar NOT NULL,
    action varchar(20),
    reason varchar,
    sections varchar,
    "validityDays" integer,
    "approvalDocumentUrl" varchar,
    timestamp timestamp DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_studentAccess_eid ON "studentAccess"(eid);
CREATE INDEX IF NOT EXISTS idx_studentAccess_status ON "studentAccess"(status);
CREATE INDEX IF NOT EXISTS idx_studentAccess_section ON "studentAccess"(section);
CREATE INDEX IF NOT EXISTS idx_sectionResources_section ON "sectionResources"("sectionName");
CREATE INDEX IF NOT EXISTS idx_sectionResources_resourceType ON "sectionResources"("resourceType");
CREATE INDEX IF NOT EXISTS idx_accessHistory_eid ON "studentAccessHistory"(eid);
CREATE INDEX IF NOT EXISTS idx_approvalLogs_eid ON "accessApprovalLogs"(eid);
CREATE INDEX IF NOT EXISTS idx_approvalLogs_timestamp ON "accessApprovalLogs"(timestamp);
