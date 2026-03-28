"use client"
import { auth } from '@/configs/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { getRedirectResult, onAuthStateChanged, User } from 'firebase/auth';
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner';
import { StudentProvider } from '@/context/StudentProvider';

interface AuthContextType {
    user: User | null;
}

function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [user, setUser] = useState<User | null>(null);

    const authContextValue = useMemo(() => ({ user }), [user]);

    useEffect(() => {
        // Handle redirect result (for when popup is blocked)
        getRedirectResult(auth)
            .then((result) => {
                if (result?.user) {
                    console.log('Redirect authentication successful:', result.user.email);
                    toast.success(`Welcome back ${result.user.displayName || result.user.email}!`);
                }
            })
            .catch((error) => {
                if (error.code !== 'auth/invalid-api-key') {
                    console.error('Redirect result error:', error);
                }
            });

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });

        return () => unsubscribe(); // Cleanup
    }, []);

    return (
        <AuthContext.Provider value={authContextValue}>
            <StudentProvider>
                <div>
                    {children}
                </div>
            </StudentProvider>
        </AuthContext.Provider>
    )
}

// Custom hook to use auth
export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

export default Provider

