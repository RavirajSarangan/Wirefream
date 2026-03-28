import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { TwoFactorAuthTable } from "@/configs/schema";
import { eq } from "drizzle-orm";

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

        let record;
        try {
            record = await db
                .select()
                .from(TwoFactorAuthTable)
                .where(eq(TwoFactorAuthTable.userEmail, email))
                .limit(1);
        } catch (dbError) {
            console.error("Database query error in 2FA status:", dbError);
            return NextResponse.json(
                { error: "Database error. Please ensure migrations have been run: npx drizzle-kit push" },
                { status: 500 }
            );
        }

        if (record.length === 0) {
            return NextResponse.json({
                isEnabled: false,
                preferredMethod: "authenticator",
                backupCodesRemaining: 0,
                lastVerified: null
            });
        }

        const twoFactor = record[0];
        const backupCodesUsed = twoFactor.backupCodesUsed 
            ? JSON.parse(twoFactor.backupCodesUsed as string) 
            : [];
        const backupCodes = twoFactor.backupCodes 
            ? JSON.parse(twoFactor.backupCodes as string) 
            : [];

        return NextResponse.json({
            isEnabled: twoFactor.isEnabled === "true",
            preferredMethod: twoFactor.preferredMethod || "authenticator",
            backupCodesRemaining: backupCodes.length - backupCodesUsed.length,
            lastVerified: twoFactor.lastVerifiedAt
        });

    } catch (error) {
        console.error("2FA Status Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch 2FA status", details: errorMessage },
            { status: 500 }
        );
    }
}
