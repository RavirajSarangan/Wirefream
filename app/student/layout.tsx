'use client';

import React from 'react';
import { useStudentContext } from '@/context/StudentProvider';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, Home, FileText, User } from 'lucide-react';
import Link from 'next/link';

// Pages that don't require authentication
const PUBLIC_PAGES = ['/student/register'];

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { student, logout } = useStudentContext();
    const router = useRouter();
    const pathname = usePathname();

    // Check if current page is public
    const isPublicPage = PUBLIC_PAGES.includes(pathname);

    // Redirect to register if not authenticated and not on public page
    React.useEffect(() => {
        if (!student.isLoading && !student.isLoggedIn && !isPublicPage) {
            router.push('/student/register');
        }
    }, [student.isLoading, student.isLoggedIn, isPublicPage, pathname, router]);

    const handleLogout = () => {
        logout();
        router.push('/student/register');
    };

    // Show nothing while loading
    if (student.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            {student.isLoggedIn && (
                <nav className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center gap-8">
                                <Link href="/student" className="flex items-center gap-2 text-blue-600 font-bold">
                                    <BookOpen className="w-6 h-6" />
                                    <span>Student Portal</span>
                                </Link>
                                <div className="flex gap-4">
                                    <Link
                                        href="/student"
                                        className={`p-2 rounded flex items-center gap-1 ${
                                            pathname === '/student'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Home className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/student/resources"
                                        className={`p-2 rounded flex items-center gap-1 ${
                                            pathname === '/student/resources'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Resources
                                    </Link>
                                    <Link
                                        href="/student/documents"
                                        className={`p-2 rounded flex items-center gap-1 ${
                                            pathname === '/student/documents'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Documents
                                    </Link>
                                    <Link
                                        href="/student/profile"
                                        className={`p-2 rounded flex items-center gap-1 ${
                                            pathname === '/student/profile'
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <User className="w-4 h-4" />
                                        Profile
                                    </Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">ESU ID: <strong>{student.eid}</strong></span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleLogout}
                                    className="flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </nav>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
