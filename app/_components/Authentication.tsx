"use client"
import { auth } from '@/configs/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import React, { useState } from 'react'
import { toast } from 'sonner';

function Authentication({ children }: any) {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const provider = new GoogleAuthProvider();
    
    // Configure provider for better UX
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    const onButtonPress = async () => {
        if (isAuthenticating) return;
        
        setIsAuthenticating(true);
        
        try {
            // First, try popup authentication
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log('Authentication successful:', user.email);
            toast.success(`Welcome ${user.displayName || user.email}!`);
        } catch (error: any) {
            console.error('Authentication error:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/popup-blocked') {
                toast.error('Popup was blocked by your browser. Redirecting to Google sign-in...');
                // Fallback to redirect method
                try {
                    await signInWithRedirect(auth, provider);
                } catch (redirectError) {
                    console.error('Redirect error:', redirectError);
                    toast.error('Failed to redirect to sign-in. Please allow popups or try again.');
                }
            } else if (error.code === 'auth/cancelled-popup-request') {
                // User closed the popup or opened multiple - this is expected behavior
                console.log('Popup cancelled by user');
                toast.info('Sign-in cancelled. Please try again when ready.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.log('Popup closed by user');
                toast.info('Sign-in window closed. Click again to continue.');
            } else {
                // Other errors
                toast.error('Authentication failed. Please try again.');
            }
        } finally {
            setIsAuthenticating(false);
        }
    }
    return (
        <div 
            onClick={onButtonPress}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onButtonPress(); } }}
            aria-disabled={isAuthenticating}
            className={`cursor-pointer ${isAuthenticating ? 'opacity-50 pointer-events-none' : ''}`}
        >
            {children}
        </div>
    )
}

export default Authentication