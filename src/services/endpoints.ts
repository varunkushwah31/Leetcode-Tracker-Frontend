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

export const AdminService = {
    getOverview: () => api.get('/admin/overview')
};