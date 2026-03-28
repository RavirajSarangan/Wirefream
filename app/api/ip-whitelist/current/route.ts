import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Get client IP from headers
        const forwarded = request.headers.get("x-forwarded-for");
        const realIP = request.headers.get("x-real-ip");
        
        let ip = forwarded?.split(",")[0]?.trim() || realIP || "127.0.0.1";
        
        // Handle IPv6 localhost
        if (ip === "::1") {
            ip = "127.0.0.1";
        }

        return NextResponse.json({
            success: true,
            ip
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to get IP", details: errorMessage },
            { status: 500 }
        );
    }
}
