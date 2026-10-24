import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityFeedTab } from './ActivityFeedTab';
import { SocialService } from '../../services/endpoints';
import type { FriendActivityDTO } from '@/types';
import type { AxiosResponse } from 'axios';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getActivities: vi.fn(),
        reactToActivity: vi.fn()
    }
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'user_varun', name: 'Varun Kushwah', email: 'varun@test.com', role: 'STUDENT' },
        isAuthenticated: true
    })
}));

describe('ActivityFeedTab Component', () => {
    const mockOnViewFriendDashboard = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders friend profile pic and details instead of user own pic for NEW_FRIEND activities', async () => {
        const mockActivities: FriendActivityDTO[] = [
            {
                id: 'act_friend_1',
                studentId: 'user_varun',
                studentName: 'Varun Kushwah',
                studentHandle: 'Varun_Kushwah',
                studentAvatarUrl: 'https://assets.leetcode.com/users/Varun_Kushwah/avatar.png',
                targetStudentId: 'user_prachi',
                targetStudentName: 'Prachi Sharma',
                targetStudentHandle: 'prachi9506',
                targetStudentAvatarUrl: 'https://assets.leetcode.com/users/prachi9506/avatar.png',
                type: 'NEW_FRIEND',
                title: 'New Friendship Formed',
                description: 'Varun Kushwah and Prachi Sharma became friends! Start competing and solving together.',
                kudosCount: 2,
                userReacted: false,
                reactionCounts: { fire: 1, kudos: 1 },
                myReactions: [],
                createdAt: new Date().toISOString()
            }
        ];

        vi.mocked(SocialService.getActivities).mockResolvedValue({
            data: mockActivities
        } as unknown as AxiosResponse<FriendActivityDTO[]>);

        render(<ActivityFeedTab onViewFriendDashboard={mockOnViewFriendDashboard} />);

        await waitFor(() => {
            expect(screen.queryByText('Loading friend activity stream...')).toBeNull();
        });

        // The card should display Prachi Sharma's name and handle, NOT Varun Kushwah as author
        expect(screen.getByText('Prachi Sharma')).toBeDefined();
        expect(screen.getByText('@prachi9506')).toBeDefined();

        // It should NOT render "(You)" next to the friend's name
        expect(screen.queryByText('(You)')).toBeNull();

        // The button should say "View Friend Profile →"
        const viewFriendBtn = screen.getByRole('button', { name: /View Friend Profile/i });
        expect(viewFriendBtn).toBeDefined();

        // Clicking the button should navigate to Prachi's dashboard, NOT Varun's
        fireEvent.click(viewFriendBtn);
        expect(mockOnViewFriendDashboard).toHaveBeenCalledWith('user_prachi');

        // Clicking Prachi's name should also open Prachi's dashboard
        fireEvent.click(screen.getByText('Prachi Sharma'));
        expect(mockOnViewFriendDashboard).toHaveBeenCalledWith('user_prachi');
    });

    it('handles reactions to an activity item cleanly', async () => {
        const mockActivities: FriendActivityDTO[] = [
            {
                id: 'act_solve_1',
                studentId: 'user_prachi',
                studentName: 'Prachi Sharma',
                studentHandle: 'prachi9506',
                studentAvatarUrl: 'https://assets.leetcode.com/users/prachi9506/avatar.png',
                type: 'PROBLEM_SOLVED',
                title: 'Two Sum',
                description: 'Prachi Sharma solved Two Sum on LeetCode.',
                kudosCount: 0,
                userReacted: false,
                reactionCounts: {},
                myReactions: [],
                createdAt: new Date().toISOString()
            }
        ];

        vi.mocked(SocialService.getActivities).mockResolvedValue({
            data: mockActivities
        } as unknown as AxiosResponse<FriendActivityDTO[]>);

        vi.mocked(SocialService.reactToActivity).mockResolvedValue({
            data: {
                ...mockActivities[0],
                reactionCounts: { fire: 1 },
                myReactions: ['fire']
            }
        } as unknown as AxiosResponse<FriendActivityDTO>);

        render(<ActivityFeedTab onViewFriendDashboard={mockOnViewFriendDashboard} />);

        await waitFor(() => {
            expect(screen.getByText('Two Sum')).toBeDefined();
        });

        const fireBtn = screen.getByRole('button', { name: /Fire/i });
        fireEvent.click(fireBtn);

        await waitFor(() => {
            expect(SocialService.reactToActivity).toHaveBeenCalledWith('act_solve_1', 'fire');
        });
    });
});
