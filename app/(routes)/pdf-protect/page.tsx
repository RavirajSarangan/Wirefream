"use client";
import React, { useState, useContext, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, Shield, Download, Eye, EyeOff, Lock, FileText, X, Check, Copy, Printer, Edit, MessageSquare, Settings } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "@/context/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/configs/firebaseConfig";

interface ProtectedPDF {
    uid: string;
    originalFileName: string;
    protectedFileUrl: string;
    encryptionLevel: string;
    permissions: {
        print: boolean;
        copy: boolean;
        modify: boolean;
        annotate: boolean;
    };
    createdAt: string;
}

export default function PDFProtectPage() {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [encryptionLevel, setEncryptionLevel] = useState<"128bit" | "256bit">("256bit");
    const [permissions, setPermissions] = useState({
        print: true,
        copy: false,
        modify: false,
        annotate: true
    });
    const [protectedPDFs, setProtectedPDFs] = useState<ProtectedPDF[]>([]);
    const [protectedFileUrl, setProtectedFileUrl] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === "application/pdf") {
                setFile(droppedFile);
                setProtectedFileUrl(null);
            } else {
                toast.error("Please upload a PDF file");
            }
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                setProtectedFileUrl(null);
            } else {
                toast.error("Please upload a PDF file");
            }
        }
    };

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const generateStrongPassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let newPassword = "";
        for (let i = 0; i < 16; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPassword);
        setConfirmPassword(newPassword);
        navigator.clipboard.writeText(newPassword);
        toast.success("Strong password generated and copied to clipboard!");
    };

    const handleProtectPDF = async () => {
        if (!file) {
            toast.error("Please upload a PDF file");
            return;
        }
        if (!password) {
            toast.error("Please enter a password");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (!user?.email) {
            toast.error("Please sign in to protect PDFs");
            return;
        }

        setLoading(true);
        try {
            // Upload original file to Firebase Storage
            const uid = `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const storageRef = ref(storage, `pdf-protect/${user.email}/${uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const originalFileUrl = await getDownloadURL(storageRef);

            // Call API to protect PDF
            const response = await fetch("/api/pdf-protect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    originalFileUrl,
                    originalFileName: file.name,
                    password,
                    encryptionLevel,
                    permissions,
                    userEmail: user.email,
                    uid
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to protect PDF");
            }

            const data = await response.json();
            setProtectedFileUrl(data.protectedFileUrl);
            toast.success("PDF protected successfully!");

            // Refresh protected PDFs list
            fetchProtectedPDFs();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to protect PDF";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchProtectedPDFs = async () => {
        if (!user?.email) return;
        try {
            const response = await fetch(`/api/pdf-protect?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setProtectedPDFs(data.protectedPDFs || []);
            }
        } catch {
            // Silent fail for list fetch
        }
    };

    React.useEffect(() => {
        if (user?.email) {
            fetchProtectedPDFs();
        }
    }, [user?.email]);

    const downloadProtectedPDF = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = `protected_${filename}`;
        link.click();
    };

    return (
        <div className="xl:px-20 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Lock className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">PDF Password Protection</h1>
                    </div>
                    <p className="text-gray-700 text-lg">
                        Secure your PDF documents with military-grade encryption
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8 mb-8">
                    {/* File Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload PDF File
                        </label>
                        <div
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                dragActive
                                    ? "border-blue-400 bg-blue-50"
                                    : file
                                    ? "border-green-400 bg-green-50"
                                    : "border-gray-300 hover:border-blue-400 bg-gray-50"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-green-600" />
                                    <div className="text-left">
                                        <p className="text-gray-900 font-medium">{file.name}</p>
                                        <p className="text-gray-600 text-sm">
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setProtectedFileUrl(null);
                                        }}
                                        className="text-gray-600 hover:text-gray-900"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                                    <p className="text-gray-900 font-medium mb-1">
                                        Drag & drop your PDF here
                                    </p>
                                    <p className="text-gray-600 text-sm">or click to browse</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter strong password"
                                    className="bg-white border-gray-300 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                className="bg-white border-gray-300"
                            />
                        </div>
                    </div>

                    {/* Generate Password Button */}
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={generateStrongPassword}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Generate Strong Password
                        </Button>
                    </div>

                    {/* Encryption Level */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Encryption Level
                        </label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setEncryptionLevel("128bit")}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    encryptionLevel === "128bit"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 hover:border-blue-400 bg-white"
                                }`}
                            >
                                <div className="text-gray-900 font-medium mb-1">128-bit AES</div>
                                <div className="text-gray-600 text-sm">Standard encryption</div>
                            </button>
                            <button
                                onClick={() => setEncryptionLevel("256bit")}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                                    encryptionLevel === "256bit"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 hover:border-blue-400 bg-white"
                                }`}
                            >
                                <div className="text-gray-900 font-medium mb-1">256-bit AES</div>
                                <div className="text-gray-600 text-sm">Military-grade (recommended)</div>
                            </button>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            <Settings className="w-4 h-4 inline mr-2" />
                            Document Permissions
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                                onClick={() => togglePermission("print")}
                                className={`p-3 rounded-xl border transition-all ${
                                    permissions.print
                                        ? "border-green-400 bg-green-500/10 text-green-400"
                                        : "border-gray-600 bg-gray-700/30 text-gray-400"
                                }`}
                            >
                                <Printer className="w-5 h-5 mx-auto mb-1" />
                                <div className="text-sm">Print</div>
                                {permissions.print ? (
                                    <Check className="w-4 h-4 mx-auto mt-1" />
                                ) : (
                                    <X className="w-4 h-4 mx-auto mt-1" />
                                )}
                            </button>
                            <button
                                onClick={() => togglePermission("copy")}
                                className={`p-3 rounded-xl border transition-all ${
                                    permissions.copy
                                        ? "border-green-400 bg-green-500/10 text-green-400"
                                        : "border-gray-600 bg-gray-700/30 text-gray-400"
                                }`}
                            >
                                <Copy className="w-5 h-5 mx-auto mb-1" />
                                <div className="text-sm">Copy</div>
                                {permissions.copy ? (
                                    <Check className="w-4 h-4 mx-auto mt-1" />
                                ) : (
                                    <X className="w-4 h-4 mx-auto mt-1" />
                                )}
                            </button>
                            <button
                                onClick={() => togglePermission("modify")}
                                className={`p-3 rounded-xl border transition-all ${
                                    permissions.modify
                                        ? "border-green-400 bg-green-500/10 text-green-400"
                                        : "border-gray-600 bg-gray-700/30 text-gray-400"
                                }`}
                            >
                                <Edit className="w-5 h-5 mx-auto mb-1" />
                                <div className="text-sm">Modify</div>
                                {permissions.modify ? (
                                    <Check className="w-4 h-4 mx-auto mt-1" />
                                ) : (
                                    <X className="w-4 h-4 mx-auto mt-1" />
                                )}
                            </button>
                            <button
                                onClick={() => togglePermission("annotate")}
                                className={`p-3 rounded-xl border transition-all ${
                                    permissions.annotate
                                        ? "border-green-400 bg-green-500/10 text-green-400"
                                        : "border-gray-600 bg-gray-700/30 text-gray-400"
                                }`}
                            >
                                <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                                <div className="text-sm">Annotate</div>
                                {permissions.annotate ? (
                                    <Check className="w-4 h-4 mx-auto mt-1" />
                                ) : (
                                    <X className="w-4 h-4 mx-auto mt-1" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Protect Button */}
                    <Button
                        onClick={handleProtectPDF}
                        disabled={loading || !file || !password}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Protecting PDF...
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5 mr-2" />
                                Protect PDF
                            </>
                        )}
                    </Button>

                    {/* Download Protected PDF */}
                    {protectedFileUrl && (
                        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Check className="w-6 h-6 text-green-400" />
                                    <div>
                                        <p className="text-green-400 font-medium">PDF Protected Successfully!</p>
                                        <p className="text-gray-400 text-sm">Your document is now encrypted with {encryptionLevel} encryption</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => downloadProtectedPDF(protectedFileUrl, file?.name || "document.pdf")}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Recent Protected PDFs */}
                {protectedPDFs.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Recent Protected PDFs
                        </h2>
                        <div className="space-y-3">
                            {protectedPDFs.slice(0, 5).map((pdf) => (
                                <div
                                    key={pdf.uid}
                                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <Lock className="w-5 h-5 text-purple-400" />
                                        <div>
                                            <p className="text-white font-medium">{pdf.originalFileName}</p>
                                            <p className="text-gray-400 text-sm">
                                                {pdf.encryptionLevel} • {new Date(pdf.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => downloadProtectedPDF(pdf.protectedFileUrl, pdf.originalFileName)}
                                        className="text-purple-400 hover:text-white"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
