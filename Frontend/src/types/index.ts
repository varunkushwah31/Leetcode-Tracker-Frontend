export type Role = 'SUPER_ADMIN' | 'MENTOR' | 'STUDENT';

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    mentorId: string;
    name: string;
    role: Role;
}

export interface SocialMedia {
    github?: string;
    linkedin?: string;
    twitter?: string;
}

export interface ProgressRecord {
    date: { $date: string } | string | number[];
    questionSolved: number;
}

export interface Badge {
    title: string;
    icon: string;
    timestamp: string;
}

export interface ContestHistory {
    title: string;
    timestamp: number;
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
    timestamp: number;
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
    mentorName: string;
    enrolledStudents: StudentSummaryDTO[];
}

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
    avatarUrl?: string;
    manuallyCompletedAssignments?: string[];
}

export interface StudentExtendedDTO extends StudentSummaryDTO {
    skills?: SkillStat[];
    progressHistory?: ProgressRecord[];
}

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

export interface PathQuestion {
    titleSlug: string;
    daysToComplete: number;
}

export interface LearningPath {
    id?: string;
    mentorId: string;
    title: string;
    description: string;
    questions: PathQuestion[];
}

export interface SkillStat {
    tagName: string;
    problemsSolved: number;
}

export interface ClassroomAnalyticsDTO {
    classroomId: string;
    className: string;
    totalStudents: number;
    averageTotalSolved: number;
    averageEasy: number;
    averageMedium: number;
    averageHard: number;
    activeStudentsThisWeek: number;
    classEngagementScore: number;
    topStrengths: SkillStat[];
    criticalWeaknesses: SkillStat[];
}

export interface MentorDTO {
    id: string;
    name: string;
    email: string;
    classroomIds: string[];
}

export interface SystemOverviewDTO {
    totalStudents: number;
    totalMentors: number;
    totalClassrooms: number;
    allMentors: MentorDTO[];
    allClassrooms: ClassroomDashboardDTO[];
}

export interface ClassroomDashboardDTO {
    classroomId: string;
    className: string;
    mentorName: string;
    enrolledStudents: StudentSummaryDTO[];
    assignments?: AssignmentDTO[];
}