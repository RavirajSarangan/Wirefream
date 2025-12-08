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
    createdBy: varchar()
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
