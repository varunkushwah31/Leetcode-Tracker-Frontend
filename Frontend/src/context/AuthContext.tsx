import React, { createContext, useEffect, useState, useContext } from "react";
import type { LoginRequest, MentorRegisterRequest, StudentRegisterRequest } from "@/types";
import { AuthService } from "../services/endpoints";

interface User {
    id: string;
    name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    registerMentor: (data: MentorRegisterRequest) => Promise<void>;
    registerStudent: (data: StudentRegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children : React.ReactNode}> = ({children}) => {

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        if(token && storedUser){
            try{
                setUser(JSON.parse(storedUser));
            }catch(error){
                console.error("Failed to parse stored user data",error);
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    },[]);

    // Helper function to keep our code DRY!
    const handleAuthSuccess = (response: { data: { accessToken: string; mentorId: string; name: string; role: string } }) => {
        const { accessToken, mentorId, name: userName, role: userRole } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify({
            id: mentorId,
            name: userName,
            role: userRole
        }));

        setUser({ id: mentorId, name: userName, role: userRole });
    };

    const login = async (credentials: LoginRequest) => {
        const response = await AuthService.login(credentials);
        handleAuthSuccess(response);
    };

    const registerMentor = async (data: MentorRegisterRequest) => {
        const response = await AuthService.registerMentor(data);
        handleAuthSuccess(response);
    };

    const registerStudent = async (data: StudentRegisterRequest) => {
        const response = await AuthService.registerStudent(data);
        handleAuthSuccess(response);
    };

    const logout = async () => {
        try{
            await AuthService.logout();
        } catch(error){
            console.error("Backend logout failed", error);
        } finally{
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    return(
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                registerMentor,
                registerStudent,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};