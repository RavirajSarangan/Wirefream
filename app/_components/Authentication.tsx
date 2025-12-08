"use client"
import { auth } from '@/configs/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import React from 'react'

function Authentication({ children }: any) {
    const provider = new GoogleAuthProvider();

    const onButtonPress = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                console.log(user);
            }).catch((error) => {
                console.error('Authentication error:', error);
            });
    }
    return (
        <div>
            <div 
                onClick={onButtonPress}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onButtonPress();
                    }
                }}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
            >
                {children}
            </div>
        </div>
    )
}

export default Authentication