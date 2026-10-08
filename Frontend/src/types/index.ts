export type Role = 'SUPER_ADMIN' | 'MENTOR' | 'STUDENT';

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    userId: string;
    /** @deprecated Use userId instead. Kept for backward compatibility with older backends. */
    mentorId?: string;
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

export type Platform = 'LEETCODE' | 'CODEFORCES';

export interface CodeforcesContestHistory {
    contestId: number;
    contestName: string;
    rank: number;
    oldRating: number;
    newRating: number;
    ratingUpdateTimeSeconds: number;
}

export interface RecentSubmission {
    title: string;
    titleSlug: string;
    timestamp: number;
    questionLink: string;
    platform?: Platform;
}

export interface AssignmentDTO {
    id: string;
    platform?: Platform;
    problemNumber?: string;
    title?: string;
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

export interface StudentSummaryDTO {
    id?: string;
    name: string;
    email?: string;
    leetcodeUsername: string;
    codeforcesHandle?: string;
    role: Role;
    about?: string;
    rank?: string;
    currentContestRating?: number;
    codeforcesRating?: number;
    codeforcesMaxRating?: number;
    codeforcesRank?: string;
    leetcodeSolvedCount?: number;
    codeforcesSolvedCount?: number;
    socialMedia?: SocialMedia;
    badges?: Badge[];
    contestHistory?: ContestHistory[];
    codeforcesContestHistory?: CodeforcesContestHistory[];
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
    codeforcesMaxRank?: string;
    codeforcesAvatarUrl?: string;
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
    leetcodeUsername?: string;
    codeforcesHandle?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface PathQuestion {
    platform?: 'LEETCODE' | 'CODEFORCES';
    title?: string;
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

export interface CuratedProblemDTO {
    title: string;
    slug?: string;
    titleSlug?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | string;
    platform?: 'LEETCODE' | 'CODEFORCES' | string;
    topic?: string;
    link?: string;
}

export interface TopicProficiencyDTO {
    tagName: string;
    problemsSolved?: number;
    cohortTotalSolved?: number;
    averageSolved?: number;
    averageSolvedPerStudent?: number;
    masteryLevel: 'STRONG' | 'DEVELOPING' | 'CRITICAL_WEAKNESS' | string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    recommendation?: string;
    suggestedProblems?: CuratedProblemDTO[];
}

export interface AtRiskStudentDTO {
    studentId: string;
    name: string;
    email: string;
    leetcodeUsername?: string;
    codeforcesHandle?: string;
    streak?: number;
    currentStreak?: number;
    totalSolved?: number;
    activeThisWeek?: boolean;
    lastSubmissionDate?: string;
    daysInactive?: number;
    riskLevel?: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'HIGH' | 'MEDIUM' | string;
    primaryRiskReason?: string;
    riskReason?: string;
}

export interface AssignmentAnalyticsDTO {
    assignmentId: string;
    title: string;
    titleSlug?: string;
    problemSlug?: string;
    platform: string;
    questionLink?: string;
    dueDate?: string;
    startTimestamp?: number;
    endTimestamp?: number;
    isExpired?: boolean;
    expired?: boolean;
    completedCount?: number;
    completedStudentsCount?: number;
    totalStudents?: number;
    totalStudentsCount?: number;
    completionRate?: number;
    completionPercentage?: number;
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
    // Upgraded comprehensive fields
    topicProficiencies?: TopicProficiencyDTO[];
    recommendedActionItems?: (string | CuratedProblemDTO)[];
    atRiskStudentsCount?: number;
    atRiskStudents?: AtRiskStudentDTO[];
    averageStreak?: number;
    streakChampion?: string;
    streakChampionStreak?: number;
    totalAssignments?: number;
    assignmentCompletionRate?: number;
    assignmentsBreakdown?: AssignmentAnalyticsDTO[];
    easyPercentage?: number;
    mediumPercentage?: number;
    hardPercentage?: number;
    interviewReadinessScore?: number;
    readinessAssessment?: string;
    dualPlatformStudents?: number;
    leetcodeOnlyStudents?: number;
    codeforcesOnlyStudents?: number;
    averageLeetcodeRating?: number;
    averageCodeforcesRating?: number;
}

export interface MentorDTO {
    id: string;
    name: string;
    email: string;
    role?: Role;
    classroomIds: string[];
}

export interface SystemOverviewDTO {
    totalStudents: number;
    totalMentors: number;
    totalClassrooms: number;
    totalAssignments?: number;
    dualPlatformStudents?: number;
    leetcodeOnlyStudents?: number;
    codeforcesOnlyStudents?: number;
    allMentors: MentorDTO[];
    allClassrooms: ClassroomDashboardDTO[];
}

export interface CacheStatsResponse {
    redisStatus: string;
    usedMemoryHuman?: string;
    usedMemoryPeakHuman?: string;
    redisVersion?: string;
    uptimeInSeconds?: string;
    configuredCaches?: string[];
    namespaceKeyCounts?: Record<string, number>;
}

export interface ClassroomDashboardDTO {
    classroomId: string;
    className: string;
    mentorName: string;
    enrolledStudents: StudentSummaryDTO[];
    assignments?: AssignmentDTO[];
}

export interface BulkImportResponseDTO {
    totalProcessed: number;
    addedCount: number;
    alreadyEnrolledCount: number;
    failedCount: number;
    addedStudents: string[];
    alreadyEnrolledStudents: string[];
    failures: string[];
}

export interface DailyChallengeDTO {
    date: string;
    leetcodeFrontendId?: string;
    leetcodeTitle?: string;
    leetcodeTitleSlug?: string;
    leetcodeDifficulty?: string;
    leetcodeUrl?: string;
    leetcodeTopicTags?: string[];
    codeforcesTitle?: string;
    codeforcesContestId?: number;
    codeforcesIndex?: string;
    codeforcesRating?: number;
    codeforcesUrl?: string;
    codeforcesTags?: string[];
    classroomName?: string;
    classroomTotalStudents: number;
    classroomSolvedCount: number;
    classroomSolvedPercentage: number;
    userSolvedLeetcode: boolean;
    userSolvedCodeforces: boolean;
    userSolved: boolean;
}

export interface UpcomingContestDTO {
    id: string;
    platform: 'LEETCODE' | 'CODEFORCES';
    title: string;
    startTimeSeconds: number;
    durationSeconds: number;
    url: string;
    phase: 'BEFORE' | 'CODING';
}