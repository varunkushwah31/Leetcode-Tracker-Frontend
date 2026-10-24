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

    it('displays only online friends with a limit of 5 and shows view-all button when > 5 live', async () => {
        // Create 7 online friends and 2 offline friends
        const mockFriends: FriendDTO[] = [
            { id: 'f1', friendshipId: 'fs1', name: 'Online Friend 1', email: 'f1@t.com', totalSolved: 500, currentContestRating: 1800, isOnline: true, streak: 3, pvpWins: 1, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 300, codeforcesSolvedCount: 200 },
            { id: 'f2', friendshipId: 'fs2', name: 'Online Friend 2', email: 'f2@t.com', totalSolved: 450, currentContestRating: 1750, isOnline: true, streak: 5, pvpWins: 2, pvpLosses: 1, status: 'ACCEPTED', leetcodeSolvedCount: 250, codeforcesSolvedCount: 200 },
            { id: 'f3', friendshipId: 'fs3', name: 'Online Friend 3', email: 'f3@t.com', totalSolved: 400, currentContestRating: 1700, isOnline: true, streak: 2, pvpWins: 0, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 200, codeforcesSolvedCount: 200 },
            { id: 'f4', friendshipId: 'fs4', name: 'Online Friend 4', email: 'f4@t.com', totalSolved: 350, currentContestRating: 1650, isOnline: true, streak: 4, pvpWins: 3, pvpLosses: 2, status: 'ACCEPTED', leetcodeSolvedCount: 200, codeforcesSolvedCount: 150 },
            { id: 'f5', friendshipId: 'fs5', name: 'Online Friend 5', email: 'f5@t.com', totalSolved: 300, currentContestRating: 1600, isOnline: true, streak: 1, pvpWins: 1, pvpLosses: 1, status: 'ACCEPTED', leetcodeSolvedCount: 150, codeforcesSolvedCount: 150 },
            { id: 'f6', friendshipId: 'fs6', name: 'Online Friend 6', email: 'f6@t.com', totalSolved: 250, currentContestRating: 1550, isOnline: true, streak: 6, pvpWins: 4, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 150, codeforcesSolvedCount: 100 },
            { id: 'f7', friendshipId: 'fs7', name: 'Online Friend 7', email: 'f7@t.com', totalSolved: 200, currentContestRating: 1500, isOnline: true, streak: 0, pvpWins: 0, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 100, codeforcesSolvedCount: 100 },
            { id: 'f8', friendshipId: 'fs8', name: 'Offline Friend 8', email: 'f8@t.com', totalSolved: 600, currentContestRating: 1900, isOnline: false, streak: 8, pvpWins: 5, pvpLosses: 2, status: 'ACCEPTED', leetcodeSolvedCount: 400, codeforcesSolvedCount: 200 },
            { id: 'f9', friendshipId: 'fs9', name: 'Offline Friend 9', email: 'f9@t.com', totalSolved: 100, currentContestRating: 1400, isOnline: false, streak: 0, pvpWins: 0, pvpLosses: 0, status: 'ACCEPTED', leetcodeSolvedCount: 50, codeforcesSolvedCount: 50 }
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

        // The first 5 online friends should be rendered
        expect(screen.getByText('Online Friend 1')).toBeDefined();
        expect(screen.getByText('Online Friend 2')).toBeDefined();
        expect(screen.getByText('Online Friend 3')).toBeDefined();
        expect(screen.getByText('Online Friend 4')).toBeDefined();
        expect(screen.getByText('Online Friend 5')).toBeDefined();

        // 6th and 7th online friends should not be rendered in the top-5 list
        expect(screen.queryByText('Online Friend 6')).toBeNull();
        expect(screen.queryByText('Online Friend 7')).toBeNull();

        // Offline friends should NOT be shown in the live list
        expect(screen.queryByText('Offline Friend 8')).toBeNull();
        expect(screen.queryByText('Offline Friend 9')).toBeNull();

        // Button to view all live friends in Friends Network should be visible because 7 > 5
        const viewAllLiveBtn = screen.getByRole('button', { name: /View All Friends \(7 Live\)/i });
        expect(viewAllLiveBtn).toBeDefined();

        // Clicking the button should redirect to 'friends' tab in Friends Network
        fireEvent.click(viewAllLiveBtn);
        expect(mockOnOpenSocialHub).toHaveBeenCalledWith('friends');
    });

    it('renders aesthetic idle state when no friends are live right now', async () => {
        const mockFriends: FriendDTO[] = [
            { id: 'f8', friendshipId: 'fs8', name: 'Offline Friend 8', email: 'f8@t.com', totalSolved: 600, currentContestRating: 1900, isOnline: false, streak: 8, pvpWins: 5, pvpLosses: 2, status: 'ACCEPTED', leetcodeSolvedCount: 400, codeforcesSolvedCount: 200 }
        ];

        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: mockFriends, pendingIncoming: [], pendingOutgoing: [] }
        } as unknown as AxiosResponse<FriendsResponseDTO>);

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: []
        } as unknown as AxiosResponse<PvpMatchDTO[]>);

        render(<QuickSocialWidget onOpenSocialHub={mockOnOpenSocialHub} />);

        await waitFor(() => {
            expect(screen.getByText('No Friends Live Right Now')).toBeDefined();
        });

        expect(screen.getByText(/1 friend in your network/i)).toBeDefined();

        const networkBtn = screen.getByRole('button', { name: /View Friends Network/i });
        fireEvent.click(networkBtn);
        expect(mockOnOpenSocialHub).toHaveBeenCalledWith('friends');
    });
});
