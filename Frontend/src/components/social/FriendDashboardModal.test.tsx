import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendDashboardModal } from './FriendDashboardModal';
import { SocialService } from '../../services/endpoints';
import type { FriendComparisonDTO } from '@/types';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getFriendDashboard: vi.fn(),
    }
}));

// Mock subcomponents that might use complex DOM or Canvas
vi.mock('@/components/dashboard/student/ActivityHeatmap', () => ({
    ActivityHeatmap: () => <div data-testid="activity-heatmap">Activity Heatmap Mock</div>
}));

vi.mock('@/components/dashboard/student/ContestRatingsSection', () => ({
    ContestRatingsSection: () => <div data-testid="contest-ratings-section">Contest Ratings Mock</div>
}));

vi.mock('@/components/dashboard/student/UnifiedContestHistory', () => ({
    UnifiedContestHistory: () => <div data-testid="unified-contest-history">Contest History Mock</div>
}));

const mockComparisonData: FriendComparisonDTO = {
    friendProfile: {
        id: 'friend-1',
        name: 'Pranav Dhar Dwivedi',
        email: 'pranav@test.com',
        avatarUrl: 'https://example.com/avatar.png',
        leetcodeUsername: 'pranavdhardwivedi',
        codeforcesHandle: 'pranavdhardwivedi',
        totalSolved: 1856,
        leetcodeSolvedCount: 1200,
        codeforcesSolvedCount: 656,
        currentContestRating: 1931,
        codeforcesRating: 1317,
        rank: '19071',
        consistencyStreak: 18,
        problemStats: [
            { difficulty: 'Easy', count: 332, beatsPercentage: 80 },
            { difficulty: 'Medium', count: 697, beatsPercentage: 75 },
            { difficulty: 'Hard', count: 170, beatsPercentage: 60 }
        ],
        skills: [
            { tagName: 'Dynamic Programming', problemsSolved: 85 },
            { tagName: 'Graph', problemsSolved: 42 }
        ],
        badges: [
            { title: '50 Days 2024', icon: '/badge.png' }
        ],
        recentSubmissions: [
            { title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', platform: 'LEETCODE', timestamp: 1700000000, questionLink: 'https://leetcode.com/problems/trapping-rain-water' }
        ]
    } as unknown as FriendComparisonDTO['friendProfile'],
    mutualSolved: ['two-sum', 'valid-parentheses'],
    friendOnlySolved: ['trapping-rain-water', 'merge-k-sorted-lists'],
    userOnlySolved: ['lru-cache'],
    userSolvedCount: 500,
    friendSolvedCount: 1856,
    userRating: 1600,
    friendRating: 1931,
    userStreak: 5,
    friendStreak: 18,
    userPvpWinsAgainstFriend: 2,
    friendPvpWinsAgainstUser: 1,
    pvpDraws: 0
};

describe('FriendDashboardModal Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders friend profile details matching mentor view when open', async () => {
        vi.mocked(SocialService.getFriendDashboard).mockResolvedValue({
            data: mockComparisonData
        } as any);

        const handleClose = vi.fn();
        const handleChallenge = vi.fn();

        render(
            <FriendDashboardModal
                friendId="friend-1"
                open={true}
                onClose={handleClose}
                onChallengePvp={handleChallenge}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Pranav Dhar Dwivedi')).toBeDefined();
        });

        // Banner elements
        expect(screen.getByText('Back to Friends Hub')).toBeDefined();
        expect(screen.getByText('Challenge to Duel')).toBeDefined();
        expect(screen.getByText('#19,071')).toBeDefined();
        expect(screen.getByText('1856')).toBeDefined();
        expect(screen.getByText('2W')).toBeDefined();
        expect(screen.getByText('1L')).toBeDefined();

        // Subcomponents
        expect(screen.getByTestId('activity-heatmap')).toBeDefined();
        expect(screen.getByTestId('contest-ratings-section')).toBeDefined();
        expect(screen.getByTestId('unified-contest-history')).toBeDefined();

        // Difficulty breakdown
        expect(screen.getByText('Difficulty Breakdown')).toBeDefined();
        expect(screen.getByText('Easy')).toBeDefined();
        expect(screen.getByText('Medium')).toBeDefined();
        expect(screen.getByText('Hard')).toBeDefined();
    });

    it('switches between Performance, Peer Learning, and Submission History tabs', async () => {
        vi.mocked(SocialService.getFriendDashboard).mockResolvedValue({
            data: mockComparisonData
        } as any);

        render(
            <FriendDashboardModal
                friendId="friend-1"
                open={true}
                onClose={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Pranav Dhar Dwivedi')).toBeDefined();
        });

        // Switch to Peer Learning
        const peerTab = screen.getByText('Peer Learning & Overlap');
        fireEvent.click(peerTab);

        await waitFor(() => {
            expect(screen.getByText(/Solved by Pranav/i)).toBeDefined();
            expect(screen.getByText('Mutual Mastered Problems')).toBeDefined();
            expect(screen.getByText(/Solved by You/i)).toBeDefined();
        });

        // Switch to Submissions
        const subTab = screen.getByText(/Submission History/i);
        fireEvent.click(subTab);

        await waitFor(() => {
            expect(screen.getByText('Verified Submissions Catalog')).toBeDefined();
            expect(screen.getByText('Trapping Rain Water')).toBeDefined();
        });
    });

    it('triggers challenge PVP callback when Challenge to Duel button is clicked', async () => {
        vi.mocked(SocialService.getFriendDashboard).mockResolvedValue({
            data: mockComparisonData
        } as any);

        const handleChallenge = vi.fn();
        const handleClose = vi.fn();

        render(
            <FriendDashboardModal
                friendId="friend-1"
                open={true}
                onClose={handleClose}
                onChallengePvp={handleChallenge}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Pranav Dhar Dwivedi')).toBeDefined();
        });

        const duelBtn = screen.getByRole('button', { name: /Challenge to Duel/i });
        fireEvent.click(duelBtn);

        expect(handleClose).toHaveBeenCalled();
        expect(handleChallenge).toHaveBeenCalledWith('friend-1', 'Pranav Dhar Dwivedi');
    });
});
