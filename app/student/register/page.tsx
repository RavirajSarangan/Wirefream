'use client';

import React, { useState } from 'react';
import { useStudentContext } from '@/context/StudentProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function StudentRegisterPage() {
    const { student, loginWithEid } = useStudentContext();
    const router = useRouter();
    const [step, setStep] = useState<'login' | 'register'>('login');
    const [eid, setEid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    React.useEffect(() => {
        if (student.isLoggedIn && !student.isLoading) {
            router.push('/student');
        }
    }, [student.isLoggedIn, student.isLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eid.trim()) {
            setError('Please enter your ESU ID');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await loginWithEid(eid);
            toast.success('Welcome! Logged in successfully');
            router.push('/student');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Login failed';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            eid: formData.get('eid'),
            studentName: formData.get('studentName'),
            email: formData.get('email') || undefined,
            phone: formData.get('phone') || undefined,
            department: formData.get('department') || undefined,
            section: formData.get('section') || undefined,
            studentYear: formData.get('studentYear') || undefined,
        };

        try {
            setLoading(true);
            setError('');

            if (!data.eid || !data.studentName) {
                setError('ESU ID and Student Name are required');
                setLoading(false);
                return;
            }

            const response = await axios.post('/api/student/register', data);
            toast.success('Registration successful! Please wait for admin approval.');
            setStep('login');
            setEid(data.eid as string);

            // Auto-login after registration
            setTimeout(() => {
                loginWithEid(data.eid as string);
                router.push('/student');
            }, 1500);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Registration failed';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">ESU Jaffna</h1>
                        <p className="text-gray-600 mt-2">Student Access Portal</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setStep('login')}
                            className={`flex-1 py-2 px-4 rounded font-medium transition ${
                                step === 'login'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setStep('register')}
                            className={`flex-1 py-2 px-4 rounded font-medium transition ${
                                step === 'register'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    {step === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ESU Student ID (Eid)
                                </label>
                                <Input
                                    type="text"
                                    value={eid}
                                    onChange={(e) => setEid(e.target.value)}
                                    placeholder="e.g., ESU2024001"
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>
                            <p className="text-sm text-gray-600 text-center">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setStep('register')}
                                    className="text-blue-600 hover:underline"
                                >
                                    Register here
                                </button>
                            </p>
                        </form>
                    )}

                    {/* Register Form */}
                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ESU Student ID (Eid) *
                                </label>
                                <Input
                                    type="text"
                                    name="eid"
                                    placeholder="e.g., ESU2024001"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <Input
                                    type="text"
                                    name="studentName"
                                    placeholder="Your full name"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="your.email@esu.edu"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <Input
                                    type="tel"
                                    name="phone"
                                    placeholder="+94 XX XXX XXXX"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    name="department"
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Management">Management</option>
                                    <option value="Science">Science</option>
                                    <option value="Arts">Arts</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Section
                                </label>
                                <select
                                    name="section"
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Section</option>
                                    <option value="I">Section I</option>
                                    <option value="II">Section II</option>
                                    <option value="III">Section III</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Student Year
                                </label>
                                <select
                                    name="studentYear"
                                    disabled={loading}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Year</option>
                                    <option value="First Year">First Year</option>
                                    <option value="Second Year">Second Year</option>
                                    <option value="Final Year">Final Year</option>
                                </select>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? 'Registering...' : 'Register'}
                            </Button>

                            <p className="text-sm text-gray-600 text-center">
                                Already registered?{' '}
                                <button
                                    type="button"
                                    onClick={() => setStep('login')}
                                    className="text-blue-600 hover:underline"
                                >
                                    Login here
                                </button>
                            </p>
                        </form>
                    )}

                    {/* Info */}
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <strong>Note:</strong> After registration, your application will be reviewed by an administrator. You'll receive access to approved resources once approved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
