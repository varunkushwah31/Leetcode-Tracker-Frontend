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
    // Fetches the mentor to get their array of classroomIds
    getProfile: (mentorId: string) => api.get(`/mentors/${mentorId}`),
};

export const ClassroomService = {
    // 1. Create a Classroom
    createClassroom: (mentorId: string, className: string) => 
        api.post(`/classrooms?mentorId=${mentorId}&className=${encodeURIComponent(className)}`),
    
    // 2. Get Classroom Dashboard (Server-Side Sorting supported!)
    getDashboard: (classroomId: string, sortBy: string = 'solved') => 
        api.get(`/classrooms/${classroomId}/dashboard?sortBy=${sortBy}`),

    // 3. Add Student by LeetCode Username
    addStudent: (classroomId: string, leetcodeUsername: string) => 
        api.post(`/classrooms/${classroomId}/students/${leetcodeUsername}`),
    
    // 4. Assign Question
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