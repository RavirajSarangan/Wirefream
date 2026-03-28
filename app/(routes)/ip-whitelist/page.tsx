"use client";
import React, { useState, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, Globe, Plus, Trash2, Check, X, MapPin, Clock, AlertTriangle, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { AuthContext } from "@/context/AuthContext";

interface IPWhitelistEntry {
    id: number;
    uid: string;
    ipAddress: string;
    ipType: string;
    description: string;
    isActive: string;
    lastUsedAt: string | null;
    createdAt: string;
}

interface IPAccessLog {
    id: number;
    ipAddress: string;
    country: string;
    city: string;
    endpoint: string;
    isAllowed: string;
    createdAt: string;
}

export default function IPWhitelistPage() {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [loading, setLoading] = useState(false);
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
    const [whitelist, setWhitelist] = useState<IPWhitelistEntry[]>([]);
    const [accessLogs, setAccessLogs] = useState<IPAccessLog[]>([]);
    const [newIP, setNewIP] = useState("");
    const [ipDescription, setIpDescription] = useState("");
    const [currentIP, setCurrentIP] = useState<string | null>(null);
    const [addingIP, setAddingIP] = useState(false);

    useEffect(() => {
        if (user?.email) {
            fetchWhitelist();
            fetchAccessLogs();
            fetchCurrentIP();
        }
    }, [user?.email]);

    const fetchCurrentIP = async () => {
        try {
            const response = await fetch("/api/ip-whitelist/current");
            if (response.ok) {
                const data = await response.json();
                setCurrentIP(data.ip);
            }
        } catch {
            // Silent fail
        }
    };

    const fetchWhitelist = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/ip-whitelist?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setWhitelist(data.whitelist || []);
                setWhitelistEnabled(data.enabled || false);
            }
        } catch {
            toast.error("Failed to load whitelist");
        } finally {
            setLoading(false);
        }
    };

    const fetchAccessLogs = async () => {
        if (!user?.email) return;
        try {
            const response = await fetch(`/api/ip-whitelist/logs?email=${encodeURIComponent(user.email)}`);
            if (response.ok) {
                const data = await response.json();
                setAccessLogs(data.logs || []);
            }
        } catch {
            // Silent fail
        }
    };

    const validateIP = (ip: string): boolean => {
        // IPv4 validation
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        // IPv4 CIDR validation
        const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
        // IPv6 basic validation
        const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        return ipv4Regex.test(ip) || cidrRegex.test(ip) || ipv6Regex.test(ip);
    };

    const addIPToWhitelist = async () => {
        if (!newIP.trim()) {
            toast.error("Please enter an IP address");
            return;
        }
        if (!validateIP(newIP.trim())) {
            toast.error("Please enter a valid IP address or CIDR range");
            return;
        }
        if (!user?.email) return;

        setAddingIP(true);
        try {
            const response = await fetch("/api/ip-whitelist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ipAddress: newIP.trim(),
                    description: ipDescription.trim() || "No description",
                    userEmail: user.email
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to add IP");
            }

            toast.success("IP address added to whitelist");
            setNewIP("");
            setIpDescription("");
            fetchWhitelist();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to add IP";
            toast.error(errorMessage);
        } finally {
            setAddingIP(false);
        }
    };

    const addCurrentIP = async () => {
        if (currentIP) {
            setNewIP(currentIP);
            setIpDescription("My current IP");
        }
    };

    const removeIP = async (uid: string) => {
        try {
            const response = await fetch(`/api/ip-whitelist?uid=${uid}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to remove IP");
            }

            toast.success("IP address removed");
            fetchWhitelist();

        } catch {
            toast.error("Failed to remove IP address");
        }
    };

    const toggleIPStatus = async (uid: string, currentStatus: string) => {
        try {
            const response = await fetch("/api/ip-whitelist/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid,
                    isActive: currentStatus === "true" ? "false" : "true"
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update status");
            }

            fetchWhitelist();

        } catch {
            toast.error("Failed to update IP status");
        }
    };

    const toggleWhitelistProtection = async () => {
        if (!user?.email) return;
        
        try {
            const response = await fetch("/api/ip-whitelist/protection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: user.email,
                    enabled: !whitelistEnabled
                })
            });

            if (!response.ok) {
                throw new Error("Failed to toggle protection");
            }

            setWhitelistEnabled(!whitelistEnabled);
            toast.success(whitelistEnabled ? "IP protection disabled" : "IP protection enabled");

        } catch {
            toast.error("Failed to toggle IP protection");
        }
    };

    const getIPType = (ip: string): string => {
        if (ip.includes("/")) return "CIDR Range";
        if (ip.includes(":")) return "IPv6";
        return "IPv4";
    };

    return (
        <div className="xl:px-20 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold">IP Whitelisting</h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Restrict access to your account from specific IP addresses only
                    </p>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                whitelistEnabled ? "bg-green-100" : "bg-gray-100"
                            }`}>
                                <Globe className={`w-6 h-6 ${whitelistEnabled ? "text-green-600" : "text-gray-400"}`} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">IP Whitelist Protection</h2>
                                <p className="text-gray-400 text-sm">
                                    {whitelistEnabled 
                                        ? "Only whitelisted IPs can access your account" 
                                        : "All IPs can access your account"}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={toggleWhitelistProtection}
                            variant={whitelistEnabled ? "destructive" : "default"}
                            className={whitelistEnabled ? "" : "bg-green-600 hover:bg-green-700"}
                        >
                            {whitelistEnabled ? "Disable" : "Enable"}
                        </Button>
                    </div>

                    {currentIP && (
                        <div className="mt-4 p-3 bg-gray-700/30 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400 text-sm">Your current IP:</span>
                                <code className="text-white font-mono">{currentIP}</code>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={addCurrentIP}
                                className="text-red-400 hover:text-white"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add to whitelist
                            </Button>
                        </div>
                    )}
                </div>

                {/* Add IP Form */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        Add IP Address
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <Input
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                            placeholder="192.168.1.1 or 10.0.0.0/24"
                            className="bg-white border-gray-300"
                        />
                        <Input
                            value={ipDescription}
                            onChange={(e) => setIpDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="bg-white border-gray-300"
                        />
                        <Button
                            onClick={addIPToWhitelist}
                            disabled={addingIP || !newIP.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {addingIP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Add IP
                        </Button>
                    </div>
                    <div className="mt-3 flex items-start gap-2 text-gray-400 text-sm">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>You can add single IPs (192.168.1.1) or CIDR ranges (10.0.0.0/24)</span>
                    </div>
                </div>

                {/* Whitelist Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Whitelisted IPs ({whitelist.length})
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchWhitelist}
                            disabled={loading}
                            className="text-gray-400"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>

                    {whitelist.length === 0 ? (
                        <div className="text-center py-8">
                            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-400">No IP addresses whitelisted yet</p>
                            <p className="text-gray-500 text-sm mt-1">Add your first IP address above</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {whitelist.map((entry) => (
                                <div
                                    key={entry.uid}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${
                                        entry.isActive === "true"
                                            ? "bg-green-500/5 border-green-500/20"
                                            : "bg-gray-700/30 border-gray-600"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleIPStatus(entry.uid, entry.isActive)}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                entry.isActive === "true"
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-gray-600 text-gray-400"
                                            }`}
                                        >
                                            {entry.isActive === "true" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                        </button>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <code className="text-white font-mono">{entry.ipAddress}</code>
                                                <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">
                                                    {getIPType(entry.ipAddress)}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{entry.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {entry.lastUsedAt && (
                                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(entry.lastUsedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeIP(entry.uid)}
                                            className="text-red-400 hover:text-white hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Access Logs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Recent Access Attempts
                    </h3>

                    {accessLogs.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-400">No access logs yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {accessLogs.slice(0, 10).map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                        log.isAllowed === "true"
                                            ? "bg-green-500/5"
                                            : "bg-red-500/5"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {log.isAllowed === "true" ? (
                                            <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                        )}
                                        <code className="text-white font-mono text-sm">{log.ipAddress}</code>
                                        {log.country && (
                                            <span className="text-gray-400 text-sm">
                                                {log.city && `${log.city}, `}{log.country}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 text-xs">{log.endpoint}</span>
                                        <span className="text-gray-500 text-xs">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
