'use client';

import React, { useState } from 'react';
import { useStudentContext } from '@/context/StudentProvider';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function StudentDocumentsPage() {
    const { student } = useStudentContext();
    const [loading, setLoading] = useState<string | null>(null);

    const documents = [
        {
            id: 'access-letter',
            title: 'Access Authorization Letter',
            description: 'Official letter confirming your access to section resources',
            type: 'pdf',
        },
        {
            id: 'access-card',
            title: 'Student Resource Access Card',
            description: 'Digital access card for your approved sections',
            type: 'pdf',
        },
        {
            id: 'certificate',
            title: 'Access Certificate',
            description: 'Certificate of resource access approval',
            type: 'pdf',
        },
    ];

    const handleDownload = async (docId: string, docType: string) => {
        try {
            setLoading(docId);

            const storedEid = localStorage.getItem('studentEid');
            if (!storedEid) {
                toast.error('Student ID not found');
                return;
            }

            toast.info('Document generation in progress...');

            // Call the API to generate document
            const response = await fetch(
                `/api/student/documents?eid=${encodeURIComponent(storedEid)}&type=${docType}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate document');
            }

            // Get the document content
            const content = await response.text();

            // Create a blob and download
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ESU_${docId}_${storedEid}.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Document downloaded successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to download document');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                <p className="text-gray-600 mt-1">Download your official access documents</p>
            </div>

            {/* Status Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex gap-4">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-blue-900">Documents Available</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Download your official university documents confirming your approved access to section resources.
                    </p>
                </div>
            </div>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map(doc => (
                    <div
                        key={doc.id}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{doc.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="text-xs text-gray-500">
                                Format: <strong>{doc.type.toUpperCase()}</strong>
                            </div>
                            <Button
                                onClick={() => handleDownload(doc.id, doc.type)}
                                disabled={loading === doc.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {loading === doc.id ? 'Generating...' : 'Download'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-3">Document Contents</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex gap-2">
                            <span className="text-blue-600">✓</span>
                            <span>University letterhead and official seal</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-blue-600">✓</span>
                            <span>Your ESU Student ID and name</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-blue-600">✓</span>
                            <span>Approved sections and departments</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-blue-600">✓</span>
                            <span>Validity period and issue date</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-3">How to Use</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex gap-2">
                            <span className="text-blue-600">1</span>
                            <span>Download your access letter</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-blue-600">2</span>
                            <span>Print or save digitally</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-blue-600">3</span>
                            <span>Present to staff if needed</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-blue-600">4</span>
                            <span>Share with authorized personnel</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-yellow-900">Important</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                        These documents are official university records. Keep them safe and confidential. Do not share your ESU ID with unauthorized parties.
                    </p>
                </div>
            </div>
        </div>
    );
}
