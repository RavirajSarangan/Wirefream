CREATE TABLE "generatedWireframes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "generatedWireframes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"prompt" varchar,
	"imageUrl" varchar,
	"style" varchar,
	"deviceType" varchar,
	"components" json,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plagiarismChecks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plagiarismChecks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"originalText" varchar,
	"fileName" varchar,
	"fileUrl" varchar,
	"similarityScore" integer,
	"matchedSources" json,
	"aiAnalysis" json,
	"status" varchar,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "uiToWireframe" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "uiToWireframe_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"originalImageUrl" varchar,
	"wireframeImageUrl" varchar,
	"model" varchar,
	"style" varchar,
	"description" varchar,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
