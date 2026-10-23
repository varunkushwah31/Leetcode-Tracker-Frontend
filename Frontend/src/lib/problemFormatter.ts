/**
 * Utility functions for formatting and resolving problem slugs, titles, and URLs
 * across LeetCode and Codeforces for social features and peer learning.
 */

const ROMAN_NUMERALS = new Set(['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']);
const COMMON_ACRONYMS = new Set(['lru', 'lfu', 'bst', 'bfs', 'dfs', 'gcd', 'lcm', 'dp', 'sql']);

/**
 * Formats a raw slug or identifier into a human-readable title.
 * Examples:
 * - "find-target-indices-after-sorting-array" -> "Find Target Indices After Sorting Array"
 * - "subarrays-distinct-element-sum-of-squares-i" -> "Subarrays Distinct Element Sum Of Squares I"
 * - "two-sum-ii-input-array-is-sorted" -> "Two Sum II Input Array Is Sorted"
 * - "282a" -> "282A" (Codeforces)
 * - "1915C" -> "1915C" (Codeforces)
 */
export function formatProblemTitle(rawSlug?: string | null): string {
    if (!rawSlug) return 'Untitled Problem';
    const slug = rawSlug.trim();
    if (!slug) return 'Untitled Problem';

    // 1. Detect Codeforces problem ID format (e.g. "282a", "1915C", "71A")
    if (/^\d{1,5}[a-zA-Z]\d?$/i.test(slug)) {
        return slug.toUpperCase();
    }

    // 2. Kebab-case or Snake-case
    if (slug.includes('-') || slug.includes('_')) {
        return slug
            .split(/[-_]+/)
            .filter(Boolean)
            .map(word => {
                const lower = word.toLowerCase();
                if (ROMAN_NUMERALS.has(lower)) {
                    return lower.toUpperCase();
                }
                if (COMMON_ACRONYMS.has(lower)) {
                    return lower.toUpperCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }

    // 3. CamelCase or PascalCase (e.g. "TwoSum", "findTargetIndices")
    const camelSplit = slug
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    if (camelSplit.includes(' ')) {
        return camelSplit
            .split(' ')
            .map(word => {
                const lower = word.toLowerCase();
                if (ROMAN_NUMERALS.has(lower) || COMMON_ACRONYMS.has(lower)) {
                    return lower.toUpperCase();
                }
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }

    // 4. Fallback for simple capitalized strings or single word
    return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Resolves the target external URL and platform tag for a given problem slug.
 */
export function getProblemPlatform(rawSlug?: string | null): { platform: 'LeetCode' | 'Codeforces' | 'Practice'; url: string } {
    if (!rawSlug) {
        return { platform: 'Practice', url: 'https://leetcode.com/problemset/' };
    }

    const slug = rawSlug.trim();

    // Codeforces check: e.g. "282a", "1915C"
    const cfMatch = slug.match(/^(\d{1,5})([a-zA-Z]\d?)$/i);
    if (cfMatch) {
        const contestId = cfMatch[1];
        const problemIndex = cfMatch[2].toUpperCase();
        return {
            platform: 'Codeforces',
            url: `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`
        };
    }

    // LeetCode slug
    const cleanLcSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    return {
        platform: 'LeetCode',
        url: `https://leetcode.com/problems/${cleanLcSlug}/`
    };
}
