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
    verifyOtp: (email: string, otp: string) => Promise<void>; // <-- 1. Added verifyOtp type
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

    // Helper function to handle successful token retrievals
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
        // 2. We NO LONGER call handleAuthSuccess here, because the backend
        // just returns a {message: "..."} and no token!
        await AuthService.registerMentor(data);
    };

    const registerStudent = async (data: StudentRegisterRequest) => {
        // 2. Same here. Just send the request and wait for the OTP.
        await AuthService.registerStudent(data);
    };

    // 3. NEW: The verification function that actually logs them in
    const verifyOtp = async (email: string, otp: string) => {
        // Assuming you add verifyEmail to your AuthService endpoints!
        const response = await AuthService.verifyEmail(email, otp);
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
                verifyOtp, // <-- Make sure to expose it here
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};