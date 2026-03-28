import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { IPAccessLogsTable } from "@/configs/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "Email parameter required" },
                { status: 400 }
            );
        }

        // Note: In a real implementation, you'd filter by user
        // For now, we'll return all logs (in production, add user association)
        const logs = await db
            .select()
            .from(IPAccessLogsTable)
            .orderBy(desc(IPAccessLogsTable.createdAt))
            .limit(50);

        return NextResponse.json({
            success: true,
            logs
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch logs", details: errorMessage },
            { status: 500 }
        );
    }
}
