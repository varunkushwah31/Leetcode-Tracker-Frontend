import { describe, it, expect } from 'vitest';
import { isFriendOnline, isFriendBusy } from './presenceHelper';
import type { FriendDTO } from '../types';

describe('presenceHelper', () => {
    it('returns true when isOnline flag is true', () => {
        const friend: Partial<FriendDTO> = { isOnline: true };
        expect(isFriendOnline(friend as FriendDTO)).toBe(true);
    });

    it('returns true when online property from Jackson is true', () => {
        const friend = { online: true } as unknown as FriendDTO;
        expect(isFriendOnline(friend)).toBe(true);
    });

    it('returns true when lastActive was within 5 minutes even if isOnline is false', () => {
        const friend: Partial<FriendDTO> = {
            isOnline: false,
            lastActive: new Date(Date.now() - 30 * 1000).toISOString() // 30 seconds ago
        };
        expect(isFriendOnline(friend as FriendDTO)).toBe(true);
    });

    it('returns false when lastActive was 16 minutes ago and isOnline is false', () => {
        const friend: Partial<FriendDTO> = {
            isOnline: false,
            lastActive: new Date(Date.now() - 16 * 60 * 1000).toISOString() // 16 minutes ago
        };
        expect(isFriendOnline(friend as FriendDTO)).toBe(false);
    });

    it('returns busy status correctly', () => {
        expect(isFriendBusy({ isBusy: true } as FriendDTO)).toBe(true);
        expect(isFriendBusy({ busy: true } as unknown as FriendDTO)).toBe(true);
        expect(isFriendBusy({ isBusy: false } as FriendDTO)).toBe(false);
    });
});
