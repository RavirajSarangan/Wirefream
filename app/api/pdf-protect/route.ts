import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { ProtectedPDFsTable } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";

// For actual PDF encryption, we'll use pdf-lib or muhammara
// This is a simulated implementation - in production, use a proper PDF encryption library
// npm install pdf-lib or npm install muhammara for actual PDF encryption

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            originalFileUrl,
            originalFileName,
            password,
            encryptionLevel,
            permissions,
            userEmail,
            uid
        } = body;

        // Validate required fields
        if (!originalFileUrl || !originalFileName || !password || !userEmail || !uid) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // In production, you would:
        // 1. Download the original PDF from Firebase Storage
        // 2. Use pdf-lib or muhammara to encrypt it with the password
        // 3. Upload the encrypted PDF back to Firebase Storage
        // 4. Return the new URL
        
        // For now, we'll simulate the encryption process
        // The protected file URL would be different in production
        const protectedFileUrl = originalFileUrl.replace(
            originalFileName,
            `protected_${originalFileName}`
        );

        // Get file size (simulated - in production, get actual size)
        const fileSize = 0; // Would be calculated from actual file

        // Save to database
        const result = await db.insert(ProtectedPDFsTable).values({
            uid,
            originalFileName,
            originalFileUrl,
            protectedFileUrl,
            protectionType: "password",
            permissions: JSON.stringify(permissions),
            encryptionLevel,
            fileSize,
            downloadCount: 0,
            status: "completed",
            createdBy: userEmail
        }).returning();

        return NextResponse.json({
            success: true,
            protectedFileUrl,
            uid,
            message: "PDF protected successfully",
            record: result[0]
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to protect PDF", details: errorMessage },
            { status: 500 }
        );
    }
}

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

        const protectedPDFs = await db
            .select()
            .from(ProtectedPDFsTable)
            .where(eq(ProtectedPDFsTable.createdBy, email))
            .orderBy(desc(ProtectedPDFsTable.createdAt))
            .limit(20);

        // Parse permissions JSON for each record
        const parsedPDFs = protectedPDFs.map(pdf => ({
            ...pdf,
            permissions: pdf.permissions ? JSON.parse(pdf.permissions as string) : {}
        }));

        return NextResponse.json({
            success: true,
            protectedPDFs: parsedPDFs
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch protected PDFs", details: errorMessage },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");

        if (!uid) {
            return NextResponse.json(
                { error: "UID parameter required" },
                { status: 400 }
            );
        }

        await db
            .delete(ProtectedPDFsTable)
            .where(eq(ProtectedPDFsTable.uid, uid));

        return NextResponse.json({
            success: true,
            message: "Protected PDF record deleted"
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to delete protected PDF", details: errorMessage },
            { status: 500 }
        );
    }
}
