import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProfileStats } from './ProfileStats';
import type { StudentExtendedDTO } from '@/types';

describe('ProfileStats Component', () => {
    const mockStudentData: StudentExtendedDTO = {
        name: 'Alex Coder',
        email: 'alex@example.com',
        leetcodeUsername: 'alex_lc',
        codeforcesHandle: 'alex_cf',
        rank: '4275',
        role: 'STUDENT',
        currentContestRating: 1914,
        codeforcesRating: 1401,
        codeforcesRank: 'Specialist',
        consistencyStreak: 12,
        totalSolved: 181,
        leetcodeSolvedCount: 98,
        codeforcesSolvedCount: 83,
        contestHistory: [
            {
                title: 'Weekly Contest 520',
                timestamp: 1726800000,
                rating: 1925,
                ranking: 767,
                problemsSolved: 3,
                totalProblems: 4,
            },
            {
                title: 'Weekly Contest 522',
                timestamp: 1728000000,
                rating: 1914,
                ranking: 4275,
                problemsSolved: 2,
                totalProblems: 4,
            },
        ],
        codeforcesContestHistory: [
            {
                contestId: 1120,
                contestName: 'Codeforces Round 1120 (Div. 2)',
                rank: 2500,
                oldRating: 1352,
                newRating: 1352,
                ratingUpdateTimeSeconds: 1726100000,
            },
            {
                contestId: 1123,
                contestName: 'Codeforces Round 1123 (Div. 2)',
                rank: 2278,
                oldRating: 1352,
                newRating: 1401,
                ratingUpdateTimeSeconds: 1727200000,
            },
        ],
    };

    it('renders profile metrics and both LeetCode and Codeforces deltas', () => {
        render(
            <ProfileStats
                data={mockStudentData}
                totalSolved={181}
                rating={1914}
            />
        );

        // Name and Handles
        expect(screen.getByText('Alex Coder')).toBeTruthy();
        expect(screen.getByText('@alex_lc')).toBeTruthy();
        expect(screen.getByText('@alex_cf')).toBeTruthy();

        // Ratings
        expect(screen.getByText('1914')).toBeTruthy();
        expect(screen.getByText('1401')).toBeTruthy();

        // LeetCode delta: 1914 - 1925 = -11
        expect(screen.getByText('-11')).toBeTruthy();

        // Codeforces delta: 1401 - 1352 = +49
        expect(screen.getByText('+49')).toBeTruthy();
    });

    it('handles student with null or empty contest histories gracefully', () => {
        const minimalData: StudentExtendedDTO = {
            name: 'Newbie',
            leetcodeUsername: 'newbie_lc',
            role: 'STUDENT',
            currentContestRating: 0,
            codeforcesRating: 0,
            totalSolved: 0,
        };

        render(
            <ProfileStats
                data={minimalData}
                totalSolved={0}
                rating={0}
            />
        );

        expect(screen.getByText('Newbie')).toBeTruthy();
        expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1); // Rating fallback
    });
});
