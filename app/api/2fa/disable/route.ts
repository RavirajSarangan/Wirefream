import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import { db } from "@/configs/db";
import { TwoFactorAuthTable } from "@/configs/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code } = body;

        if (!email || !code) {
            return NextResponse.json(
                { error: "Email and code are required" },
                { status: 400 }
            );
        }

        // Get 2FA record
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

        const twoFactor = record[0];

        // Verify the code
        const isValid = authenticator.verify({
            token: code,
            secret: twoFactor.secretKey!
        });

        if (!isValid) {
            // Increment failed attempts
            await db
                .update(TwoFactorAuthTable)
                .set({
                    failedAttempts: (twoFactor.failedAttempts || 0) + 1,
                    updatedAt: new Date()
                })
                .where(eq(TwoFactorAuthTable.userEmail, email));

            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Disable 2FA
        await db
            .update(TwoFactorAuthTable)
            .set({
                isEnabled: "false",
                secretKey: null,
                backupCodes: null,
                backupCodesUsed: null,
                failedAttempts: 0,
                updatedAt: new Date()
            })
            .where(eq(TwoFactorAuthTable.userEmail, email));

        return NextResponse.json({
            success: true,
            message: "2FA disabled successfully"
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to disable 2FA", details: errorMessage },
            { status: 500 }
        );
    }
}
