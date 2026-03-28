"use client";
import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, Smartphone, Key, Check, X, Copy, RefreshCw, AlertTriangle, Lock, QrCode, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "@/context/AuthContext";
import Image from "next/image";

interface TwoFactorStatus {
    isEnabled: boolean;
    preferredMethod: string;
    backupCodesRemaining: number;
    lastVerified: string | null;
}

export default function SettingsPage() {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [loading, setLoading] = useState(false);
    const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
    const [setupStep, setSetupStep] = useState<"idle" | "qr" | "verify" | "backup" | "complete">("idle");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showSecret, setShowSecret] = useState(false);
    const [disabling, setDisabling] = useState(false);
    const [disableCode, setDisableCode] = useState("");

    useEffect(() => {
        if (user?.email) {
            fetchTwoFactorStatus();
        }
    }, [user?.email]);

    const fetchTwoFactorStatus = async () => {
        if (!user?.email) return;
        try {
            const response = await fetch(`/api/2fa/status?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setTwoFactorStatus(data);
            }
        } catch {
            // Silent fail
        }
    };

    const startSetup = async () => {
        if (!user?.email) {
            toast.error("Please sign in first");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/2fa/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Setup failed");
            }

            const data = await response.json();
            setQrCodeUrl(data.qrCodeUrl);
            setSecret(data.secret);
            setSetupStep("qr");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Setup failed";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code");
            return;
        }
        if (!user?.email) return;

        setLoading(true);
        try {
            const response = await fetch("/api/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    code: verificationCode,
                    secret
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Verification failed");
            }

            const data = await response.json();
            setBackupCodes(data.backupCodes || []);
            setSetupStep("backup");
            toast.success("Code verified successfully!");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Verification failed";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const completeSetup = () => {
        setSetupStep("complete");
        fetchTwoFactorStatus();
        toast.success("Two-Factor Authentication enabled!");
    };

    const copySecret = () => {
        navigator.clipboard.writeText(secret);
        toast.success("Secret copied to clipboard");
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join("\n"));
        toast.success("Backup codes copied to clipboard");
    };

    const downloadBackupCodes = () => {
        const content = `Two-Factor Authentication Backup Codes\n${"=".repeat(40)}\nAccount: ${user?.email}\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}\n\n⚠️ Keep these codes in a safe place!\nEach code can only be used once.`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "2fa-backup-codes.txt";
        link.click();
        URL.revokeObjectURL(url);
    };

    const disable2FA = async () => {
        if (!disableCode || disableCode.length !== 6) {
            toast.error("Please enter your current 2FA code");
            return;
        }
        if (!user?.email) return;

        setDisabling(true);
        try {
            const response = await fetch("/api/2fa/disable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    code: disableCode
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to disable 2FA");
            }

            toast.success("Two-Factor Authentication disabled");
            setTwoFactorStatus(null);
            setSetupStep("idle");
            setDisableCode("");
            fetchTwoFactorStatus();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to disable";
            toast.error(errorMessage);
        } finally {
            setDisabling(false);
        }
    };

    const regenerateBackupCodes = async () => {
        if (!user?.email) return;

        setLoading(true);
        try {
            const response = await fetch("/api/2fa/backup-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user.email })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to regenerate");
            }

            const data = await response.json();
            setBackupCodes(data.backupCodes || []);
            setSetupStep("backup");
            toast.success("New backup codes generated!");

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to regenerate";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="xl:px-20 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold">Security Settings</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Manage your account security and two-factor authentication
                    </p>
                </div>

                {/* 2FA Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
                    {/* Status Section */}
                    {setupStep === "idle" && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        twoFactorStatus?.isEnabled ? "bg-green-100" : "bg-gray-100"
                                    }`}>
                                        <Lock className={`w-6 h-6 ${
                                            twoFactorStatus?.isEnabled ? "text-green-600" : "text-gray-400"
                                        }`} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
                                        <p className={`text-sm ${
                                            twoFactorStatus?.isEnabled ? "text-green-400" : "text-gray-400"
                                        }`}>
                                            {twoFactorStatus?.isEnabled ? "Enabled" : "Not enabled"}
                                        </p>
                                    </div>
                                </div>
                                {twoFactorStatus?.isEnabled ? (
                                    <div className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-green-400" />
                                        <span className="text-green-400 text-sm">Active</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <X className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-400 text-sm">Inactive</span>
                                    </div>
                                )}
                            </div>

                            {twoFactorStatus?.isEnabled ? (
                                <div className="space-y-6">
                                    {/* Status Info */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-700/30 rounded-xl">
                                            <p className="text-gray-400 text-sm mb-1">Method</p>
                                            <p className="text-gray-900 font-medium flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-green-400" />
                                                Authenticator App
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-700/30 rounded-xl">
                                            <p className="text-gray-400 text-sm mb-1">Backup Codes</p>
                                            <p className="text-gray-900 font-medium">
                                                {twoFactorStatus.backupCodesRemaining} remaining
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="border-t border-gray-700 pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Manage 2FA</h3>
                                        <div className="space-y-3">
                                            <Button
                                                variant="outline"
                                                onClick={regenerateBackupCodes}
                                                disabled={loading}
                                                className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                                Regenerate Backup Codes
                                            </Button>
                                            
                                            <div className="border-t border-gray-700 pt-4">
                                                <p className="text-red-400 text-sm mb-3 flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Disable Two-Factor Authentication
                                                </p>
                                                <div className="flex gap-3">
                                                    <Input
                                                        value={disableCode}
                                                        onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                        placeholder="Enter 2FA code"
                                                        className="bg-white border-gray-300 text-gray-900 flex-1"
                                                        maxLength={6}
                                                    />
                                                    <Button
                                                        variant="destructive"
                                                        onClick={disable2FA}
                                                        disabled={disabling || disableCode.length !== 6}
                                                    >
                                                        {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disable"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                            <div>
                                                <p className="text-yellow-400 font-medium">Your account is not fully protected</p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Enable two-factor authentication to add an extra layer of security to your account.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-gray-900">How it works</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-green-400 text-sm font-medium">1</span>
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 font-medium">Scan QR Code</p>
                                                    <p className="text-gray-400 text-sm">Use an authenticator app like Google Authenticator or Authy</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-green-400 text-sm font-medium">2</span>
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 font-medium">Verify Setup</p>
                                                    <p className="text-gray-400 text-sm">Enter the 6-digit code from your authenticator app</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-green-400 text-sm font-medium">3</span>
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 font-medium">Save Backup Codes</p>
                                                    <p className="text-gray-400 text-sm">Store recovery codes in case you lose access to your authenticator</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={startSetup}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 py-5"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Setting up...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-5 h-5 mr-2" />
                                                Enable Two-Factor Authentication
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {/* QR Code Step */}
                    {setupStep === "qr" && (
                        <div className="text-center space-y-6">
                            <div>
                                <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">Scan QR Code</h2>
                                <p className="text-gray-600">
                                    Scan this QR code with your authenticator app
                                </p>
                            </div>

                            {qrCodeUrl && (
                                <div className="flex justify-center">
                                    <div className="bg-white p-4 rounded-xl">
                                        <Image
                                            src={qrCodeUrl}
                                            alt="2FA QR Code"
                                            width={200}
                                            height={200}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="text-left">
                                <p className="text-gray-400 text-sm mb-2">Or enter this code manually:</p>
                                <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
                                    <code className="flex-1 text-gray-900 font-mono text-sm break-all">
                                        {showSecret ? secret : "•".repeat(32)}
                                    </code>
                                    <button
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={copySecret}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={() => setSetupStep("verify")}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Continue
                            </Button>
                        </div>
                    )}

                    {/* Verify Step */}
                    {setupStep === "verify" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Key className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Setup</h2>
                                <p className="text-gray-400">
                                    Enter the 6-digit code from your authenticator app
                                </p>
                            </div>

                            <div>
                                <Input
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="000000"
                                    className="bg-white border-gray-300 text-center text-2xl tracking-widest py-6"
                                    maxLength={6}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setSetupStep("qr")}
                                    className="flex-1 border-gray-600"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={verifyCode}
                                    disabled={loading || verificationCode.length !== 6}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Backup Codes Step */}
                    {setupStep === "backup" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Key className="w-12 h-12 text-green-400 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Save Backup Codes</h2>
                                <p className="text-gray-400">
                                    Store these codes safely. You can use them if you lose access to your authenticator.
                                </p>
                            </div>

                            <div className="bg-gray-700/30 rounded-xl p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {backupCodes.map((code, index) => (
                                        <div
                                            key={index}
                                            className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono text-gray-900"
                                        >
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={copyBackupCodes}
                                    className="flex-1 border-gray-600"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={downloadBackupCodes}
                                    className="flex-1 border-gray-600"
                                >
                                    Download
                                </Button>
                            </div>

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                    <div>
                                        <p className="text-yellow-400 font-medium">Important</p>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Each backup code can only be used once. Keep them in a secure location.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={completeSetup}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                I&apos;ve Saved My Codes
                            </Button>
                        </div>
                    )}

                    {/* Complete Step */}
                    {setupStep === "complete" && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Setup Complete!</h2>
                            <p className="text-gray-400 mb-6">
                                Two-factor authentication is now enabled on your account.
                            </p>
                            <Button
                                onClick={() => setSetupStep("idle")}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Done
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
