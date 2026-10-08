import { describe, it, expect } from 'vitest';
import {
    extractLeetcodeUsername,
    extractCodeforcesHandle,
    isLeetCodeUrl,
    isCodeforcesUrl,
    sanitizePlatformHandles,
    parseProblemInput,
    extractTitleFromUrlOrSlug,
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

    describe('parseProblemInput', () => {
        it('parses LeetCode problem URLs correctly', () => {
            const res = parseProblemInput('https://leetcode.com/problems/two-sum/');
            expect(res.slug).toBe('two-sum');
            expect(res.detectedPlatform).toBe('LEETCODE');
        });

        it('parses LeetCode CN URLs correctly', () => {
            const res = parseProblemInput('https://leetcode.cn/problems/longest-substring-without-repeating-characters');
            expect(res.slug).toBe('longest-substring-without-repeating-characters');
            expect(res.detectedPlatform).toBe('LEETCODE');
        });

        it('parses Codeforces problemset URLs correctly', () => {
            const res = parseProblemInput('https://codeforces.com/problemset/problem/4/A');
            expect(res.slug).toBe('4A');
            expect(res.detectedPlatform).toBe('CODEFORCES');
            expect(res.problemNumber).toBe('4A');
        });

        it('parses Codeforces contest problem URLs correctly', () => {
            const res = parseProblemInput('https://codeforces.com/contest/1234/problem/B');
            expect(res.slug).toBe('1234B');
            expect(res.detectedPlatform).toBe('CODEFORCES');
        });

        it('parses direct slug or problem number', () => {
            const lcRes = parseProblemInput('trapping-rain-water', 'LEETCODE');
            expect(lcRes.slug).toBe('trapping-rain-water');
            expect(lcRes.detectedPlatform).toBe('LEETCODE');

            const cfRes = parseProblemInput('4A', 'CODEFORCES');
            expect(cfRes.slug).toBe('4A');
            expect(cfRes.detectedPlatform).toBe('CODEFORCES');
        });
    });

    describe('extractTitleFromUrlOrSlug', () => {
        it('auto-extracts and humanizes problem title from LeetCode URL', () => {
            expect(extractTitleFromUrlOrSlug('https://leetcode.com/problems/two-sum/')).toBe('Two Sum');
            expect(extractTitleFromUrlOrSlug('https://leetcode.com/problems/course-schedule-ii/')).toBe('Course Schedule II');
            expect(extractTitleFromUrlOrSlug('https://leetcode.com/problems/lru-cache/')).toBe('LRU Cache');
            expect(extractTitleFromUrlOrSlug('https://leetcode.com/problems/trapping-rain-water/')).toBe('Trapping Rain Water');
        });

        it('auto-extracts title from Codeforces URL', () => {
            expect(extractTitleFromUrlOrSlug('https://codeforces.com/problemset/problem/4/A')).toBe('Problem 4A');
            expect(extractTitleFromUrlOrSlug('https://codeforces.com/contest/1234/problem/B')).toBe('Problem 1234B');
            expect(extractTitleFromUrlOrSlug('4A', 'CODEFORCES')).toBe('Problem 4A');
        });

        it('humanizes raw slugs with proper casing and acronyms', () => {
            expect(extractTitleFromUrlOrSlug('median-of-two-sorted-arrays')).toBe('Median Of Two Sorted Arrays');
            expect(extractTitleFromUrlOrSlug('lowest-common-ancestor-of-a-binary-search-tree')).toBe('Lowest Common Ancestor Of A Binary Search Tree');
        });

        it('returns empty string for empty inputs', () => {
            expect(extractTitleFromUrlOrSlug('')).toBe('');
            expect(extractTitleFromUrlOrSlug('   ')).toBe('');
        });
    });
});
