import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
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
        const { email, code, secret } = body;

        if (!email || !code || !secret) {
            return NextResponse.json(
                { error: "Email, code, and secret are required" },
                { status: 400 }
            );
        }

        // Verify the code
        const isValid = authenticator.verify({
            token: code,
            secret: secret
        });

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid verification code" },
                { status: 400 }
            );
        }

        // Generate backup codes
        const backupCodes = generateBackupCodes(10);

        // Generate unique ID
        const uid = `2fa_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Check if record exists
        let existing;
        try {
            existing = await db
                .select()
                .from(TwoFactorAuthTable)
                .where(eq(TwoFactorAuthTable.userEmail, email))
                .limit(1);
        } catch (dbError) {
            console.error("Database query error:", dbError);
            return NextResponse.json(
                { error: "Database error. Please ensure the database migrations have been run with: npx drizzle-kit push" },
                { status: 500 }
            );
        }

        try {
            if (existing.length > 0) {
                // Update existing record
                await db
                    .update(TwoFactorAuthTable)
                    .set({
                        isEnabled: "true",
                        secretKey: secret,
                        backupCodes: JSON.stringify(backupCodes),
                        backupCodesUsed: JSON.stringify([]),
                        lastVerifiedAt: new Date(),
                        updatedAt: new Date()
                    })
                    .where(eq(TwoFactorAuthTable.userEmail, email));
            } else {
                // Create new record
                await db.insert(TwoFactorAuthTable).values({
                    uid,
                    userEmail: email,
                    isEnabled: "true",
                    secretKey: secret,
                    backupCodes: JSON.stringify(backupCodes),
                    backupCodesUsed: JSON.stringify([]),
                    preferredMethod: "authenticator",
                    failedAttempts: 0,
                    lastVerifiedAt: new Date()
                });
            }
        } catch (dbError) {
            console.error("Database write error:", dbError);
            return NextResponse.json(
                { error: "Failed to save 2FA settings to database" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            backupCodes,
            message: "2FA enabled successfully"
        });

    } catch (error) {
        console.error("2FA Verification Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error("Error details:", {
            message: errorMessage,
            stack: errorStack,
            type: error?.constructor?.name
        });
        
        return NextResponse.json(
            { error: "Failed to verify 2FA", details: errorMessage },
            { status: 500 }
        );
    }
}
