import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassroomAnalytics } from './ClassroomAnalytics';
import type { ClassroomAnalyticsDTO } from '@/types';

vi.mock('@/services/endpoints', () => ({
    ClassroomService: {
        assignQuestion: vi.fn().mockResolvedValue({ data: {} }),
    },
}));

const mockAnalyticsData: ClassroomAnalyticsDTO = {
    classroomId: 'class-123',
    className: 'Advanced Competitive Programming',
    totalStudents: 25,
    averageTotalSolved: 142.5,
    averageEasy: 60.0,
    averageMedium: 65.5,
    averageHard: 17.0,
    activeStudentsThisWeek: 21,
    classEngagementScore: 84.0,
    topStrengths: [
        { tagName: 'Array', problemsSolved: 280 },
        { tagName: 'Hash Table', problemsSolved: 190 },
    ],
    criticalWeaknesses: [
        { tagName: 'Dynamic Programming', problemsSolved: 12 },
        { tagName: 'Graph', problemsSolved: 18 },
    ],
    topicProficiencies: [
        {
            tagName: 'Dynamic Programming',
            cohortTotalSolved: 12,
            averageSolvedPerStudent: 0.48,
            masteryLevel: 'CRITICAL_WEAKNESS',
            severity: 'HIGH',
            recommendation: 'Target memoization and transition relations with classic 1D/2D DP problems.',
            suggestedProblems: [
                {
                    title: 'Climbing Stairs',
                    slug: 'climbing-stairs',
                    difficulty: 'EASY',
                    platform: 'LEETCODE',
                    topic: 'Dynamic Programming',
                    link: 'https://leetcode.com/problems/climbing-stairs/',
                },
                {
                    title: 'Coin Change',
                    slug: 'coin-change',
                    difficulty: 'MEDIUM',
                    platform: 'LEETCODE',
                    topic: 'Dynamic Programming',
                    link: 'https://leetcode.com/problems/coin-change/',
                },
            ],
        },
        {
            tagName: 'Array',
            cohortTotalSolved: 280,
            averageSolvedPerStudent: 11.2,
            masteryLevel: 'STRONG',
            severity: 'LOW',
            recommendation: 'Cohort displays high mastery in array manipulations.',
            suggestedProblems: [],
        },
    ],
    recommendedActionItems: [
        'Organize a workshop targeting Dynamic Programming transitions.',
        'Reach out to 2 inactive students to maintain momentum.',
    ],
    atRiskStudentsCount: 2,
    atRiskStudents: [
        {
            studentId: 'stud-1',
            name: 'John Doe',
            email: 'john@example.com',
            leetcodeUsername: 'johndoe_lc',
            currentStreak: 0,
            totalSolved: 15,
            daysInactive: 10,
            riskLevel: 'CRITICAL',
            primaryRiskReason: 'Inactive for 10 days; 0 recent submissions',
        },
    ],
    averageStreak: 4.2,
    streakChampion: 'Alice Smith',
    streakChampionStreak: 28,
    totalAssignments: 5,
    assignmentCompletionRate: 78.5,
    assignmentsBreakdown: [
        {
            assignmentId: 'asg-1',
            title: 'Longest Palindromic Substring',
            platform: 'LEETCODE',
            problemSlug: 'longest-palindromic-substring',
            dueDate: '2026-10-15T23:59:00Z',
            isExpired: false,
            completedCount: 20,
            totalStudents: 25,
            completionRate: 80.0,
        },
    ],
    easyPercentage: 42.1,
    mediumPercentage: 46.0,
    hardPercentage: 11.9,
    interviewReadinessScore: 76.0,
    readinessAssessment: 'Interview Ready',
    dualPlatformStudents: 15,
    leetcodeOnlyStudents: 10,
    codeforcesOnlyStudents: 0,
    averageLeetcodeRating: 1650.0,
    averageCodeforcesRating: 1320.0,
};

describe('ClassroomAnalytics Component', () => {
    it('renders empty state when no data or students are provided', () => {
        render(<ClassroomAnalytics data={null} />);
        expect(screen.getByText(/No data available to generate analytics/i)).toBeDefined();
    });

    it('renders overview KPIs and sub-tabs correctly', () => {
        render(<ClassroomAnalytics data={mockAnalyticsData} />);

        // Top KPIs
        expect(screen.getByText('Cohort Engagement')).toBeDefined();
        expect(screen.getByText('84%')).toBeDefined();
        expect(screen.getByText('Interview Readiness')).toBeDefined();
        expect(screen.getByText('Interview Ready')).toBeDefined();
        expect(screen.getByText('Critical Weaknesses')).toBeDefined();
        expect(screen.getByText('At-Risk Students')).toBeDefined();

        // Sub-tabs
        expect(screen.getByText('Overview & Benchmarks')).toBeDefined();
        expect(screen.getByText(/Critical Weaknesses & Interventions/i)).toBeDefined();
        expect(screen.getByText('Topic Competency Matrix')).toBeDefined();
        expect(screen.getByText(/At-Risk Watchlist/i)).toBeDefined();
        expect(screen.getByText(/Assignment Health/i)).toBeDefined();
    });

    it('switches to Critical Weaknesses tab and displays curated practice problems', () => {
        render(<ClassroomAnalytics data={mockAnalyticsData} />);

        const weaknessTabBtn = screen.getByText(/Critical Weaknesses & Interventions/i);
        fireEvent.click(weaknessTabBtn);

        expect(screen.getByText('Dynamic Programming')).toBeDefined();
        expect(screen.getByText(/CRITICAL BLIND SPOT/i)).toBeDefined();
        expect(screen.getByText('Climbing Stairs')).toBeDefined();
        expect(screen.getByText('Coin Change')).toBeDefined();
    });

    it('switches to Topic Competency Matrix and allows filtering', () => {
        render(<ClassroomAnalytics data={mockAnalyticsData} />);

        const matrixTabBtn = screen.getByText('Topic Competency Matrix');
        fireEvent.click(matrixTabBtn);

        expect(screen.getByPlaceholderText(/Search topic/i)).toBeDefined();
        expect(screen.getByText('Array')).toBeDefined();
    });

    it('switches to At-Risk Watchlist tab and shows flagged student details', () => {
        const onStudentClick = vi.fn();
        render(<ClassroomAnalytics data={mockAnalyticsData} onStudentClick={onStudentClick} />);

        const watchlistTabBtn = screen.getByText(/At-Risk Watchlist/i);
        fireEvent.click(watchlistTabBtn);

        expect(screen.getByText('John Doe')).toBeDefined();
        expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Inactive for 10 days/i)).toBeDefined();

        const profileBtn = screen.getByText('Open Student Profile');
        fireEvent.click(profileBtn);
        expect(onStudentClick).toHaveBeenCalledWith('John Doe');
    });

    it('switches to Assignment Health tab and shows assignment metrics', () => {
        render(<ClassroomAnalytics data={mockAnalyticsData} />);

        const assignmentTabBtn = screen.getByText(/Assignment Health/i);
        fireEvent.click(assignmentTabBtn);

        expect(screen.getByText('Longest Palindromic Substring')).toBeDefined();
        expect(screen.getByText('80%')).toBeDefined();
        expect(screen.getByText('ACTIVE')).toBeDefined();
    });

    it('renders loading state when isLoading is true', () => {
        render(<ClassroomAnalytics data={null} isLoading={true} />);
        expect(screen.getByText(/Computing Cohort Analytics & Weaknesses/i)).toBeDefined();
    });

    it('renders CuratedProblemDTO objects in recommendedActionItems without React child errors', () => {
        const backendPayloadData: ClassroomAnalyticsDTO = {
            ...mockAnalyticsData,
            recommendedActionItems: [
                {
                    title: '3Sum',
                    titleSlug: '3sum',
                    difficulty: 'MEDIUM',
                    platform: 'LEETCODE',
                    topic: 'Two Pointers',
                    link: 'https://leetcode.com/problems/3sum/',
                },
            ],
            topicProficiencies: [
                {
                    tagName: 'Two Pointers',
                    problemsSolved: 8,
                    averageSolved: 0.32,
                    masteryLevel: 'CRITICAL_WEAKNESS',
                    severity: 'HIGH',
                    recommendation: 'Reinforce two-pointer technique.',
                    suggestedProblems: [
                        {
                            title: '3Sum',
                            titleSlug: '3sum',
                            difficulty: 'MEDIUM',
                            platform: 'LEETCODE',
                            topic: 'Two Pointers',
                            link: 'https://leetcode.com/problems/3sum/',
                        },
                    ],
                },
            ],
            atRiskStudents: [
                {
                    studentId: 'stud-2',
                    name: 'Bob Marley',
                    email: 'bob@example.com',
                    streak: 0,
                    totalSolved: 5,
                    activeThisWeek: false,
                    riskLevel: 'HIGH',
                    riskReason: 'Solve count is below 50% of class average',
                },
            ],
            assignmentsBreakdown: [
                {
                    assignmentId: 'asg-2',
                    title: 'Trapping Rain Water',
                    titleSlug: 'trapping-rain-water',
                    platform: 'LEETCODE',
                    completedStudentsCount: 15,
                    totalStudentsCount: 25,
                    completionPercentage: 60.0,
                    startTimestamp: 1700000000,
                    endTimestamp: 1700500000,
                    expired: false,
                },
            ],
        };

        render(<ClassroomAnalytics data={backendPayloadData} />);

        // Action Item rendered with CuratedProblemDTO
        expect(screen.getByText(/Assign target practice: 3Sum/i)).toBeDefined();
        expect(screen.getByText('Assign Now')).toBeDefined();

        // Switch to matrix tab
        const matrixTabBtn = screen.getByText('Topic Competency Matrix');
        fireEvent.click(matrixTabBtn);
        expect(screen.getByText('Two Pointers')).toBeDefined();

        // Switch to watchlist tab
        const watchlistTabBtn = screen.getByText(/At-Risk Watchlist/i);
        fireEvent.click(watchlistTabBtn);
        expect(screen.getByText('Bob Marley')).toBeDefined();
        expect(screen.getByText(/Solve count is below 50% of class average/i)).toBeDefined();

        // Switch to assignment tab
        const assignmentTabBtn = screen.getByText(/Assignment Health/i);
        fireEvent.click(assignmentTabBtn);
        expect(screen.getByText('Trapping Rain Water')).toBeDefined();
        expect(screen.getByText('60%')).toBeDefined();
    });
});
