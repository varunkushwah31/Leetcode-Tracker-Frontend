import api from './api';

import type { 
    AuthResponse, 
    LoginRequest, 
    StudentRegisterRequest, 
    MentorRegisterRequest 
} from '../types';

export const AuthService = {
    
    login: (credentials: LoginRequest) => 
        api.post<AuthResponse>('/v1/auth/login', credentials),
    
    registerStudent: (data: StudentRegisterRequest) => 
        api.post<AuthResponse>('/v1/auth/register/student', data),
    
    registerMentor: (data: MentorRegisterRequest) => 
        api.post<AuthResponse>('/v1/auth/register', data),
    
    logout: () => api.post('/v1/auth/logout'),
};

export const StudentService = {
    getDashboard: () => api.get('/students/me/dashboard'),
    validateSubmission: (classroomId: string, assignmentId: string, url: string) => 
        api.post(`/students/me/classrooms/${classroomId}/assignments/${assignmentId}/validate`, { url })
};

// Add these below your StudentService in src/services/endpoints.ts
//Epoque day 1p

export const MentorService = {
    getDashboard: () => api.get('/mentors/me/dashboard'),
};

export const ClassroomService = {
    // Add a student via their email address
    addStudent: (classroomId: string, email: string) => 
        api.post(`/classrooms/${classroomId}/students`, { email }),
    
    // Assign a question to the entire class
    assignQuestion: (classroomId: string, titleSlug: string, startTimestamp: number, endTimestamp: number) => 
        api.post(`/classrooms/${classroomId}/assignments`, { 
            titleSlug, 
            startTimestamp, 
            endTimestamp 
        }),
};


export const AdminService = {
    getOverview: () => api.get('/admin/overview')
};