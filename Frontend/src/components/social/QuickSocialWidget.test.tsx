import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickSocialWidget } from './QuickSocialWidget';
import { SocialService } from '../../services/endpoints';
import type { FriendDTO, FriendsResponseDTO, PvpMatchDTO } from '@/types';
import type { AxiosResponse } from 'axios';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getFriends: vi.fn(),
        getPvpMatches: vi.fn(),
        pingPresence: vi.fn().mockResolvedValue({ data: { status: 'ACTIVE' } })
    }
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'u_self', name: 'Self Student', email: 'self@test.com' },
        isAuthenticated: true
    })
}));

describe('QuickSocialWidget Component', () => {
    const mockOnOpenSocialHub = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays active friends on top and last active friends below with a limit of 5', async () => {
        // 2 online friends and 5 offline friends with varying lastActive dates
        const mockFriends: FriendDTO[] = [
            { id: 'f1', friendshipId: 'fs1', name: 'Online Friend 1', email: 'f1@t.com', totalSolved: 500, currentContestRating: 1800, isOnline: true, streak: 3, pvpWins: 1, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 300, codeforcesSolvedCount: 200 },
            { id: 'f2', friendshipId: 'fs2', name: 'Online Friend 2', email: 'f2@t.com', totalSolved: 450, currentContestRating: 1750, isOnline: true, isBusy: true, streak: 5, pvpWins: 2, pvpLosses: 1, status: 'ACCEPTED', leetcodeSolvedCount: 250, codeforcesSolvedCount: 200 },
            { id: 'f3', friendshipId: 'fs3', name: 'Recent Offline Friend 3', email: 'f3@t.com', totalSolved: 400, currentContestRating: 1700, isOnline: false, lastActive: '2026-10-29T10:00:00Z', streak: 2, pvpWins: 0, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 200, codeforcesSolvedCount: 200 },
            { id: 'f4', friendshipId: 'fs4', name: 'Older Offline Friend 4', email: 'f4@t.com', totalSolved: 350, currentContestRating: 1650, isOnline: false, lastActive: '2026-10-28T10:00:00Z', streak: 4, pvpWins: 3, pvpLosses: 2, status: 'ACCEPTED', leetcodeSolvedCount: 200, codeforcesSolvedCount: 150 },
            { id: 'f5', friendshipId: 'fs5', name: 'Oldest Offline Friend 5', email: 'f5@t.com', totalSolved: 300, currentContestRating: 1600, isOnline: false, lastActive: '2026-10-27T10:00:00Z', streak: 1, pvpWins: 1, pvpLosses: 1, status: 'ACCEPTED', leetcodeSolvedCount: 150, codeforcesSolvedCount: 150 },
            { id: 'f6', friendshipId: 'fs6', name: 'Overflow Friend 6', email: 'f6@t.com', totalSolved: 250, currentContestRating: 1550, isOnline: false, lastActive: '2026-10-26T10:00:00Z', streak: 6, pvpWins: 4, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 150, codeforcesSolvedCount: 100 },
            { id: 'f7', friendshipId: 'fs7', name: 'Overflow Friend 7', email: 'f7@t.com', totalSolved: 200, currentContestRating: 1500, isOnline: false, lastActive: '2026-10-25T10:00:00Z', streak: 0, pvpWins: 0, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 100, codeforcesSolvedCount: 100 }
        ];

        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: mockFriends, pendingIncoming: [], pendingOutgoing: [] }
        } as unknown as AxiosResponse<FriendsResponseDTO>);

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse<PvpMatchDTO[]>);

        render(<QuickSocialWidget onOpenSocialHub={mockOnOpenSocialHub} />);

        await waitFor(() => {
            expect(screen.getByText('Online Friend 1')).toBeDefined();
        });

        // Online friends should be rendered first
        expect(screen.getByText('Online Friend 1')).toBeDefined();
        expect(screen.getByText('Online Friend 2')).toBeDefined();

        // Offline friends should be displayed below them up to the top 5 limit
        expect(screen.getByText('Recent Offline Friend 3')).toBeDefined();
        expect(screen.getByText('Older Offline Friend 4')).toBeDefined();
        expect(screen.getByText('Oldest Offline Friend 5')).toBeDefined();

        // Friends beyond top 5 should not be in the compact list
        expect(screen.queryByText('Overflow Friend 6')).toBeNull();
        expect(screen.queryByText('Overflow Friend 7')).toBeNull();

        // View All Friends button should be visible because 7 > 5
        const viewAllBtn = screen.getByRole('button', { name: /View All Friends \(7 Total/i });
        expect(viewAllBtn).toBeDefined();

        fireEvent.click(viewAllBtn);
        expect(mockOnOpenSocialHub).toHaveBeenCalledWith('friends');
    });

    it('renders offline friends with last active status when no friends are currently live', async () => {
        const mockFriends: FriendDTO[] = [
            { id: 'f8', friendshipId: 'fs8', name: 'Offline Friend 8', email: 'f8@t.com', totalSolved: 600, currentContestRating: 1900, isOnline: false, lastActive: '2026-10-29T10:00:00Z', streak: 8, pvpWins: 5, pvpLosses: 2, status: 'ACCEPTED', leetcodeSolvedCount: 400, codeforcesSolvedCount: 200 },
            { id: 'f9', friendshipId: 'fs9', name: 'Offline Friend 9', email: 'f9@t.com', totalSolved: 350, currentContestRating: 1500, isOnline: false, lastActive: '2026-10-28T08:00:00Z', streak: 2, pvpWins: 1, pvpLosses: 1, status: 'ACCEPTED', leetcodeSolvedCount: 200, codeforcesSolvedCount: 150 }
        ];

        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: mockFriends, pendingIncoming: [], pendingOutgoing: [] }
        } as unknown as AxiosResponse<FriendsResponseDTO>);

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse<PvpMatchDTO[]>);

        render(<QuickSocialWidget onOpenSocialHub={mockOnOpenSocialHub} />);

        // Instead of hiding friends behind an empty state, it should display the offline friends
        await waitFor(() => {
            expect(screen.getByText('Offline Friend 8')).toBeDefined();
            expect(screen.getByText('Offline Friend 9')).toBeDefined();
        });

        expect(screen.getByText('No Friends Live')).toBeDefined();
        expect(screen.getByText('2 Connected')).toBeDefined();
    });

    it('renders empty state only when user has 0 friends in total', async () => {
        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: [], pendingIncoming: [], pendingOutgoing: [] }
        } as unknown as AxiosResponse<FriendsResponseDTO>);

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse<PvpMatchDTO[]>);

        render(<QuickSocialWidget onOpenSocialHub={mockOnOpenSocialHub} />);

        await waitFor(() => {
            expect(screen.getByText('No Coding Friends Added Yet')).toBeDefined();
        });

        const findFriendsBtn = screen.getByRole('button', { name: /Find Coding Friends/i });
        fireEvent.click(findFriendsBtn);
        expect(mockOnOpenSocialHub).toHaveBeenCalledWith('friends');
    });
});
