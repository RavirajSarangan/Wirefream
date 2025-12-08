import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/configs/db";
import { usersTable } from "@/configs/schema";

export async function POST(req: NextRequest) {
  try {
    const { email, credits } = await req.json();

    if (!email || typeof credits !== 'number') {
      return NextResponse.json(
        { error: "Email and credits are required" },
        { status: 400 }
      );
    }

    // Update user credits
    const result = await db
      .update(usersTable)
      .set({
        credits: credits,
      })
      .where(eq(usersTable.email, email))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: result[0] });
  } catch (error) {
    console.error("Error adding credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
