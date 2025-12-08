ALTER TABLE "plagiarismChecks" ADD COLUMN "aiDetectionScore" integer;--> statement-breakpoint
ALTER TABLE "plagiarismChecks" ADD COLUMN "sourceBreakdown" json;--> statement-breakpoint
ALTER TABLE "plagiarismChecks" ADD COLUMN "paraphrasingDetected" varchar;--> statement-breakpoint
ALTER TABLE "plagiarismChecks" ADD COLUMN "aiModelUsed" varchar;