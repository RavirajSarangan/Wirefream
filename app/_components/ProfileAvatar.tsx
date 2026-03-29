"use client"
import { auth } from '@/configs/firebaseConfig';
import { signOut } from 'firebase/auth';
import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../provider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react';

function ProfileAvatar() {

    const user = useAuthContext();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user?.user?.email) return;

            try {
                const response = await axios.get('/api/auth/check-admin', {
                    params: { email: user.user.email }
                });
                setIsAdmin(response.data.isAdmin);
            } catch (error) {
                console.error('Failed to check admin status:', error);
                setIsAdmin(false);
            }
        };

        if (user?.user?.email) {
            checkAdminStatus();
        }
    }, [user?.user?.email]);

    const onButtonPress = () => {
        signOut(auth).then(() => {
            // Sign-out successful.
            router.replace('/')
        }).catch((error) => {
            // An error happened.
        });
    }
    return (
        <div>
            <Popover >
                <PopoverTrigger>
                    {user?.user?.photoURL && <img src={user?.user?.photoURL} alt='profile' className='w-[35px] h-[35px] rounded-full' />}
                </PopoverTrigger>
                <PopoverContent className='w-auto'>
                    <div className='space-y-2'>
                        {isAdmin && (
                            <Button
                                variant={'default'}
                                onClick={() => router.push('/admin')}
                                className='w-full flex items-center gap-2'
                            >
                                <ShieldAlert className='w-4 h-4' />
                                Admin Dashboard
                            </Button>
                        )}
                        <Button variant={'ghost'} onClick={onButtonPress} className='w-full'>Logout</Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default ProfileAvatar