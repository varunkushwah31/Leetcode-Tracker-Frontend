import { createContext } from "react";
import type { LoginRequest, MentorRegisterRequest, Role, StudentRegisterRequest } from "@/types";

export interface User {
    id: string;
    name: string;
    role: Role;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    registerMentor: (data: MentorRegisterRequest) => Promise<void>;
    registerStudent: (data: StudentRegisterRequest) => Promise<void>;
    loginWithToken: (token: string, userOverride?: Partial<User>) => void;
    logout: () => Promise<void>;
}

export const ALLOWED_ROLES: readonly Role[] = ['SUPER_ADMIN', 'MENTOR', 'STUDENT'];

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
