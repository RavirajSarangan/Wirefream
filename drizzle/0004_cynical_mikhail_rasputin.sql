CREATE TABLE "appFlowGenerator" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appFlowGenerator_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uid" varchar,
	"appName" varchar,
	"appDescription" varchar,
	"screenList" json,
	"flowDiagramData" json,
	"userJourneyData" json,
	"model" varchar,
	"createdBy" varchar,
	"createdAt" timestamp DEFAULT now()
);
