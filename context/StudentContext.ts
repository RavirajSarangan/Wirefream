import React from 'react';

export interface StudentAuthState {
    eid: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface StudentContextType {
    student: StudentAuthState;
    loginWithEid: (eid: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const StudentContext = React.createContext<StudentContextType | undefined>(undefined);
