import api from './api';

import type { 
    AuthResponse, 
    LoginRequest, 
    StudentRegisterRequest, 
    MentorRegisterRequest, 
    LearningPath
} from '@/types';

export const AuthService = {

    login: (credentials: LoginRequest) =>
        api.post<AuthResponse>('/v1/auth/login', credentials),

    registerStudent: (data: StudentRegisterRequest) =>
        api.post<AuthResponse>('/v1/auth/register/student', data),

    registerMentor: (data: MentorRegisterRequest) =>
        api.post<AuthResponse>('/v1/auth/register', data),

    logout: () => api.post('/v1/auth/logout'),

    // FIXED: Changed axiosInstance to api, and updated the path to match the others!
    verifyEmail: (email: string, otp: string) =>
        api.post<AuthResponse>('/v1/auth/verify-email', { email, otp })
};

export const StudentService = {
    getDashboard: () => api.get('/students/me/dashboard'),
    
    // The new Auto-Sync endpoint!
    syncProfile: (username: string) => api.post(`/students/${username}/sync`),

    getExtendedProfile: (username: string) => api.post(`/students/${username}/extended/fetch`),

    validateSubmission: (classroomId: string, assignmentId: string, url: string) =>
        api.post(`/students/me/classrooms/${classroomId}/assignments/${assignmentId}/validate`, { url }),

    autoValidateSubmission: (classroomId: string, assignmentId: string) =>
        api.post(`/students/me/classrooms/${classroomId}/assignments/${assignmentId}/auto-validate`),

    updateHandles: (leetcodeUsername: string, codeforcesHandle?: string) =>
        api.put('/students/me/handles', { leetcodeUsername, codeforcesHandle }),
};

export const MentorService = {
    // Fetches the mentor to get their array of classroomIds
    getProfile: (mentorId: string) => api.get(`/mentors/${mentorId}`),
};

export const ClassroomService = {
    // NOTE: mentorId is currently passed from the client, but it must move
    // server-side (derive the mentor from the authenticated principal/JWT) so
    // clients cannot spoof another mentor's identity.
    createClassroom: (mentorId: string, className: string) => api.post('/classrooms', null, { params: { mentorId, className } }),
    getDashboard: (classroomId: string, sortBy: string = 'solved') => api.get(`/classrooms/${classroomId}/dashboard`, { params: { sortBy } }),
    addStudent: (classroomId: string, leetcodeUsername: string) => api.post(`/classrooms/${classroomId}/students`, null, { params: { leetcodeUsername } }),
    assignQuestion: (classroomId: string, titleSlugOrData: string | { platform?: 'LEETCODE' | 'CODEFORCES'; title?: string; titleSlug: string; questionLink?: string; start: number; end: number }, start?: number, end?: number) => {
        if (typeof titleSlugOrData === 'object') {
            return api.post(`/classrooms/${classroomId}/assignments`, {
                platform: titleSlugOrData.platform || 'LEETCODE',
                title: titleSlugOrData.title,
                titleSlug: titleSlugOrData.titleSlug,
                questionLink: titleSlugOrData.questionLink,
                startTimestamp: titleSlugOrData.start,
                endTimestamp: titleSlugOrData.end,
            });
        }
        return api.post(`/classrooms/${classroomId}/assignments`, {
            platform: 'LEETCODE',
            titleSlug: titleSlugOrData,
            startTimestamp: start,
            endTimestamp: end,
        });
    },
    getAnalytics: (classroomId: string) => api.get(`/classrooms/${classroomId}/analytics`),

    deleteAssignment: (classroomId: string, assignmentId: string, mentorId: string) =>
        api.delete(`/classrooms/${classroomId}/assignments/${assignmentId}`, { params: { mentorId } }),

    validateStudentSubmission: (classroomId: string, username: string, assignmentId: string, url: string) =>
        api.post(`/classrooms/${classroomId}/students/${username}/assignments/${assignmentId}/validate`, { url }),

    nudgeStudent: (classroomId: string, studentId: string, assignmentName: string) =>
        api.post(`/classrooms/${classroomId}/students/${studentId}/nudge`, null, { params: { assignmentName } }),
    
    // Upload CSV (let axios set the multipart boundary automatically)
    bulkAddStudents: (classroomId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/classrooms/${classroomId}/students/bulk`, formData);
    },

    deleteClassroom: (classroomId: string, mentorId: string) => api.delete(`/classrooms/${classroomId}`, { params: { mentorId } }),
    
    // Download CSV 
    exportClassroom: (classroomId: string) => api.get(`/classrooms/${classroomId}/export`, { responseType: 'blob' })
};


export const PathService = {
    createPath: (path: LearningPath) => api.post('/paths', path),
    getMentorPaths: (mentorId: string) => api.get(`/paths/mentor/${mentorId}`),
    assignPath: (pathId: string, classroomId: string) => api.post(`/paths/${pathId}/assign/${classroomId}`)
};


export const AdminService = {
    getOverview: () => api.get('/admin/overview'),
    deleteMentor: (id: string) => api.delete(`/admin/mentors/${id}`),
    deleteClassroom: (id: string) => api.delete(`/admin/classrooms/${id}`),
    forceSyncAll: () => api.post('/admin/sync-all')
};


