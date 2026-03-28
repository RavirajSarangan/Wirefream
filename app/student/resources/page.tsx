'use client';

import React, { useEffect, useState } from 'react';
import { useStudentContext } from '@/context/StudentProvider';
import axios from 'axios';
import { Download, AlertCircle, FileText, File, Book, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
    id: number;
    title: string;
    description: string;
    type: 'study-docs' | 'video' | 'assignments' | 'course-info';
    url: string;
    fileType?: string;
    fileSize?: string;
    downloads: number;
    createdAt: string;
}

const resourceIcons = {
    'study-docs': <Book className="w-5 h-5 text-blue-600" />,
    'video': <PlayCircle className="w-5 h-5 text-red-600" />,
    'assignments': <FileText className="w-5 h-5 text-green-600" />,
    'course-info': <File className="w-5 h-5 text-purple-600" />,
};

const resourceLabels = {
    'study-docs': 'Study Documents',
    'video': 'Video Lectures',
    'assignments': 'Assignments',
    'course-info': 'Course Information',
};

export default function StudentResourcesPage() {
    const { student } = useStudentContext();
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchResources();
    }, [student.eid]);

    useEffect(() => {
        let result = resources;

        // Filter by type
        if (filter !== 'all') {
            result = result.filter(r => r.type === filter);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                r => r.title.toLowerCase().includes(query) ||
                     r.description.toLowerCase().includes(query)
            );
        }

        setFilteredResources(result);
    }, [resources, filter, searchQuery]);

    const fetchResources = async () => {
        if (!student.eid) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/student/resources', {
                params: {
                    eid: student.eid,
                    type: 'all'
                },
            });

            setResources(response.data.resources || []);
            setError('');

            if (response.data.resources.length === 0) {
                toast.info('No resources available yet');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to fetch resources';
            setError(errorMsg);
            if (err.response?.status === 403) {
                setError('Your access has not been approved yet. Please wait for admin approval.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (resource: Resource) => {
        try {
            window.open(resource.url, '_blank');
            toast.success('Download started');
        } catch (err) {
            toast.error('Failed to download resource');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-red-900">Unable to Load Resources</p>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
                <p className="text-gray-600 mt-1">Access study materials, lectures, and assignments</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                    {Object.entries(resourceLabels).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                filter === key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                        {resources.length === 0 ? 'No resources available' : 'No matching resources found'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredResources.map(resource => (
                        <div
                            key={resource.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-50 rounded-lg">
                                        {resourceIcons[resource.type]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{resource.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {resourceLabels[resource.type]}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {resource.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                <span>{resource.downloads} downloads</span>
                                {resource.fileSize && <span>{resource.fileSize}</span>}
                                <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                            </div>

                            <button
                                onClick={() => handleDownload(resource)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>Found {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''}</strong>
                </p>
            </div>
        </div>
    );
}
