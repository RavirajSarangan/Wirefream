CREATE TABLE "backgroundRemovals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "backgroundRemovals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"originalImageUrl" varchar,
	"processedImageUrl" varchar,
	"originalFileName" varchar,
	"outputFormat" varchar,
	"backgroundType" varchar,
	"backgroundColor" varchar,
	"processingTime" integer,
	"originalFileSize" integer,
	"processedFileSize" integer,
	"aiProvider" varchar,
	"status" varchar,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "designImports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "designImports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"designPlatform" varchar,
	"designFileId" varchar,
	"designFileName" varchar,
	"designThumbnailUrl" varchar,
	"selectedFrames" json,
	"exportedAssetsUrl" varchar,
	"extractedComponents" json,
	"styleGuide" json,
	"lastSyncedAt" timestamp,
	"connectionStatus" varchar,
	"oauthToken" varchar,
	"oauthRefreshToken" varchar,
	"tokenExpiresAt" timestamp,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ipAccessLogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ipAccessLogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"ipAddress" varchar,
	"userAgent" varchar,
	"endpoint" varchar,
	"method" varchar,
	"statusCode" integer,
	"country" varchar,
	"city" varchar,
	"isAllowed" varchar,
	"denialReason" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ipWhitelist" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ipWhitelist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"ipAddress" varchar,
	"ipType" varchar,
	"description" varchar,
	"isActive" varchar DEFAULT 'true',
	"lastUsedAt" timestamp,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protectedPDFs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "protectedPDFs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"originalFileName" varchar,
	"originalFileUrl" varchar,
	"protectedFileUrl" varchar,
	"protectionType" varchar,
	"permissions" json,
	"encryptionLevel" varchar,
	"fileSize" integer,
	"expiryDate" timestamp,
	"downloadCount" integer DEFAULT 0,
	"status" varchar,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "twoFactorAuth" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "twoFactorAuth_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"userEmail" varchar NOT NULL,
	"isEnabled" varchar DEFAULT 'false',
	"secretKey" varchar,
	"backupCodes" json,
	"backupCodesUsed" json,
	"preferredMethod" varchar DEFAULT 'authenticator',
	"phoneNumber" varchar,
	"lastVerifiedAt" timestamp,
	"failedAttempts" integer DEFAULT 0,
	"lockedUntil" timestamp,
	"trustedDevices" json,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
