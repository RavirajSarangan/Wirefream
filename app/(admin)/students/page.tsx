"use client"

import { useEffect, useState } from 'react'
import { useAuthContext } from '@/app/provider'
import axios from 'axios'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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
import { CheckCircle, XCircle, Clock, User } from 'lucide-react'

interface StudentApplication {
    id: number
    eid: string
    studentName: string
    email?: string
    phone?: string
    department?: string
    section?: string
    studentYear?: string
    registrationDate: string
    status: 'pending' | 'approved' | 'denied'
    approvalDate?: string
    approvedBy?: string
}

export default function StudentApplicationsPage() {
    const { user } = useAuthContext()
    const [applications, setApplications] = useState<StudentApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStudent, setSelectedStudent] = useState<StudentApplication | null>(null)
    const [showApprovalDialog, setShowApprovalDialog] = useState(false)
    const [showDenialDialog, setShowDenialDialog] = useState(false)
    const [denialReason, setDenialReason] = useState('')
    const [validityDays, setValidityDays] = useState(365)
    const [sections, setSections] = useState('')

    useEffect(() => {
        fetchApplications()
    }, [user?.email])

    const fetchApplications = async () => {
        if (!user?.email) return

        try {
            setLoading(true)
            const response = await axios.get('/api/admin/students', {
                params: {
                    adminEmail: user.email,
                    status: 'pending',
                    limit: 100
                }
            })

            setApplications(response.data.students || [])
        } catch (error) {
            toast.error('Failed to fetch student applications')
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!selectedStudent || !user?.email) return

        try {
            const response = await axios.post(
                `/api/admin/students/${selectedStudent.eid}/approve`,
                {
                    adminEmail: user.email,
                    sections: sections || selectedStudent.section,
                    validityDays,
                    reason: 'Approved by admin'
                }
            )

            setApplications(applications.filter(a => a.eid !== selectedStudent.eid))
            toast.success(`Approved: ${selectedStudent.studentName}`)
            setShowApprovalDialog(false)
            setSelectedStudent(null)
            setSections('')
            setValidityDays(365)
        } catch (error) {
            toast.error('Failed to approve student')
            console.error('Error:', error)
        }
    }

    const handleDeny = async () => {
        if (!selectedStudent || !user?.email || !denialReason.trim()) return

        try {
            await axios.post(
                `/api/admin/students/${selectedStudent.eid}/deny`,
                {
                    adminEmail: user.email,
                    reason: denialReason
                }
            )

            setApplications(applications.filter(a => a.eid !== selectedStudent.eid))
            toast.success(`Denied: ${selectedStudent.studentName}`)
            setShowDenialDialog(false)
            setSelectedStudent(null)
            setDenialReason('')
        } catch (error) {
            toast.error('Failed to deny student')
            console.error('Error:', error)
        }
    }

    return (
        <div className='p-6 md:p-10'>
            {/* Header */}
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>Student Applications</h1>
                <p className='text-gray-600 mt-1'>
                    Review and approve student access requests
                </p>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                <div className='bg-yellow-50 rounded-lg border border-yellow-200 p-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-sm text-yellow-700'>Pending Applications</p>
                            <p className='text-2xl font-bold text-yellow-900 mt-1'>
                                {applications.length}
                            </p>
                        </div>
                        <Clock className='w-8 h-8 text-yellow-600' />
                    </div>
                </div>
            </div>

            {/* Applications List */}
            <div className='bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden'>
                {loading ? (
                    <div className='p-8 text-center'>
                        <div className='w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto'></div>
                    </div>
                ) : applications.length === 0 ? (
                    <div className='p-8 text-center'>
                        <p className='text-gray-500'>No pending applications</p>
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead className='bg-gray-50 border-b border-gray-200'>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        ESU ID
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        Name
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        Section
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        Department
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        Year
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        Applied Date
                                    </th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase'>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {applications.map(app => (
                                    <tr key={app.id} className='hover:bg-gray-50'>
                                        <td className='px-6 py-4 text-sm font-mono text-blue-600'>
                                            {app.eid}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-900 font-medium'>
                                            {app.studentName}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-600'>
                                            {app.section || 'N/A'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-600'>
                                            {app.department || 'N/A'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-600'>
                                            {app.studentYear || 'N/A'}
                                        </td>
                                        <td className='px-6 py-4 text-sm text-gray-600'>
                                            {new Date(app.registrationDate).toLocaleDateString()}
                                        </td>
                                        <td className='px-6 py-4 text-sm flex items-center gap-2'>
                                            <Button
                                                size='sm'
                                                className='bg-green-600 hover:bg-green-700 flex items-center gap-1'
                                                onClick={() => {
                                                    setSelectedStudent(app)
                                                    setSections(app.section || '')
                                                    setShowApprovalDialog(true)
                                                }}
                                            >
                                                <CheckCircle className='w-4 h-4' />
                                                Approve
                                            </Button>
                                            <Button
                                                size='sm'
                                                variant='destructive'
                                                className='flex items-center gap-1'
                                                onClick={() => {
                                                    setSelectedStudent(app)
                                                    setShowDenialDialog(true)
                                                }}
                                            >
                                                <XCircle className='w-4 h-4' />
                                                Deny
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Approval Dialog */}
            <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <AlertDialogContent className='max-w-md'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Student Access</AlertDialogTitle>
                        <AlertDialogDescription className='pt-4'>
                            {selectedStudent && (
                                <div className='space-y-4'>
                                    <div>
                                        <p className='text-sm font-medium text-gray-700'>Student</p>
                                        <p className='text-sm text-gray-900 mt-1'>
                                            {selectedStudent.studentName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className='text-sm font-medium text-gray-700'>ESU ID</p>
                                        <p className='text-sm font-mono text-blue-600 mt-1'>
                                            {selectedStudent.eid}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-700'>
                                            Sections
                                        </label>
                                        <Input
                                            value={sections}
                                            onChange={(e) => setSections(e.target.value)}
                                            placeholder='e.g., I, II, III'
                                            className='mt-1'
                                        />
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-700'>
                                            Validity (days)
                                        </label>
                                        <Input
                                            type='number'
                                            value={validityDays}
                                            onChange={(e) => setValidityDays(parseInt(e.target.value) || 365)}
                                            className='mt-1'
                                        />
                                    </div>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleApprove}
                            className='bg-green-600 hover:bg-green-700'
                        >
                            Approve Access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Denial Dialog */}
            <AlertDialog open={showDenialDialog} onOpenChange={setShowDenialDialog}>
                <AlertDialogContent className='max-w-md'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deny Student Access</AlertDialogTitle>
                        <AlertDialogDescription className='pt-4'>
                            {selectedStudent && (
                                <div className='space-y-4'>
                                    <div>
                                        <p className='text-sm font-medium text-gray-700'>
                                            Denying access for:
                                        </p>
                                        <p className='text-sm text-gray-900 mt-1'>
                                            {selectedStudent.studentName}
                                        </p>
                                    </div>
                                    <div>
                                        <label className='text-sm font-medium text-gray-700'>
                                            Reason for Denial
                                        </label>
                                        <textarea
                                            value={denialReason}
                                            onChange={(e) => setDenialReason(e.target.value)}
                                            placeholder='Enter reason for denial...'
                                            className='w-full mt-1 p-2 border rounded text-sm'
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeny}
                            disabled={!denialReason.trim()}
                            className='bg-red-600 hover:bg-red-700'
                        >
                            Deny Access
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
