import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        // Generate a new secret
        const secret = authenticator.generateSecret();
        
        // Create OTP Auth URL
        const appName = "WireframeToCode";
        const otpAuthUrl = authenticator.keyuri(email, appName, secret);

        // Generate QR Code as data URL
        const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff"
            }
        });

        return NextResponse.json({
            success: true,
            secret,
            qrCodeUrl,
            otpAuthUrl
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to setup 2FA", details: errorMessage },
            { status: 500 }
        );
    }
}
