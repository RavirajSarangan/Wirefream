'use client';

import React, { useContext, useEffect, useState, useMemo } from 'react';
import { StudentContext, StudentContextType, StudentAuthState } from './StudentContext';
import axios from 'axios';

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [student, setStudent] = useState<StudentAuthState>({
        eid: null,
        isLoggedIn: false,
        isLoading: true,
        error: null,
    });

    // Load stored ESU ID on mount
    useEffect(() => {
        const storedEid = localStorage.getItem('studentEid');
        if (storedEid) {
            setStudent(prev => ({
                ...prev,
                eid: storedEid,
                isLoggedIn: true,
                isLoading: false,
            }));
        } else {
            setStudent(prev => ({
                ...prev,
                isLoading: false,
            }));
        }
    }, []);

    const loginWithEid = async (eid: string) => {
        try {
            setStudent(prev => ({
                ...prev,
                isLoading: true,
                error: null,
            }));

            // Verify student exists and get status
            await axios.get('/api/student/status', {
                params: { eid },
            });

            localStorage.setItem('studentEid', eid);
            setStudent({
                eid,
                isLoggedIn: true,
                isLoading: false,
                error: null,
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to verify student';
            setStudent(prev => ({
                ...prev,
                isLoading: false,
                error: errorMsg,
            }));
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('studentEid');
        setStudent({
            eid: null,
            isLoggedIn: false,
            isLoading: false,
            error: null,
        });
    };

    const clearError = () => {
        setStudent(prev => ({
            ...prev,
            error: null,
        }));
    };

    const value: StudentContextType = useMemo(() => ({
        student,
        loginWithEid,
        logout,
        clearError,
    }), [student, loginWithEid, logout, clearError]);

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};

export const useStudentContext = (): StudentContextType => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudentContext must be used within StudentProvider');
    }
    return context;
};
