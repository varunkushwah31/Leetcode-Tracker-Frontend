import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { UpcomingContestsCard } from './UpcomingContestsCard';
import { ContestScheduleService } from '@/services/endpoints';
import type { UpcomingContestDTO } from '@/types';

vi.mock('@/services/endpoints', () => ({
    ContestScheduleService: {
        getUpcomingContests: vi.fn(),
    },
}));

describe('UpcomingContestsCard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockContests: UpcomingContestDTO[] = [
        {
            id: 'LC-WEEKLY-420',
            platform: 'LEETCODE',
            title: 'LeetCode Weekly Contest 420',
            startTimeSeconds: Math.floor(Date.now() / 1000) + 86400,
            durationSeconds: 5400,
            url: 'https://leetcode.com/contest/weekly-contest-420',
            phase: 'BEFORE',
        },
        {
            id: 'CF-1990',
            platform: 'CODEFORCES',
            title: 'Codeforces Round 990 (Div. 2)',
            startTimeSeconds: Math.floor(Date.now() / 1000) + 3600,
            durationSeconds: 7200,
            url: 'https://codeforces.com/contestRegistration/1990',
            phase: 'BEFORE',
        },
    ];

    it('renders upcoming contests and switches platform filters cleanly', async () => {
        vi.mocked(ContestScheduleService.getUpcomingContests).mockResolvedValue({
            data: mockContests,
        } as never);

        render(<UpcomingContestsCard />);

        await waitFor(() => {
            expect(screen.getByText('LeetCode Weekly Contest 420')).toBeTruthy();
        });

        expect(screen.getByText('Codeforces Round 990 (Div. 2)')).toBeTruthy();
        expect(screen.getByText('Upcoming Contests')).toBeTruthy();

        // Switch to LeetCode only
        const lcButton = screen.getByRole('button', { name: /^LC$/i });
        fireEvent.click(lcButton);

        await waitFor(() => {
            expect(ContestScheduleService.getUpcomingContests).toHaveBeenCalledWith('LEETCODE');
        });
    });

    it('handles empty contests list gracefully', async () => {
        vi.mocked(ContestScheduleService.getUpcomingContests).mockResolvedValueOnce({
            data: [],
        } as never);

        render(<UpcomingContestsCard />);

        await waitFor(() => {
            expect(screen.getByText('No upcoming contests found.')).toBeTruthy();
        });
    });
});
