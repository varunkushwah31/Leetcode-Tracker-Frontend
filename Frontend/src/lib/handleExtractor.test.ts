import { describe, it, expect } from 'vitest';
import {
    extractLeetcodeUsername,
    extractCodeforcesHandle,
    isLeetCodeUrl,
    isCodeforcesUrl,
    sanitizePlatformHandles,
} from './handleExtractor';

describe('handleExtractor', () => {
    describe('isLeetCodeUrl', () => {
        it('detects LeetCode URLs accurately', () => {
            expect(isLeetCodeUrl('https://leetcode.com/u/alice/')).toBe(true);
            expect(isLeetCodeUrl('leetcode.com/alice')).toBe(true);
            expect(isLeetCodeUrl('https://leetcode.cn/u/bob')).toBe(true);
            expect(isLeetCodeUrl('alice_01')).toBe(false);
            expect(isLeetCodeUrl('')).toBe(false);
        });
    });

    describe('isCodeforcesUrl', () => {
        it('detects Codeforces URLs accurately', () => {
            expect(isCodeforcesUrl('https://codeforces.com/profile/tourist')).toBe(true);
            expect(isCodeforcesUrl('codeforces.org/profile/tourist/')).toBe(true);
            expect(isCodeforcesUrl('tourist')).toBe(false);
            expect(isCodeforcesUrl('')).toBe(false);
        });
    });

    describe('extractLeetcodeUsername', () => {
        it('extracts username from various LeetCode profile URLs', () => {
            expect(extractLeetcodeUsername('https://leetcode.com/u/alice_99/')).toBe('alice_99');
            expect(extractLeetcodeUsername('http://leetcode.com/u/alice-99')).toBe('alice-99');
            expect(extractLeetcodeUsername('https://leetcode.cn/u/alice_cn/')).toBe('alice_cn');
            expect(extractLeetcodeUsername('leetcode.com/alice_raw')).toBe('alice_raw');
            expect(extractLeetcodeUsername('https://leetcode.com/u/alice/?page=1#profile')).toBe('alice');
        });

        it('cleans raw username and handles leading @', () => {
            expect(extractLeetcodeUsername('@alice_user')).toBe('alice_user');
            expect(extractLeetcodeUsername('alice_user')).toBe('alice_user');
            expect(extractLeetcodeUsername('  alice_user  ')).toBe('alice_user');
            expect(extractLeetcodeUsername('')).toBe('');
            expect(extractLeetcodeUsername(null)).toBe('');
        });
    });

    describe('extractCodeforcesHandle', () => {
        it('extracts handle from various Codeforces profile URLs', () => {
            expect(extractCodeforcesHandle('https://codeforces.com/profile/tourist/')).toBe('tourist');
            expect(extractCodeforcesHandle('http://codeforces.com/profile/Petr')).toBe('Petr');
            expect(extractCodeforcesHandle('codeforces.org/profile/benq/')).toBe('benq');
            expect(extractCodeforcesHandle('https://codeforces.com/profile/tourist?locale=en#contests')).toBe('tourist');
        });

        it('cleans raw handle and handles leading @', () => {
            expect(extractCodeforcesHandle('@tourist')).toBe('tourist');
            expect(extractCodeforcesHandle('tourist')).toBe('tourist');
            expect(extractCodeforcesHandle('  tourist  ')).toBe('tourist');
            expect(extractCodeforcesHandle('')).toBe('');
            expect(extractCodeforcesHandle(null)).toBe('');
        });
    });

    describe('sanitizePlatformHandles', () => {
        it('handles clean inputs properly', () => {
            const res = sanitizePlatformHandles('alice_lc', 'bob_cf');
            expect(res.leetcodeUsername).toBe('alice_lc');
            expect(res.codeforcesHandle).toBe('bob_cf');
            expect(res.swapped).toBe(false);
        });

        it('extracts handles from URLs in their respective fields', () => {
            const res = sanitizePlatformHandles(
                'https://leetcode.com/u/alice_lc/',
                'https://codeforces.com/profile/bob_cf'
            );
            expect(res.leetcodeUsername).toBe('alice_lc');
            expect(res.codeforcesHandle).toBe('bob_cf');
            expect(res.swapped).toBe(false);
        });

        it('auto-detects and corrects cross-platform swapped URLs', () => {
            // User pasted CF URL into LC field, and LC URL into CF field
            const res = sanitizePlatformHandles(
                'https://codeforces.com/profile/tourist',
                'https://leetcode.com/u/neal_wu'
            );
            expect(res.leetcodeUsername).toBe('neal_wu');
            expect(res.codeforcesHandle).toBe('tourist');
            expect(res.swapped).toBe(true);
        });

        it('routes Codeforces URL to CF handle when LC input has CF URL and CF field is empty', () => {
            const res = sanitizePlatformHandles('https://codeforces.com/profile/tourist', '');
            expect(res.leetcodeUsername).toBe('');
            expect(res.codeforcesHandle).toBe('tourist');
            expect(res.swapped).toBe(true);
        });

        it('routes LeetCode URL to LC handle when CF input has LC URL and LC field is empty', () => {
            const res = sanitizePlatformHandles('', 'https://leetcode.com/u/alice');
            expect(res.leetcodeUsername).toBe('alice');
            expect(res.codeforcesHandle).toBe('');
            expect(res.swapped).toBe(true);
        });
    });
});
