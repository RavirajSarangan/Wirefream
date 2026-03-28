import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { TwoFactorAuthTable } from "@/configs/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

function generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString("hex").toUpperCase();
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Check if 2FA is enabled
        const record = await db
            .select()
            .from(TwoFactorAuthTable)
            .where(eq(TwoFactorAuthTable.userEmail, email))
            .limit(1);

        if (record.length === 0 || record[0].isEnabled !== "true") {
            return NextResponse.json(
                { error: "2FA is not enabled for this account" },
                { status: 400 }
            );
        }

        // Generate new backup codes
        const backupCodes = generateBackupCodes(10);

        // Update record
        await db
            .update(TwoFactorAuthTable)
            .set({
                backupCodes: JSON.stringify(backupCodes),
                backupCodesUsed: JSON.stringify([]),
                updatedAt: new Date()
            })
            .where(eq(TwoFactorAuthTable.userEmail, email));

        return NextResponse.json({
            success: true,
            backupCodes,
            message: "Backup codes regenerated successfully"
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to regenerate backup codes", details: errorMessage },
            { status: 500 }
        );
    }
}
