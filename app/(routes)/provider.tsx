"use client"
import React, { useEffect, useCallback } from 'react'
import { useAuthContext } from '../provider';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import axios from "axios";
import AppHeader from '../_components/AppHeader';
import { AppSidebar } from '../_components/AppSidebar';

function DashboardProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const user = useAuthContext();
    const router = useRouter();

    const checkUser = useCallback(async () => {
        try {
            await axios.post('/api/user', {
                userName: user?.user?.displayName,
                userEmail: user?.user?.email
            });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('User check failed:', error.message);
            } else {
                console.error('Unexpected error during user check:', error);
            }
        }
    }, [user?.user?.displayName, user?.user?.email]);

    useEffect(() => {
        if (user?.user === null) {
            router.replace('/');
            return;
        }
        if (user?.user) {
            checkUser();
        }
    }, [user, checkUser, router])


    return (
        <SidebarProvider>
            <AppSidebar />
            <main className='w-full'>
                <AppHeader />
                <div className='p-5 md:p-10'>{children}</div>
            </main>
        </SidebarProvider>

    )
}

export default DashboardProvider