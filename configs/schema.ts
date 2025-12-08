import { integer, json, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    credits: integer().default(0)
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

export const GeneratedWireframesTable = pgTable("generatedWireframes", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    prompt: varchar(),
    imageUrl: varchar(),
    style: varchar(), // 'minimalist', 'detailed', 'colorful'
    deviceType: varchar(), // 'mobile', 'tablet', 'desktop'
    components: json(), // array of selected components
    createdBy: varchar(),
    createdAt: timestamp().defaultNow()
});

export const UIToWireframeTable = pgTable("uiToWireframe", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uid: varchar(),
    originalImageUrl: varchar(),
    wireframeImageUrl: varchar(),
    model: varchar(),
    style: varchar(), // 'minimalist', 'detailed', 'standard'
    description: varchar(),
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
