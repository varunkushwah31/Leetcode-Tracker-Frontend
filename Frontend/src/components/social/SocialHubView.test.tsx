import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocialHubView } from './SocialHubView';
import { SocialService } from '../../services/endpoints';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getFriends: vi.fn(),
        getPvpMatches: vi.fn(),
        getActivities: vi.fn(),
        getFriendsLeaderboard: vi.fn(),
        getPeerStudyPosts: vi.fn(),
        getCuratedProblems: vi.fn(),
        searchStudents: vi.fn()
    }
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'u1', name: 'Tester', email: 'tester@test.com', role: 'STUDENT' },
        isAuthenticated: true
    })
}));

describe('SocialHubView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: {
                friends: [
                    {
                        id: 'f1',
                        friendshipId: 'fs1',
                        name: 'Bob Coder',
                        email: 'bob@test.com',
                        leetcodeUsername: 'bob_lc',
                        currentContestRating: 1850,
                        totalSolved: 150,
                        leetcodeSolvedCount: 100,
                        codeforcesSolvedCount: 50,
                        streak: 7,
                        pvpWins: 3,
                        pvpLosses: 1,
                        status: 'ACCEPTED'
                    }
                ],
                pendingIncoming: [],
                pendingOutgoing: []
            }
        } as any);

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: []
        } as any);

        vi.mocked(SocialService.getActivities).mockResolvedValue({
            data: []
        } as any);

        vi.mocked(SocialService.getFriendsLeaderboard).mockResolvedValue({
            data: []
        } as any);

        vi.mocked(SocialService.getPeerStudyPosts).mockResolvedValue({
            data: []
        } as any);

        vi.mocked(SocialService.getCuratedProblems).mockResolvedValue({
            data: []
        } as any);
    });

    it('renders all 5 main navigation tabs', async () => {
        render(<SocialHubView />);

        expect(screen.getByText('Friends Network')).toBeDefined();
        expect(screen.getByText('PVP Duels')).toBeDefined();
        expect(screen.getByText('Activity Feed')).toBeDefined();
        expect(screen.getByText('Friends Leaderboard')).toBeDefined();
        expect(screen.getByText('Peer Learning Hub')).toBeDefined();

        await waitFor(() => {
            expect(screen.getByText('Bob Coder')).toBeDefined();
        });
    });

    it('switches to PVP Duels tab on click', async () => {
        render(<SocialHubView />);

        const pvpTabBtn = screen.getByText('PVP Duels');
        fireEvent.click(pvpTabBtn);

        await waitFor(() => {
            expect(screen.getByText('PVP Problem-Solving Arena')).toBeDefined();
        });
    });

    it('switches to Friends Leaderboard tab on click', async () => {
        render(<SocialHubView />);

        const leaderboardTabBtn = screen.getByText('Friends Leaderboard');
        fireEvent.click(leaderboardTabBtn);

        await waitFor(() => {
            expect(screen.getByText('Rankings among you and your accepted coding friends')).toBeDefined();
        });
    });

    it('switches to Peer Learning Hub tab on click', async () => {
        render(<SocialHubView />);

        const peerTabBtn = screen.getByText('Peer Learning Hub');
        fireEvent.click(peerTabBtn);

        await waitFor(() => {
            expect(screen.getByText('Peer-to-Peer Problem Study Hub')).toBeDefined();
        });
    });
});
