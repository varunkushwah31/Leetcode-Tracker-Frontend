import api from './api';

import type { 
    AuthResponse, 
    LoginRequest, 
    StudentRegisterRequest, 
    MentorRegisterRequest, 
    ChangePasswordRequest,
    ForgotPasswordRequest,
    VerifyOtpRequest,
    ResetPasswordRequest,
    VerifyOtpResponse,
    LearningPath,
    BulkImportResponseDTO,
    SystemOverviewDTO,
    StudentSummaryDTO,
    MentorDTO,
    CacheStatsResponse,
    DailyChallengeDTO,
    UpcomingContestDTO
} from '@/types';

export const AuthService = {

    login: (credentials: LoginRequest) =>
        api.post<AuthResponse>('/v1/auth/login', credentials),

    registerStudent: (data: StudentRegisterRequest) =>
        api.post<AuthResponse>('/v1/auth/register/student', data),

    registerMentor: (data: MentorRegisterRequest) =>
        api.post<AuthResponse>('/v1/auth/register', data),

    logout: () => api.post('/v1/auth/logout'),

    verifyEmail: (email: string, otp: string) =>
        api.post<AuthResponse>('/v1/auth/verify-email', { email, otp }),

    changePassword: (data: ChangePasswordRequest) =>
        api.post<{ message: string }>('/v1/auth/change-password', data),

    forgotPassword: (data: ForgotPasswordRequest | string) =>
        api.post<{ message: string }>('/v1/auth/forgot-password', typeof data === 'string' ? { email: data } : data),

    verifyOtp: (emailOrData: VerifyOtpRequest | string, otp?: string) =>
        api.post<VerifyOtpResponse>('/v1/auth/verify-otp', typeof emailOrData === 'string' ? { email: emailOrData, otp: otp || '' } : emailOrData),

    resetPassword: (data: ResetPasswordRequest) =>
        api.post<{ message: string }>('/v1/auth/reset-password', data)
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
    createClassroom: (mentorId: string, className: string) =>
        api.post('/classrooms', { mentorId, className }, {
            params: { mentorId, className },
            headers: { 'Content-Type': 'application/json' }
        }),
    getDashboard: (classroomId: string, sortBy: string = 'solved') => api.get(`/classrooms/${classroomId}/dashboard`, { params: { sortBy } }),
    addStudent: (classroomId: string, identifier: string, mentorId?: string) => {
        const payload = {
            identifier,
            leetcodeUsername: identifier,
            ...(mentorId ? { mentorId } : {})
        };
        return api.post(`/classrooms/${classroomId}/students`, payload, {
            params: payload,
            headers: { 'Content-Type': 'application/json' }
        });
    },
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

    updateAssignmentDeadline: (classroomId: string, assignmentId: string, mentorId: string, newEndTimestamp: number) => {
        const payload = {
            mentorId,
            newEndTimestamp,
            endTimestamp: newEndTimestamp
        };
        return api.put(`/classrooms/${classroomId}/assignments/${assignmentId}/deadline`, payload, {
            params: payload,
            headers: { 'Content-Type': 'application/json' }
        });
    },

    validateStudentSubmission: (classroomId: string, username: string, assignmentId: string, url: string) =>
        api.post(`/classrooms/${classroomId}/students/${username}/assignments/${assignmentId}/validate`, { url }),

    nudgeStudent: (classroomId: string, studentId: string, assignmentName: string) =>
        api.post(`/classrooms/${classroomId}/students/${studentId}/nudge`, { assignmentName }, {
            params: { assignmentName },
            headers: { 'Content-Type': 'application/json' }
        }),
    
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
    getOverview: () => api.get<SystemOverviewDTO>('/admin/overview'),
    getAllStudents: () => api.get<StudentSummaryDTO[]>('/admin/students'),
    deleteStudent: (id: string) => api.delete<{ message: string }>(`/admin/students/${id}`),
    syncStudent: (id: string) => api.post<{ message: string }>(`/admin/students/${id}/sync`),
    createMentor: (data: MentorRegisterRequest) => api.post<MentorDTO>('/admin/mentors', data),
    deleteMentor: (id: string) => api.delete<{ message: string }>(`/admin/mentors/${id}`),
    deleteClassroom: (id: string) => api.delete<{ message: string }>(`/admin/classrooms/${id}`),
    forceSyncAll: () => api.post<{ message: string }>('/admin/sync-all'),
    getCacheStats: () => api.get<CacheStatsResponse>('/admin/cache/stats'),
    clearCache: (cacheName?: string) => api.post<{ message?: string; error?: string }>('/admin/cache/clear', null, { params: cacheName ? { cacheName } : {} }),
    warmCache: () => api.post<Record<string, unknown>>('/admin/cache/warm')
};

export const DailyChallengeService = {
    getDailyChallenge: (classroomId?: string) =>
        api.get<DailyChallengeDTO>('/challenges/daily', { params: classroomId ? { classroomId } : {} })
};

export const ContestScheduleService = {
    getUpcomingContests: (platform?: 'ALL' | 'LEETCODE' | 'CODEFORCES') =>
        api.get<UpcomingContestDTO[]>('/contests/upcoming', { params: platform && platform !== 'ALL' ? { platform } : {} })
};



