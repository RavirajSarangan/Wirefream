import { db } from "@/configs/db";
import { CoverPagesTable } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        
        const result = await db.insert(CoverPagesTable).values({
            uid: data.uid,
            institutionName: data.institutionName,
            title: data.title,
            subject: data.subject,
            studentName: data.studentName,
            indexNumber: data.indexNumber,
            className: data.className,
            teacherName: data.teacherName,
            date: data.date,
            template: data.template,
            pageSize: data.pageSize,
            logoUrl: data.logoUrl,
            aiModel: data.aiModel,
            generationMethod: data.generationMethod,
            originalPrompt: data.originalPrompt,
            createdBy: data.email
        }).returning();

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error("Error saving cover page:", error);
        return NextResponse.json(
            { error: "Failed to save cover page" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const result = await db
            .select()
            .from(CoverPagesTable)
            .where(eq(CoverPagesTable.createdBy, email))
            .orderBy(desc(CoverPagesTable.createdAt));

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Error fetching cover pages:", error);
        return NextResponse.json(
            { error: "Failed to fetch cover pages" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const uid = searchParams.get('uid');
        const email = searchParams.get('email');

        if (!uid || !email) {
            return NextResponse.json(
                { error: "UID and email are required" },
                { status: 400 }
            );
        }

        await db
            .delete(CoverPagesTable)
            .where(eq(CoverPagesTable.uid, uid));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting cover page:", error);
        return NextResponse.json(
            { error: "Failed to delete cover page" },
            { status: 500 }
        );
    }
}
