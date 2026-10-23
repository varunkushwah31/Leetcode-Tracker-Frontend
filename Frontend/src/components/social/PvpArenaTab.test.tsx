import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PvpArenaTab } from './PvpArenaTab';
import { SocialService } from '../../services/endpoints';
import type { PvpMatchDTO } from '@/types';

vi.mock('../../services/endpoints', () => ({
    SocialService: {
        getFriends: vi.fn(),
        getPvpMatches: vi.fn(),
        acceptPvpMatch: vi.fn(),
        declinePvpMatch: vi.fn(),
        verifyPvpMatch: vi.fn(),
        endPvpMatch: vi.fn(),
        createPvpChallenge: vi.fn()
    }
}));

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: 'u_self', name: 'Alice', email: 'alice@test.com' },
        isAuthenticated: true
    })
}));

vi.mock('../../hooks/usePvpWebSocket', () => ({
    usePvpWebSocket: vi.fn()
}));

describe('PvpArenaTab Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const activeMatch: PvpMatchDTO = {
        id: 'match_123',
        challengerId: 'u_self',
        challengerName: 'Alice',
        opponentId: 'u_bob',
        opponentName: 'Bob',
        problemTitle: 'Two Sum',
        problemSlug: 'two-sum',
        problemPlatform: 'LEETCODE',
        problemDifficulty: 'Easy',
        problemLink: 'https://leetcode.com/problems/two-sum/',
        problemTopic: 'Arrays',
        durationMinutes: 30,
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        remainingSeconds: 1500,
        challengerSolved: false,
        opponentSolved: false
    };

    it('renders active in-progress match with preemptive End Duel button', async () => {
        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: [activeMatch]
        } as any);
        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: [], pendingIncoming: [], pendingOutgoing: [] }
        } as any);

        render(<PvpArenaTab />);

        await waitFor(() => {
            expect(screen.getByText('Two Sum')).toBeDefined();
            expect(screen.getByRole('button', { name: /End Duel/i })).toBeDefined();
        });
    });

    it('opens confirmation modal and ends PvP duel preemptively', async () => {
        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: [activeMatch]
        } as any);
        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: [], pendingIncoming: [], pendingOutgoing: [] }
        } as any);
        vi.mocked(SocialService.endPvpMatch).mockResolvedValue({
            data: {
                ...activeMatch,
                status: 'COMPLETED',
                winnerId: 'u_bob',
                winnerName: 'Bob'
            }
        } as any);

        render(<PvpArenaTab />);

        await waitFor(() => {
            expect(screen.getByText('Two Sum')).toBeDefined();
        });

        const endDuelBtn = screen.getByRole('button', { name: /End Duel/i });
        fireEvent.click(endDuelBtn);

        // Confirmation dialog should be visible
        await waitFor(() => {
            expect(screen.getByText('End PvP Duel Preemptively?')).toBeDefined();
            expect(screen.getByText(/immediately sever the live match connection/i)).toBeDefined();
        });

        // Click confirm in modal
        const confirmBtn = screen.getByRole('button', { name: /Yes, End Duel & Sever Connection/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(SocialService.endPvpMatch).toHaveBeenCalledWith('match_123');
        });
    });

    it('allows challenger to cancel pending invitation', async () => {
        const invitedMatch: PvpMatchDTO = {
            id: 'match_invite',
            challengerId: 'u_self',
            challengerName: 'Alice',
            opponentId: 'u_bob',
            opponentName: 'Bob',
            problemTitle: '3Sum',
            problemSlug: '3sum',
            problemPlatform: 'LEETCODE',
            problemDifficulty: 'Medium',
            problemLink: 'https://leetcode.com/problems/3sum/',
            problemTopic: 'Arrays',
            durationMinutes: 30,
            status: 'INVITED',
            createdAt: new Date().toISOString(),
            challengerSolved: false,
            opponentSolved: false
        };

        vi.mocked(SocialService.getPvpMatches).mockResolvedValue({
            data: [invitedMatch]
        } as any);
        vi.mocked(SocialService.getFriends).mockResolvedValue({
            data: { friends: [], pendingIncoming: [], pendingOutgoing: [] }
        } as any);
        vi.mocked(SocialService.declinePvpMatch).mockResolvedValue({
            data: { ...invitedMatch, status: 'DECLINED' }
        } as any);

        render(<PvpArenaTab />);

        await waitFor(() => {
            expect(screen.getByText('3Sum')).toBeDefined();
            expect(screen.getByRole('button', { name: /Cancel Invitation/i })).toBeDefined();
        });

        const cancelBtn = screen.getByRole('button', { name: /Cancel Invitation/i });
        fireEvent.click(cancelBtn);

        await waitFor(() => {
            expect(SocialService.declinePvpMatch).toHaveBeenCalledWith('match_invite');
        });
    });
});
