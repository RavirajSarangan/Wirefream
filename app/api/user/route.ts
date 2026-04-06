
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/configs/db";
import { usersTable } from "@/configs/schema";

export async function POST(req: NextRequest) {
    try {
        const { userEmail, userName } = await req.json();

        const result = await db.select().from(usersTable)
            .where(eq(usersTable.email, userEmail));

        if (result?.length === 0) {
            const inserted = await db.insert(usersTable).values({
                name: userName,
                email: userEmail,
                credits: 3,
            }).returning();

            return NextResponse.json(inserted.length > 0 ? inserted[0] : null);
        }
        return NextResponse.json(result.length > 0 ? result[0] : null);
    } catch (e: any) {
        console.error('User POST error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const reqUrl = req.url;
        const { searchParams } = new URL(reqUrl);
        const email = searchParams?.get('email');

        if (email) {
            const result = await db.select().from(usersTable)
                .where(eq(usersTable.email, email));
            return NextResponse.json(result.length > 0 ? result[0] : null);
        }

        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    } catch (e: any) {
        console.error('User GET error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
