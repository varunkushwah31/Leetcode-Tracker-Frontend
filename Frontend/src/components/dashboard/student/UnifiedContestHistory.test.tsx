import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnifiedContestHistory } from './UnifiedContestHistory';
import type { ContestHistory, CodeforcesContestHistory } from '@/types';

describe('UnifiedContestHistory', () => {
    const mockLeetcodeContests: ContestHistory[] = [
        {
            title: 'Weekly Contest 400',
            timestamp: 1717293600, // Older
            rating: 1850.4,
            ranking: 1200,
            problemsSolved: 3,
            totalProblems: 4,
        },
        {
            title: 'Weekly Contest 401',
            timestamp: 1717898400, // Newer LC
            rating: 1910.8,
            ranking: 850,
            problemsSolved: 4,
            totalProblems: 4,
        },
    ];

    const mockCodeforcesContests: CodeforcesContestHistory[] = [
        {
            contestId: 1980,
            contestName: 'Codeforces Round 952 (Div. 4)',
            rank: 450,
            oldRating: 1400,
            newRating: 1475,
            ratingUpdateTimeSeconds: 1718121600, // Newest overall
        },
    ];

    it('returns null when there are no contests', () => {
        const { container } = render(
            <UnifiedContestHistory contestHistory={[]} codeforcesContestHistory={[]} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('merges both platforms and sorts by timestamp descending (newest first)', () => {
        render(
            <UnifiedContestHistory
                contestHistory={mockLeetcodeContests}
                codeforcesContestHistory={mockCodeforcesContests}
            />
        );

        expect(screen.getByText('Contest History')).toBeTruthy();
        expect(screen.getByText('3 contests')).toBeTruthy();

        // Check platform badges
        expect(screen.getByText('CF')).toBeTruthy();
        expect(screen.getAllByText('LC')).toHaveLength(2);

        // Check Codeforces rating and delta
        expect(screen.getByText('1475')).toBeTruthy();
        expect(screen.getByText('+75')).toBeTruthy();

        // Check LeetCode rating and solved count and rating deltas
        expect(screen.getByText('1911')).toBeTruthy();
        expect(screen.getByText('+61')).toBeTruthy(); // Delta between 1911 and 1850
        expect(screen.getByText('4/4 solved')).toBeTruthy();
        expect(screen.getByText('1850')).toBeTruthy();
        expect(screen.getByText('+350')).toBeTruthy(); // Delta between 1850 and base 1500
        expect(screen.getByText('3/4 solved')).toBeTruthy();
    });

    it('filters contests when clicking platform filter buttons', () => {
        render(
            <UnifiedContestHistory
                contestHistory={mockLeetcodeContests}
                codeforcesContestHistory={mockCodeforcesContests}
            />
        );

        // Filter buttons exist when both platforms have contests
        const lcButton = screen.getByRole('button', { name: /LC/i });
        const cfButton = screen.getByRole('button', { name: /CF/i });
        const allButton = screen.getByRole('button', { name: /All/i });

        // Filter by LC
        fireEvent.click(lcButton);
        expect(screen.queryByText('Codeforces Round 952 (Div. 4)')).toBeNull();
        expect(screen.getByText('Weekly Contest 401')).toBeTruthy();
        expect(screen.getByText('Weekly Contest 400')).toBeTruthy();

        // Filter by CF
        fireEvent.click(cfButton);
        expect(screen.getByText('Codeforces Round 952 (Div. 4)')).toBeTruthy();
        expect(screen.queryByText('Weekly Contest 401')).toBeNull();

        // Back to All
        fireEvent.click(allButton);
        expect(screen.getByText('Codeforces Round 952 (Div. 4)')).toBeTruthy();
        expect(screen.getByText('Weekly Contest 401')).toBeTruthy();
    });

    it('renders Codeforces ratings and deltas correctly when only Codeforces contests are present', () => {
        const multipleCfContests: CodeforcesContestHistory[] = [
            {
                contestId: 1120,
                contestName: 'Codeforces Round 1120 (Div. 1)',
                rank: 70,
                oldRating: 3250,
                newRating: 3307,
                ratingUpdateTimeSeconds: 1726100000,
            },
            {
                contestId: 1124,
                contestName: 'Codeforces Round 1124 (Div. 1)',
                rank: 2,
                oldRating: 3307,
                newRating: 3384,
                ratingUpdateTimeSeconds: 1727300000,
            },
        ];

        render(
            <UnifiedContestHistory contestHistory={[]} codeforcesContestHistory={multipleCfContests} />
        );

        expect(screen.getByText('Contest History')).toBeTruthy();
        expect(screen.getByText('2 contests')).toBeTruthy();

        // Check contest titles
        expect(screen.getByText('Codeforces Round 1124 (Div. 1)')).toBeTruthy();
        expect(screen.getByText('Codeforces Round 1120 (Div. 1)')).toBeTruthy();

        // Check ratings and deltas
        expect(screen.getByText('3384')).toBeTruthy();
        expect(screen.getByText('+77')).toBeTruthy();
        expect(screen.getByText('3307')).toBeTruthy();
        expect(screen.getByText('+57')).toBeTruthy();
    });
});

