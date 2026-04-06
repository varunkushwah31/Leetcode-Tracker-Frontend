export type Role = 'SUPER_ADMIN' | 'MENTOR' | 'STUDENT';

export interface AuthResponse {
    accessToken: string;
    mentorId: string;
    name: string;
}

export interface ApiErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path?: string;
}

// --- LeetCode Specific Models ---

export interface SocialMedia {
    github?: string;
    linkedin?: string;
    twitter?: string;
}

export interface ProgressRecord {
    date: { $date: string } | string;
    questionSolved: number;
}

export interface Badge {
    title: string;
    icon: string;
    timestamp: string;
}

export interface ContestHistory {
    title: string;
    timestamp: number; // Now a clean number!
    rating: number;
    ranking: number;
    problemsSolved: number;
    totalProblems: number;
}
export interface ProblemStats {
    difficulty: string;
    count: number;
    beatsPercentage: number;
}

export interface RecentSubmission {
    title: string;
    titleSlug: string;
    timestamp: number; // Now a clean number!
    questionLink: string;
}

export interface AssignmentDTO {
    id: string;
    titleSlug: string;
    questionLink: string;
    startTimestamp: number;
    endTimestamp: number;
}


export interface ClassroomSummaryDTO {
    id: string;
    className: string;
    mentorId: string;
    studentIds: string[];
    assignments: AssignmentDTO[];
}
export interface ClassroomDashboardDTO {
    classroomId: string;
    className: string;
    mentorId: string;
    students: StudentSummaryDTO[];
}
// --- The Master Student Object ---
export interface StudentSummaryDTO {
    id?: string; 
    name: string;
    email?: string;
    leetcodeUsername: string;
    role: Role;
    
    about?: string;
    rank?: string;
    currentContestRating?: number;
    socialMedia?: SocialMedia;
    
    badges?: Badge[];
    contestHistory?: ContestHistory[];
    problemStats?: ProblemStats[];
    recentSubmissions?: RecentSubmission[];
    classrooms?: ClassroomSummaryDTO[];
    
    totalSolved?: number; 
    contestRating?: number; 

    consistencyStreak?: number;
    completedAssignments?: number;
    pendingAssignments?: number;
}
// --- Request Payloads ---
export interface LoginRequest {
    email: string;
    password: string;
}

export interface MentorRegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface StudentRegisterRequest extends MentorRegisterRequest {
    leetcodeUsername: string;
}