import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, enabled } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // In a real implementation, you'd store this preference in a user settings table
        // For now, this is a placeholder that acknowledges the request
        // The actual protection logic would be in middleware

        return NextResponse.json({
            success: true,
            enabled,
            message: enabled ? "IP protection enabled" : "IP protection disabled"
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to update protection settings", details: errorMessage },
            { status: 500 }
        );
    }
}
