-- Drizzle migration: Add admin features and fields
-- This migration adds admin functionality to the users table and creates new admin-related tables

-- Add admin fields to users table (using BEGIN block for safety)
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE "users" ADD COLUMN "role" varchar DEFAULT 'user';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='isActive') THEN
        ALTER TABLE "users" ADD COLUMN "isActive" varchar DEFAULT 'true';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='suspiciousActivity') THEN
        ALTER TABLE "users" ADD COLUMN "suspiciousActivity" integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lastLoginAt') THEN
        ALTER TABLE "users" ADD COLUMN "lastLoginAt" timestamp;
    END IF;
END $$;

COMMIT;

-- Create Admin Audit Logs table
CREATE TABLE IF NOT EXISTS "adminAuditLogs" (
    id SERIAL PRIMARY KEY,
    "adminEmail" varchar NOT NULL,
    action varchar NOT NULL,
    "targetUserId" varchar,
    "targetType" varchar,
    details json,
    "createdAt" timestamp DEFAULT NOW()
);

-- Create User Suspicious Flags table
CREATE TABLE IF NOT EXISTS "userSuspiciousFlags" (
    id SERIAL PRIMARY KEY,
    "userId" integer,
    "flagType" varchar,
    description varchar,
    "flaggedAt" timestamp DEFAULT NOW(),
    "resolvedAt" timestamp,
    "resolvedBy" varchar,
    status varchar DEFAULT 'pending'
);

-- Create Admin Reports table
CREATE TABLE IF NOT EXISTS "adminReports" (
    id SERIAL PRIMARY KEY,
    "reportType" varchar,
    "generatedBy" varchar,
    description varchar,
    data json,
    "createdAt" timestamp DEFAULT NOW(),
    "viewedAt" timestamp,
    "expiresAt" timestamp
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_adminAuditLogs_adminEmail ON "adminAuditLogs"("adminEmail");
CREATE INDEX IF NOT EXISTS idx_adminAuditLogs_createdAt ON "adminAuditLogs"("createdAt");
CREATE INDEX IF NOT EXISTS idx_userSuspiciousFlags_userId ON "userSuspiciousFlags"("userId");
CREATE INDEX IF NOT EXISTS idx_users_role ON "users"(role);
CREATE INDEX IF NOT EXISTS idx_users_isActive ON "users"("isActive");
