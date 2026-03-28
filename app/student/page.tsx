'use client';

import React, { useEffect, useState } from 'react';
import { useStudentContext } from '@/context/StudentProvider';
import axios from 'axios';
import { CheckCircle, Clock, XCircle, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface StudentStatus {
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
    rejectionReason?: string;
}

export default function StudentDashboard() {
    const { student } = useStudentContext();
    const [status, setStatus] = useState<StudentStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStatus();
    }, [student.eid]);

    const fetchStatus = async () => {
        if (!student.eid) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/student/status', {
                params: { eid: student.eid },
            });
            setStatus(response.data);
            setError('');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to fetch status';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-12 h-12 text-green-600" />;
            case 'denied':
                return <XCircle className="w-12 h-12 text-red-600" />;
            default:
                return <Clock className="w-12 h-12 text-yellow-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-50 border-green-200';
            case 'denied':
                return 'bg-red-50 border-red-200';
            default:
                return 'bg-yellow-50 border-yellow-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return 'Your access has been approved!';
            case 'denied':
                return 'Your access request has been denied';
            default:
                return 'Your application is pending review';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !status) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error || 'Failed to load status'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, {status.studentName}!</p>
            </div>

            {/* Status Card */}
            <div className={`p-8 rounded-lg border-2 ${getStatusColor(status.status)}`}>
                <div className="flex items-start gap-6">
                    <div>{getStatusIcon(status.status)}</div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {getStatusText(status.status)}
                        </h2>
                        {status.status === 'pending' && (
                            <p className="text-gray-600">
                                Your application is being reviewed by the university administration. This usually takes 2-3 business days.
                            </p>
                        )}
                        {status.status === 'approved' && (
                            <div className="space-y-2 text-gray-600">
                                <p>You now have access to section {status.section} resources.</p>
                                <p className="text-sm">
                                    Approved on: {new Date(status.approvalDate || '').toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        {status.status === 'denied' && (
                            <div className="space-y-2">
                                <p className="text-gray-600">
                                    Reason: {status.rejectionReason || 'No reason provided'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Please contact the administration office for more details.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Student Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-sm font-medium text-gray-600">ESU ID</dt>
                            <dd className="text-base font-mono text-blue-600">{status.eid}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-600">Full Name</dt>
                            <dd className="text-base text-gray-900">{status.studentName}</dd>
                        </div>
                        {status.email && (
                            <div>
                                <dt className="text-sm font-medium text-gray-600">Email</dt>
                                <dd className="text-base text-gray-900">{status.email}</dd>
                            </div>
                        )}
                        {status.phone && (
                            <div>
                                <dt className="text-sm font-medium text-gray-600">Phone</dt>
                                <dd className="text-base text-gray-900">{status.phone}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Academic Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Information</h3>
                    <dl className="space-y-4">
                        {status.department && (
                            <div>
                                <dt className="text-sm font-medium text-gray-600">Department</dt>
                                <dd className="text-base text-gray-900">{status.department}</dd>
                            </div>
                        )}
                        {status.section && (
                            <div>
                                <dt className="text-sm font-medium text-gray-600">Section</dt>
                                <dd className="text-base font-medium text-blue-600">Section {status.section}</dd>
                            </div>
                        )}
                        {status.studentYear && (
                            <div>
                                <dt className="text-sm font-medium text-gray-600">Year</dt>
                                <dd className="text-base text-gray-900">{status.studentYear}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-sm font-medium text-gray-600">Applied Date</dt>
                            <dd className="text-base text-gray-900">
                                {new Date(status.registrationDate).toLocaleDateString()}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Info Boxes */}
            {status.status === 'approved' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h4 className="font-bold text-green-900 mb-2">Access Available</h4>
                        <p className="text-sm text-green-700">
                            You can now view and download resources for Section {status.section}. Visit the Resources page to get started.
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="font-bold text-blue-900 mb-2">Documents</h4>
                        <p className="text-sm text-blue-700">
                            Download your access authorization letter and other official documents from the Documents page.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
