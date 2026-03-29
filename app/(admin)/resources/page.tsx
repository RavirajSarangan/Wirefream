'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/app/provider';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, FileText, BookOpen } from 'lucide-react';

interface Resource {
    id: number;
    sectionName: string;
    departmentName?: string;
    resourceTitle: string;
    resourceDescription?: string;
    resourceType: string;
    resourceUrl: string;
    fileSize?: string;
    fileType?: string;
    createdBy: string;
    createdAt: string;
    visibleToApproved: boolean;
    downloadCount: number;
}

export default function AdminResourcesPage() {
    const { user } = useAuthContext();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSection, setSelectedSection] = useState('I');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formData, setFormData] = useState({
        section: 'I',
        department: '',
        resourceTitle: '',
        resourceDescription: '',
        resourceUrl: '',
        resourceType: 'study-docs',
        fileSize: '',
        fileType: '',
    });

    useEffect(() => {
        fetchResources();
    }, [user?.email, selectedSection]);

    const fetchResources = async () => {
        if (!user?.email) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/admin/resources', {
                params: {
                    adminEmail: user.email,
                    section: selectedSection,
                },
            });

            setResources(response.data.resources || []);
        } catch (error) {
            toast.error('Failed to fetch resources');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddResource = async () => {
        if (!user?.email || !formData.resourceTitle || !formData.resourceUrl) {
            toast.error('Please fill in required fields');
            return;
        }

        try {
            await axios.post('/api/admin/resources', {
                adminEmail: user.email,
                ...formData,
                section: selectedSection,
            });

            toast.success('Resource added successfully');
            setFormData({
                section: 'I',
                department: '',
                resourceTitle: '',
                resourceDescription: '',
                resourceUrl: '',
                resourceType: 'study-docs',
                fileSize: '',
                fileType: '',
            });
            setShowAddDialog(false);
            fetchResources();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add resource');
        }
    };

    const resourceTypeColors = {
        'study-docs': 'bg-blue-100 text-blue-700',
        'video': 'bg-red-100 text-red-700',
        'assignments': 'bg-green-100 text-green-700',
        'course-info': 'bg-purple-100 text-purple-700',
    };

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>Section Resources</h1>
                <p className='text-gray-600 mt-1'>
                    Manage study materials, videos, and assignments for each section
                </p>
            </div>

            {/* Section Filter */}
            <div className='mb-6 flex gap-2'>
                {['I', 'II', 'III'].map(section => (
                    <button
                        key={section}
                        onClick={() => setSelectedSection(section)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            selectedSection === section
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Section {section}
                    </button>
                ))}
            </div>

            {/* Add Resource Button */}
            <div className='mb-6'>
                <Button
                    onClick={() => setShowAddDialog(true)}
                    className='bg-green-600 hover:bg-green-700 flex items-center gap-2'
                >
                    <Plus className='w-4 h-4' />
                    Add Resource
                </Button>
            </div>

            {/* Resources List */}
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto'></div>
                    </div>
                ) : resources.length === 0 ? (
                    <div className='p-8 text-center'>
                        <BookOpen className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                        <p className='text-gray-500'>No resources for this section yet</p>
                    </div>
                ) : (
                    <div className='space-y-4 p-6'>
                        {resources.map(resource => (
                            <div key={resource.id} className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50'>
                                <div className='flex items-start justify-between'>
                                    <div className='flex-1'>
                                        <div className='flex items-center gap-3 mb-2'>
                                            <h3 className='font-bold text-gray-900'>{resource.resourceTitle}</h3>
                                            <span className={`text-xs font-medium px-2 py-1 rounded ${resourceTypeColors[resource.resourceType as keyof typeof resourceTypeColors]}`}>
                                                {resource.resourceType}
                                            </span>
                                        </div>
                                        {resource.resourceDescription && (
                                            <p className='text-sm text-gray-600 mb-2'>{resource.resourceDescription}</p>
                                        )}
                                        <div className='flex gap-4 text-xs text-gray-500'>
                                            <span>📁 {resource.fileType || 'Link'}</span>
                                            <span>📊 {resource.downloadCount} downloads</span>
                                            <span>📅 {new Date(resource.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className='flex gap-2'>
                                        <Button
                                            size='sm'
                                            variant='outline'
                                            onClick={() => window.open(resource.resourceUrl, '_blank')}
                                        >
                                            <FileText className='w-4 h-4' />
                                        </Button>
                                        <Button
                                            size='sm'
                                            variant='outline'
                                            className='text-red-600 hover:bg-red-50'
                                        >
                                            <Trash2 className='w-4 h-4' />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Resource Dialog */}
            <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <AlertDialogContent className='max-w-md max-h-screen overflow-y-auto'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add New Resource</AlertDialogTitle>
                        <AlertDialogDescription className='pt-4'>
                            <div className='space-y-4'>
                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Section *</label>
                                    <p className='text-sm text-gray-600 mt-1'>Section {selectedSection}</p>
                                </div>

                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Resource Title *</label>
                                    <Input
                                        value={formData.resourceTitle}
                                        onChange={(e) => setFormData({ ...formData, resourceTitle: e.target.value })}
                                        placeholder='e.g., Introduction to Programming'
                                        className='mt-1'
                                    />
                                </div>

                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Description</label>
                                    <textarea
                                        value={formData.resourceDescription}
                                        onChange={(e) => setFormData({ ...formData, resourceDescription: e.target.value })}
                                        placeholder='Brief description of the resource...'
                                        className='w-full mt-1 p-2 border rounded text-sm'
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Resource Type *</label>
                                    <select
                                        value={formData.resourceType}
                                        onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                                        className='w-full mt-1 p-2 border rounded text-sm'
                                    >
                                        <option value='study-docs'>Study Documents</option>
                                        <option value='video'>Video Lectures</option>
                                        <option value='assignments'>Assignments</option>
                                        <option value='course-info'>Course Information</option>
                                    </select>
                                </div>

                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Resource URL *</label>
                                    <Input
                                        type='url'
                                        value={formData.resourceUrl}
                                        onChange={(e) => setFormData({ ...formData, resourceUrl: e.target.value })}
                                        placeholder='https://example.com/resource'
                                        className='mt-1'
                                    />
                                </div>

                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-sm font-medium text-gray-700'>File Type</label>
                                        <Input
                                            value={formData.fileType}
                                            onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                                            placeholder='PDF, MP4, etc.'
                                            className='mt-1'
                                        />
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-700'>File Size</label>
                                        <Input
                                            value={formData.fileSize}
                                            onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                                            placeholder='e.g., 2.5 MB'
                                            className='mt-1'
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className='text-sm font-medium text-gray-700'>Department</label>
                                    <Input
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder='Optional'
                                        className='mt-1'
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAddResource}
                            className='bg-green-600 hover:bg-green-700'
                        >
                            Add Resource
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
