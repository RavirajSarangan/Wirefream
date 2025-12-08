CREATE TABLE "codeRefinements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "codeRefinements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"wireframeId" integer,
	"userMessage" varchar,
	"aiResponse" varchar,
	"codeVersion" integer,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "wireframeToCode" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "codeRefinements" ADD CONSTRAINT "codeRefinements_wireframeId_wireframeToCode_id_fk" FOREIGN KEY ("wireframeId") REFERENCES "public"."wireframeToCode"("id") ON DELETE no action ON UPDATE no action;