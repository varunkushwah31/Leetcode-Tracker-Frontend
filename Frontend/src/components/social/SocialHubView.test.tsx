import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SocialHubView } from './SocialHubView';
import { SocialService } from '../../services/endpoints';
import type { AxiosResponse } from 'axios';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getFriends: vi.fn(),
        getPvpMatches: vi.fn(),
        getActivities: vi.fn(),
        getFriendsLeaderboard: vi.fn(),
        getPeerStudyPosts: vi.fn(),
        getCuratedProblems: vi.fn(),
        searchStudents: vi.fn(),
        pingPresence: vi.fn().mockResolvedValue({ data: { status: 'ACTIVE' } })
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
        } as unknown as AxiosResponse);

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse);

        vi.mocked(SocialService.getActivities).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse);

        vi.mocked(SocialService.getFriendsLeaderboard).mockResolvedValue({
            data: [
                {
                    studentId: 'f1',
                    name: 'Bob Coder',
                    leetcodeUsername: 'bob_lc',
                    rank: 1,
                    totalSolved: 150,
                    isCurrentUser: false,
                    streak: 5,
                    pvpWins: 3,
                    pvpLosses: 1,
                    pvpWinRate: 75
                },
                {
                    studentId: 'u1',
                    name: 'Tester',
                    leetcodeUsername: 'tester_lc',
                    rank: 2,
                    totalSolved: 100,
                    isCurrentUser: true,
                    streak: 3,
                    pvpWins: 1,
                    pvpLosses: 1,
                    pvpWinRate: 50
                }
            ]
        } as unknown as AxiosResponse);

        vi.mocked(SocialService.getPeerStudyPosts).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse);

        vi.mocked(SocialService.getCuratedProblems).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse);
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
            expect(screen.getByText('Friends Network Leaderboard')).toBeDefined();
        });
    });

    it('switches to Peer Learning Hub tab on click', async () => {
        render(<SocialHubView />);

        const peerTabBtn = screen.getByText('Peer Learning Hub');
        fireEvent.click(peerTabBtn);

        await waitFor(() => {
            expect(screen.getByText(/Peer-to-Peer.*Study Hub/i)).toBeDefined();
        });
    });

    it('warns the user when they click to view their own profile from leaderboard', async () => {
        render(<SocialHubView initialTab="leaderboard" />);

        await waitFor(() => {
            expect(screen.getByText('Friends Network Leaderboard')).toBeDefined();
        });

        // Click "Your Standing"
        const yourStandingBtn = screen.getByRole('button', { name: /Your Standing/i });
        fireEvent.click(yourStandingBtn);

        await waitFor(() => {
            expect(screen.getAllByText(/You cannot view your own profile in Social Hub/i).length).toBeGreaterThan(0);
        });
    });
});
