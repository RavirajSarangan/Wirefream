'use client';

import React, { useEffect, useState } from 'react';
import { useStudentContext } from '@/context/StudentProvider';
import axios from 'axios';
import { User, Mail, Phone, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StudentProfile {
    id: number;
    eid: string;
    studentName: string;
    email?: string;
    phone?: string;
    department?: string;
    section?: string;
    studentYear?: string;
    registrationDate: string;
    status: 'pending' | 'approved' | 'denied';
    approvalDate?: string;
    approvedBy?: string;
}

export default function StudentProfilePage() {
    const { student } = useStudentContext();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [student.eid]);

    const fetchProfile = async () => {
        if (!student.eid) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/student/status', {
                params: { eid: student.eid },
            });
            setProfile(response.data);
            setError('');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to fetch profile';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error || 'Failed to load profile'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-1">View and manage your student information</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{profile.studentName}</h2>
                            <p className="text-blue-100">{profile.eid}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Personal Information
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">ESU Student ID</label>
                                    <p className="text-lg font-mono text-blue-600 mt-1">{profile.eid}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.studentName}</p>
                                </div>
                                {profile.email && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email Address
                                        </label>
                                        <p className="text-lg text-gray-900 mt-1">{profile.email}</p>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Phone Number
                                        </label>
                                        <p className="text-lg text-gray-900 mt-1">{profile.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-green-600" />
                            Academic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.department && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">Department</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.department}</p>
                                </div>
                            )}
                            {profile.section && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">Section</label>
                                    <p className="text-lg font-bold text-green-600 mt-1">Section {profile.section}</p>
                                </div>
                            )}
                            {profile.studentYear && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">Student Year</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.studentYear}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Application Information */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            Application Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <label className="text-sm font-medium text-gray-600">Registration Date</label>
                                <p className="text-lg text-gray-900 mt-1">
                                    {new Date(profile.registrationDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <label className="text-sm font-medium text-gray-600">Status</label>
                                <div className="mt-1">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                            profile.status === 'approved'
                                                ? 'bg-green-100 text-green-800'
                                                : profile.status === 'denied'
                                                  ? 'bg-red-100 text-red-800'
                                                  : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                    >
                                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            {profile.approvalDate && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">Approval Date</label>
                                    <p className="text-lg text-gray-900 mt-1">
                                        {new Date(profile.approvalDate).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            {profile.approvedBy && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="text-sm font-medium text-gray-600">Approved By</label>
                                    <p className="text-lg text-gray-900 mt-1">{profile.approvedBy}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Button
                    onClick={fetchProfile}
                    variant="outline"
                    className="flex-1"
                >
                    Refresh Profile
                </Button>
            </div>
        </div>
    );
}
