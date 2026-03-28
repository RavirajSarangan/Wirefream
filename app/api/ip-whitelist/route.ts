import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { IPWhitelistTable } from "@/configs/schema";
import { eq, desc } from "drizzle-orm";

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

        const whitelist = await db
            .select()
            .from(IPWhitelistTable)
            .where(eq(IPWhitelistTable.createdBy, email))
            .orderBy(desc(IPWhitelistTable.createdAt));

        // Check if protection is enabled (for now, enabled if any active IPs exist)
        const activeIPs = whitelist.filter(ip => ip.isActive === "true");
        const enabled = activeIPs.length > 0;

        return NextResponse.json({
            success: true,
            whitelist,
            enabled,
            totalIPs: whitelist.length,
            activeIPs: activeIPs.length
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch whitelist", details: errorMessage },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ipAddress, description, userEmail } = body;

        if (!ipAddress || !userEmail) {
            return NextResponse.json(
                { error: "IP address and email are required" },
                { status: 400 }
            );
        }

        // Validate IP format
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

        if (!ipv4Regex.test(ipAddress) && !cidrRegex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
            return NextResponse.json(
                { error: "Invalid IP address format" },
                { status: 400 }
            );
        }

        // Determine IP type
        let ipType = "single";
        if (ipAddress.includes("/")) ipType = "cidr";
        else if (ipAddress.includes(":")) ipType = "ipv6";

        const uid = `ip_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const result = await db.insert(IPWhitelistTable).values({
            uid,
            ipAddress,
            ipType,
            description: description || "No description",
            isActive: "true",
            createdBy: userEmail
        }).returning();

        return NextResponse.json({
            success: true,
            message: "IP address added to whitelist",
            record: result[0]
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to add IP", details: errorMessage },
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
            .delete(IPWhitelistTable)
            .where(eq(IPWhitelistTable.uid, uid));

        return NextResponse.json({
            success: true,
            message: "IP address removed from whitelist"
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to remove IP", details: errorMessage },
            { status: 500 }
        );
    }
}
