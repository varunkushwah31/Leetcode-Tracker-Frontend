import api from './api';

import type { 
    AuthResponse, 
    LoginRequest, 
    StudentRegisterRequest, 
    MentorRegisterRequest, 
    LearningPath
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
    
    // The new Auto-Sync endpoint!
    syncProfile: (username: string) => api.post(`/students/${username}/sync`),
};

export const MentorService = {
    // Fetches the mentor to get their array of classroomIds
    getProfile: (mentorId: string) => api.get(`/mentors/${mentorId}`),
};

export const ClassroomService = {
    createClassroom: (mentorId: string, className: string) => api.post('/classrooms', null, { params: { mentorId, className } }),
    getDashboard: (classroomId: string, sortBy: string = 'solved') => api.get(`/classrooms/${classroomId}/dashboard`, { params: { sortBy } }),
    addStudent: (classroomId: string, leetcodeUsername: string) => api.post(`/classrooms/${classroomId}/students`, null, { params: { leetcodeUsername } }),
    assignQuestion: (classroomId: string, titleSlug: string, start: number, end: number) => api.post(`/classrooms/${classroomId}/assignments`, null, { params: { titleSlug, startTimestamp: start, endTimestamp: end } }),
    
    // Upload CSV 
    bulkAddStudents: (classroomId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/classrooms/${classroomId}/students/bulk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    
    // Download CSV 
    exportClassroom: (classroomId: string) => api.get(`/classrooms/${classroomId}/export`, { responseType: 'blob' })
};


export const PathService = {
    createPath: (path: LearningPath) => api.post('/paths', path),
    getMentorPaths: (mentorId: string) => api.get(`/paths/mentor/${mentorId}`),
    assignPath: (pathId: string, classroomId: string) => api.post(`/paths/${pathId}/assign/${classroomId}`)
};


export const AdminService = {
    getOverview: () => api.get('/admin/overview')
};