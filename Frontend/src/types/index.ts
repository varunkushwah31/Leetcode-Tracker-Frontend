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
    authProvider?: 'LOCAL' | 'GOOGLE' | 'GITHUB';
}

export interface StudentExtendedDTO extends StudentSummaryDTO {
    skills?: SkillStat[];
    progressHistory?: ProgressRecord[];
    codeforcesMaxRank?: string;
    codeforcesAvatarUrl?: string;
    pvpWins?: number;
    pvpLosses?: number;
    pvpDraws?: number;
    pvpRating?: number;
    pvpStreak?: number;
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
    otp?: string;
}

export interface SendStudentOtpRequest {
    email: string;
    name?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    resetToken?: string;
    otp?: string;
    newPassword: string;
    confirmPassword?: string;
}

export interface VerifyOtpResponse {
    message: string;
    resetToken: string;
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
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    platform?: Platform;
    topic?: string;
    link?: string;
}

export interface TopicProficiencyDTO {
    tagName: string;
    problemsSolved?: number;
    cohortTotalSolved?: number;
    averageSolved?: number;
    averageSolvedPerStudent?: number;
    masteryLevel: 'STRONG' | 'DEVELOPING' | 'CRITICAL_WEAKNESS';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
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
    riskLevel?: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'HIGH' | 'MEDIUM';
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

export interface ContactRequest {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
}


// ==========================================
// Social Hub, Friends & PVP Duels Types
// ==========================================

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface FriendDTO {
    id: string;
    friendshipId: string;
    name: string;
    email: string;
    leetcodeUsername?: string;
    codeforcesHandle?: string;
    avatarUrl?: string;
    currentContestRating: number;
    codeforcesRating?: number;
    leetcodeSolvedCount: number;
    codeforcesSolvedCount: number;
    totalSolved: number;
    streak: number;
    pvpWins: number;
    pvpLosses: number;
    pvpRating?: number;
    pvpStreak?: number;
    status: 'ACCEPTED' | 'PENDING_INCOMING' | 'PENDING_OUTGOING';
    friendSince?: string;
    lastActive?: string;
    isOnline?: boolean;
    isBusy?: boolean;
}

export interface FriendRequestDTO {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterHandle?: string;
    requesterAvatarUrl?: string;
    receiverId: string;
    receiverName?: string;
    receiverHandle?: string;
    receiverAvatarUrl?: string;
    status: 'PENDING';
    createdAt: string;
}

export interface FriendsResponseDTO {
    friends: FriendDTO[];
    pendingIncoming: FriendRequestDTO[];
    pendingOutgoing: FriendRequestDTO[];
}

export interface SocialSearchStudentDTO {
    id: string;
    name: string;
    email: string;
    leetcodeUsername?: string;
    codeforcesHandle?: string;
    avatarUrl?: string;
    totalSolved: number;
    currentContestRating: number;
    codeforcesRating?: number;
    streak: number;
    friendshipStatus: 'NONE' | 'PENDING_INCOMING' | 'PENDING_OUTGOING' | 'ACCEPTED';
    friendshipId?: string;
}

export type PvpMatchStatus =
    | 'INVITED'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'DECLINED'
    | 'EXPIRED'
    | 'DRAW';

export interface PvpMatchDTO {
    id: string;
    challengerId: string;
    challengerName: string;
    challengerHandle?: string;
    challengerAvatarUrl?: string;
    opponentId: string;
    opponentName: string;
    opponentHandle?: string;
    opponentAvatarUrl?: string;
    problemTitle: string;
    problemSlug: string;
    problemPlatform: Platform;
    problemDifficulty: string;
    problemLink: string;
    problemTopic: string;
    durationMinutes: number;
    status: PvpMatchStatus;
    createdAt: string;
    startedAt?: string;
    expiresAt?: string;
    completedAt?: string;
    challengerSolved: boolean;
    challengerSolvedAt?: string;
    challengerSubmissionUrl?: string;
    opponentSolved: boolean;
    opponentSolvedAt?: string;
    opponentSubmissionUrl?: string;
    winnerId?: string;
    winnerName?: string;
    remainingSeconds?: number;
    challengerRating?: number;
    opponentRating?: number;
    challengerRatingDelta?: number;
    opponentRatingDelta?: number;
}

export interface CreatePvpMatchRequest {
    opponentId: string;
    problemTopic?: string;
    problemDifficulty?: string;
    durationMinutes?: number;
    customProblemTitle?: string;
    customProblemSlug?: string;
    customProblemLink?: string;
}

export interface FriendComparisonDTO {
    friendProfile: StudentExtendedDTO;
    mutualSolved: string[];
    friendOnlySolved: string[];
    userOnlySolved: string[];
    userSolvedCount: number;
    friendSolvedCount: number;
    userRating: number;
    friendRating: number;
    userStreak: number;
    friendStreak: number;
    userPvpWinsAgainstFriend: number;
    friendPvpWinsAgainstUser: number;
    pvpDraws: number;
}

export type FriendActivityType =
    | 'PROBLEM_SOLVED'
    | 'PVP_WIN'
    | 'PVP_DRAW'
    | 'STREAK_MILESTONE'
    | 'CONTEST_RANK'
    | 'BADGE_EARNED'
    | 'PEER_NOTE'
    | 'NEW_FRIEND';

export interface FriendActivityDTO {
    id: string;
    studentId: string;
    studentName: string;
    studentHandle?: string;
    studentAvatarUrl?: string;
    targetStudentId?: string;
    targetStudentName?: string;
    targetStudentHandle?: string;
    targetStudentAvatarUrl?: string;
    type: FriendActivityType;
    title: string;
    description: string;
    link?: string;
    platform?: Platform;
    difficulty?: string;
    kudosCount: number;
    userReacted: boolean;
    reactionCounts?: Record<string, number>;
    myReactions?: string[];
    createdAt: string;
}

export interface FriendsLeaderboardEntryDTO {
    rank: number;
    studentId: string;
    name: string;
    leetcodeUsername?: string;
    codeforcesHandle?: string;
    avatarUrl?: string;
    totalSolved: number;
    leetcodeSolved: number;
    codeforcesSolved: number;
    currentContestRating: number;
    codeforcesRating?: number;
    streak: number;
    pvpWins: number;
    pvpLosses: number;
    pvpWinRate: number;
    pvpRating?: number;
    pvpStreak?: number;
    isCurrentUser: boolean;
}

export type PeerStudyPostType =
    | 'HINT_REQUEST'
    | 'SOLUTION_INSIGHT'
    | 'RECOMMENDATION'
    | 'STUDY_NOTE';

export interface PeerStudyReplyDTO {
    id: string;
    authorId: string;
    authorName: string;
    authorHandle?: string;
    authorAvatarUrl?: string;
    content: string;
    createdAt: string;
}

export interface PeerStudyPostDTO {
    id: string;
    authorId: string;
    authorName: string;
    authorHandle?: string;
    authorAvatarUrl?: string;
    problemTitle?: string;
    problemSlug?: string;
    problemPlatform?: Platform;
    problemLink?: string;
    topic?: string;
    difficulty?: string;
    type: PeerStudyPostType;
    title: string;
    content: string;
    approach?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    replies: PeerStudyReplyDTO[];
    likeCount: number;
    userLiked: boolean;
    createdAt: string;
}

export interface CreatePeerStudyPostRequest {
    problemTitle?: string;
    problemSlug?: string;
    problemPlatform?: Platform;
    problemLink?: string;
    topic?: string;
    difficulty?: string;
    type?: PeerStudyPostType;
    title: string;
    content: string;
    approach?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
}

export interface CuratedProblemItemDTO {
    title: string;
    titleSlug: string;
    difficulty: string;
    platform: string;
    topic: string;
    link: string;
}
