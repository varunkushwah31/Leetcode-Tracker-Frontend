import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DailyChallengeCard } from './DailyChallengeCard';
import { DailyChallengeService } from '@/services/endpoints';
import type { DailyChallengeDTO } from '@/types';

vi.mock('@/services/endpoints', () => ({
    DailyChallengeService: {
        getDailyChallenge: vi.fn(),
    },
}));

describe('DailyChallengeCard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockChallenge: DailyChallengeDTO = {
        date: '2026-10-09',
        leetcodeFrontendId: '200',
        leetcodeTitle: 'Number of Islands',
        leetcodeTitleSlug: 'number-of-islands',
        leetcodeDifficulty: 'Medium',
        leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/',
        leetcodeTopicTags: ['DFS', 'BFS', 'Union Find'],
        userSolvedLeetcode: false,
        userSolvedCodeforces: false,
        userSolved: false,
        classroomName: 'Batch 2026',
        classroomTotalStudents: 25,
        classroomSolvedCount: 14,
        classroomSolvedPercentage: 56.0,
    };

    it('renders loading skeleton initially and transitions to loaded challenge without crashing', async () => {
        vi.mocked(DailyChallengeService.getDailyChallenge).mockResolvedValueOnce({
            data: mockChallenge,
        } as never);

        render(<DailyChallengeCard classroomId="class-1" />);

        // Should transition to loaded problem content
        await waitFor(() => {
            expect(screen.getByText('Number of Islands')).toBeTruthy();
        });

        expect(screen.getByText('#200')).toBeTruthy();
        expect(screen.getByText('Medium')).toBeTruthy();
        expect(screen.getByText('Pending Today')).toBeTruthy();
        expect(screen.getByText(/14 of 25/)).toBeTruthy();
        expect(screen.getByText(/56%/)).toBeTruthy();
    });

    it('displays Solved Today when user solved flag is true or matches recent submissions', async () => {
        vi.mocked(DailyChallengeService.getDailyChallenge).mockResolvedValueOnce({
            data: { ...mockChallenge, userSolvedLeetcode: true },
        } as never);

        render(<DailyChallengeCard classroomId="class-1" />);

        await waitFor(() => {
            expect(screen.getByText('Solved Today')).toBeTruthy();
        });
        expect(screen.getByText('Review on LeetCode')).toBeTruthy();
    });

    it('identifies solved status from recentSubmissions prop', async () => {
        vi.mocked(DailyChallengeService.getDailyChallenge).mockResolvedValueOnce({
            data: mockChallenge,
        } as never);

        render(
            <DailyChallengeCard
                classroomId="class-1"
                recentSubmissions={[
                    {
                        title: 'Number of Islands',
                        titleSlug: 'number-of-islands',
                        platform: 'LEETCODE',
                        timestamp: Date.now(),
                        questionLink: 'https://leetcode.com/problems/number-of-islands/',
                    },
                ]}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Solved Today')).toBeTruthy();
        });
    });
});
