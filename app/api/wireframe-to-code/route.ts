import { db } from "@/configs/db";
import { usersTable, WireframeToCodeTable } from "@/configs/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { description, imageUrl, model, uid, email } = await req.json();

    const creditResult = await db.select().from(usersTable)
        .where(eq(usersTable.email, email));

    if (creditResult.length > 0 && creditResult[0]?.credits && creditResult[0]?.credits > 0) {

        const result = await db.insert(WireframeToCodeTable).values({
            uid: uid.toString(),
            description: description,
            imageUrl: imageUrl,
            model: model,
            createdBy: email
        }).returning({ id: WireframeToCodeTable.id });

        // Update user credits
        await db.update(usersTable).set({
            credits: creditResult[0]?.credits - 1
        }).where(eq(usersTable.email, email));

        return NextResponse.json(result);
    }
    else {
        return NextResponse.json({ 'error': 'Not enough credits' })
    }
}

export async function GET(req: Request) {
    const reqUrl = req.url;
    const { searchParams } = new URL(reqUrl);
    const uid = searchParams?.get('uid');
    const email = searchParams?.get('email');
    if (uid) {
        const result = await db.select()
            .from(WireframeToCodeTable)
            .where(eq(WireframeToCodeTable.uid, uid));
        return NextResponse.json(result[0]);
    }
    else if (email) {
        const result = await db.select()
            .from(WireframeToCodeTable)
            .where(eq(WireframeToCodeTable.createdBy, email))
            .orderBy(desc(WireframeToCodeTable.id))
            ;
        return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'No Record Found' })

}

export async function PUT(req: NextRequest) {
    const { uid, codeResp } = await req.json();

    const result = await db.update(WireframeToCodeTable)
        .set({
            code: codeResp
        }).where(eq(WireframeToCodeTable.uid, uid))
        .returning({ uid: WireframeToCodeTable.uid })

    return NextResponse.json(result);

}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const email = searchParams.get('email');

    if (!uid || !email) {
        return NextResponse.json({ error: 'Missing uid or email' }, { status: 400 });
    }

    // Verify ownership before deleting
    const existing = await db.select()
        .from(WireframeToCodeTable)
        .where(eq(WireframeToCodeTable.uid, uid));

    if (!existing[0]) {
        return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    if (existing[0].createdBy !== email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await db.delete(WireframeToCodeTable)
        .where(eq(WireframeToCodeTable.uid, uid))
        .returning({ uid: WireframeToCodeTable.uid });

    return NextResponse.json({ success: true, deleted: result });
}