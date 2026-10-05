import api from './api';

import type { 
    AuthResponse, 
    LoginRequest, 
    StudentRegisterRequest, 
    MentorRegisterRequest, 
    LearningPath,
    BulkImportResponseDTO
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
    
    // The Auto-Sync endpoint (can sync by username/handle or current session)
    syncProfile: (identifier?: string) =>
        identifier ? api.post(`/students/${identifier}/sync`) : api.post('/students/me/sync'),

    getExtendedProfile: (username: string) => api.post(`/students/${username}/extended/fetch`),

    validateSubmission: (classroomId: string, assignmentId: string, url: string) =>
        api.post(`/students/me/classrooms/${classroomId}/assignments/${assignmentId}/validate`, { url }),

    autoValidateSubmission: (classroomId: string, assignmentId: string) =>
        api.post(`/students/me/classrooms/${classroomId}/assignments/${assignmentId}/auto-validate`),

    updateHandles: (leetcodeUsername?: string, codeforcesHandle?: string) =>
        api.put('/students/me/handles', { leetcodeUsername, codeforcesHandle }),

    // Individual Student Report CSV download
    exportStudentReport: (username: string) =>
        api.get(`/students/${username}/report`, { responseType: 'blob' }),

    // Logged-in Student's own Report CSV download
    exportMyReport: () =>
        api.get('/students/me/report', { responseType: 'blob' }),
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
    addStudent: (classroomId: string, identifier: string, mentorId?: string) =>
        api.post(`/classrooms/${classroomId}/students`, null, {
            params: {
                identifier,
                leetcodeUsername: identifier,
                ...(mentorId ? { mentorId } : {})
            }
        }),
    removeStudent: (classroomId: string, studentIdentifier: string, mentorId?: string) =>
        api.delete(`/classrooms/${classroomId}/students/${encodeURIComponent(studentIdentifier)}`, {
            params: mentorId ? { mentorId } : undefined
        }),
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

    updateAssignmentDeadline: (classroomId: string, assignmentId: string, mentorId: string, newEndTimestamp: number) =>
        api.put(`/classrooms/${classroomId}/assignments/${assignmentId}/deadline`, null, {
            params: { mentorId, newEndTimestamp }
        }),

    validateStudentSubmission: (classroomId: string, username: string, assignmentId: string, url: string) =>
        api.post(`/classrooms/${classroomId}/students/${username}/assignments/${assignmentId}/validate`, { url }),

    nudgeStudent: (classroomId: string, studentId: string, assignmentName: string) =>
        api.post(`/classrooms/${classroomId}/students/${studentId}/nudge`, null, { params: { assignmentName } }),
    
    // Upload CSV (let axios set the multipart boundary automatically)
    bulkAddStudents: (classroomId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<BulkImportResponseDTO>(`/classrooms/${classroomId}/students/bulk`, formData);
    },

    deleteClassroom: (classroomId: string, mentorId: string) => api.delete(`/classrooms/${classroomId}`, { params: { mentorId } }),
    
    // Download Leaderboard CSV 
    exportClassroom: (classroomId: string) => api.get(`/classrooms/${classroomId}/export`, { responseType: 'blob' }),

    // Download Assignment Matrix CSV
    exportAssignmentMatrix: (classroomId: string) => api.get(`/classrooms/${classroomId}/export/assignments`, { responseType: 'blob' }),

    // Download Sample CSV Template
    downloadTemplateCsv: () => api.get('/classrooms/template/csv', { responseType: 'blob' })
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


