import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { IPWhitelistTable } from "@/configs/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uid, isActive } = body;

        if (!uid || !isActive) {
            return NextResponse.json(
                { error: "UID and isActive are required" },
                { status: 400 }
            );
        }

        await db
            .update(IPWhitelistTable)
            .set({ isActive })
            .where(eq(IPWhitelistTable.uid, uid));

        return NextResponse.json({
            success: true,
            message: "IP status updated"
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to update IP status", details: errorMessage },
            { status: 500 }
        );
    }
}
