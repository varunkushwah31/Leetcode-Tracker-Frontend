import type { FriendDTO } from '../types';

/**
 * Checks if a friend is currently online/live.
 * Returns true if:
 * 1. Backend explicitly marked isOnline (or online) as true
 * 2. Or the friend was active within the last 5 minutes (lastActive fallback)
 */
export function isFriendOnline(friend?: FriendDTO | null, windowMinutes = 5): boolean {
    if (!friend) return false;

    if (friend.isOnline === true || (friend as { online?: boolean }).online === true) {
        return true;
    }

    if (friend.lastActive) {
        try {
            const date = new Date(friend.lastActive);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            if (!Number.isNaN(diffMs) && diffMs >= 0 && diffMs < windowMinutes * 60 * 1000) {
                return true;
            }
        } catch {
            // Ignore parse errors
        }
    }

    return false;
}

/**
 * Checks if a friend is currently busy in another PvP duel.
 */
export function isFriendBusy(friend?: FriendDTO | null): boolean {
    if (!friend) return false;
    return Boolean(friend.isBusy ?? (friend as { busy?: boolean }).busy);
}
