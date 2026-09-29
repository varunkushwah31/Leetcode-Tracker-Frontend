import type { FC, ReactNode } from "react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import type { AuthResponse, LoginRequest, MentorRegisterRequest, Role, StudentRegisterRequest } from "@/types";
import { AuthService } from "../services/endpoints";
import { AuthContext, ALLOWED_ROLES } from "./authContextBase";
import type { User } from "./authContextBase";

export type { User } from "./authContextBase";

function isValidUser(value: unknown): value is User {
    if (typeof value !== 'object' || value === null) return false;
    const v = value as Record<string, unknown>;
    return (
        typeof v.id === 'string' && v.id.length > 0 &&
        typeof v.name === 'string' && v.name.length > 0 &&
        typeof v.role === 'string' && (ALLOWED_ROLES as readonly string[]).includes(v.role)
    );
}

function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwtDecode<{ exp?: number }>(token);
        if (typeof decoded.exp !== 'number') return false;
        return decoded.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

function clearStoredAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            if (isTokenExpired(token)) {
                clearStoredAuth();
            } else {
                try {
                    const parsed: unknown = JSON.parse(storedUser);
                    if (isValidUser(parsed)) {
                        setUser(parsed);
                    } else {
                        clearStoredAuth();
                    }
                } catch {
                    clearStoredAuth();
                }
            }
        } else if (token && isTokenExpired(token)) {
            clearStoredAuth();
        }
        setIsLoading(false);
    }, []);

    const handleAuthSuccess = useCallback((response: { data: AuthResponse }) => {
        const { accessToken, userId, name: userName, role: userRole } = response.data;
        const id = userId;
        if (!accessToken || !id || !userName || !ALLOWED_ROLES.includes(userRole)) {
            throw new Error('Invalid authentication response from server.');
        }

        localStorage.setItem('accessToken', accessToken);
        const nextUser: User = { id, name: userName, role: userRole };
        localStorage.setItem('user', JSON.stringify(nextUser));

        setUser(nextUser);
    }, []);

    const loginWithToken = useCallback((token: string, userOverride?: Partial<User>) => {
        if (!token || isTokenExpired(token)) {
            throw new Error('Invalid or expired token.');
        }
        const decoded = jwtDecode<{ sub?: string; roles?: string[]; role?: string; userId?: string; id?: string; name?: string }>(token);
        const roleCandidate = userOverride?.role || decoded.role || (decoded.roles?.[0]?.replace('ROLE_', '')) || 'STUDENT';
        const role = (ALLOWED_ROLES.includes(roleCandidate as Role) ? roleCandidate : 'STUDENT') as Role;
        const id = userOverride?.id || decoded.userId || decoded.id || decoded.sub || 'user';
        const name = userOverride?.name || decoded.name || decoded.sub?.split('@')[0] || 'User';

        const nextUser: User = { id, name, role };
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(nextUser));
        setUser(nextUser);
    }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
        const response = await AuthService.login(credentials);
        handleAuthSuccess(response);
    }, [handleAuthSuccess]);

    const registerMentor = useCallback(async (data: MentorRegisterRequest) => {
        const response = await AuthService.registerMentor(data);
        handleAuthSuccess(response);
    }, [handleAuthSuccess]);

    const registerStudent = useCallback(async (data: StudentRegisterRequest) => {
        const response = await AuthService.registerStudent(data);
        handleAuthSuccess(response);
    }, [handleAuthSuccess]);

    const logout = useCallback(async () => {
        try {
            await AuthService.logout();
        } catch {
            // Backend logout failure is non-fatal; still clear local state below.
        } finally {
            clearStoredAuth();
            setUser(null);
        }
    }, []);

    const isAuthenticated = !!user;

    const contextValue = useMemo(
        () => ({
            user,
            isAuthenticated,
            isLoading,
            login,
            registerMentor,
            registerStudent,
            loginWithToken,
            logout,
        }),
        [user, isAuthenticated, isLoading, login, registerMentor, registerStudent, loginWithToken, logout]
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
