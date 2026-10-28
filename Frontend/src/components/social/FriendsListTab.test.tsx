import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FriendsListTab } from './FriendsListTab';
import { SocialService } from '../../services/endpoints';
import type { FriendDTO, FriendsResponseDTO } from '@/types';
import type { AxiosResponse } from 'axios';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getFriends: vi.fn(),
        removeFriend: vi.fn(),
        sendFriendRequest: vi.fn(),
        acceptFriendRequest: vi.fn(),
        rejectFriendRequest: vi.fn(),
        cancelFriendRequest: vi.fn(),
        searchStudents: vi.fn(),
    }
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'u_self', name: 'Alice Student', email: 'alice@test.com' },
        isAuthenticated: true
    })
}));

describe('FriendsListTab Component', () => {
    const mockFriend: FriendDTO = {
        id: 'u_bob',
        friendshipId: 'fs_bob',
        name: 'Bob Peer',
        email: 'bob@test.com',
        avatarUrl: 'https://example.com/bob.png',
        leetcodeUsername: 'bob_lc',
        codeforcesHandle: 'bob_cf',
        cScore: 720,
        totalSolved: 450,
        currentContestRating: 1650,
        streak: 12,
        isOnline: true,
        isBusy: false,
        status: 'ACCEPTED',
        leetcodeSolvedCount: 300,
        codeforcesSolvedCount: 150,
        pvpWins: 5,
        pvpLosses: 2,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: {
                friends: [mockFriend],
                pendingIncoming: [],
                pendingOutgoing: [],
            }
        } as unknown as AxiosResponse<FriendsResponseDTO>);
        vi.mocked(SocialService.removeFriend).mockResolvedValue({ data: { success: true } } as unknown as AxiosResponse);
    });

    it('renders friends list and opens frontend confirmation card when remove button is clicked', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm');

        render(
            <FriendsListTab
                onViewDashboard={vi.fn()}
                onChallengePvp={vi.fn()}
            />
        );

        // Wait for Bob Peer to be visible
        expect(await screen.findByText('Bob Peer')).toBeTruthy();

        // Click the remove friend button
        const removeButton = screen.getByTitle('Remove Bob Peer');
        fireEvent.click(removeButton);

        // window.confirm must NOT be called
        expect(confirmSpy).not.toHaveBeenCalled();

        // Frontend confirmation dialog must open
        expect(screen.getByText('Remove from Friends List?')).toBeTruthy();
        expect(screen.getByText(/Are you sure you want to remove this peer\?/)).toBeTruthy();
        expect(screen.getByText('720 C-Score')).toBeTruthy();
        expect(screen.getByRole('button', { name: /Remove Friend/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeTruthy();

        confirmSpy.mockRestore();
    });

    it('cancels removal when clicking Cancel in confirmation dialog', async () => {
        render(
            <FriendsListTab
                onViewDashboard={vi.fn()}
                onChallengePvp={vi.fn()}
            />
        );

        expect(await screen.findByText('Bob Peer')).toBeTruthy();

        fireEvent.click(screen.getByTitle('Remove Bob Peer'));
        expect(screen.getByText('Remove from Friends List?')).toBeTruthy();

        // Click Cancel
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

        await waitFor(() => {
            expect(screen.queryByText('Remove from Friends List?')).toBeNull();
        });

        expect(SocialService.removeFriend).not.toHaveBeenCalled();
    });

    it('removes friend and calls SocialService.removeFriend when clicking Remove Friend', async () => {
        render(
            <FriendsListTab
                onViewDashboard={vi.fn()}
                onChallengePvp={vi.fn()}
            />
        );

        expect(await screen.findByText('Bob Peer')).toBeTruthy();

        fireEvent.click(screen.getByTitle('Remove Bob Peer'));

        // Confirm removal
        fireEvent.click(screen.getByRole('button', { name: /Remove Friend/i }));

        await waitFor(() => {
            expect(SocialService.removeFriend).toHaveBeenCalledWith('u_bob');
        });

        expect(await screen.findByText(/Removed Bob Peer from friends list/i)).toBeTruthy();
    });
});
