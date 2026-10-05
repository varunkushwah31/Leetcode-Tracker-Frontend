/**
 * Utilities for extracting and normalizing LeetCode and Codeforces
 * usernames and handles from profile URLs or direct input strings.
 */

export function isLeetCodeUrl(input: string): boolean {
    if (!input) return false;
    return /(?:leetcode\.com|leetcode\.cn)/i.test(input);
}

export function isCodeforcesUrl(input: string): boolean {
    if (!input) return false;
    return /(?:codeforces\.com|codeforces\.org|codeforces\.net)/i.test(input);
}

/**
 * Extracts canonical LeetCode username from a profile URL or raw username.
 * Supports:
 * - https://leetcode.com/u/username/
 * - https://leetcode.com/username
 * - https://leetcode.cn/u/username
 * - @username
 * - raw username
 */
export function extractLeetcodeUsername(input: string | null | undefined): string {
    if (!input) return '';
    let trimmed = input.trim();
    if (!trimmed) return '';

    // Strip URL query parameters or hash if present
    trimmed = trimmed.split('?')[0].split('#')[0].trim();

    // Check for LeetCode profile URL pattern
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\/(?:u\/|profile\/)?([a-zA-Z0-9_-]+)\/?/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1].trim();
    }

    // Strip leading @ or slashes
    return trimmed.replace(/^[@/]+/, '').replace(/\/+$/, '').trim();
}

/**
 * Extracts canonical Codeforces handle from a profile URL or raw handle.
 * Supports:
 * - https://codeforces.com/profile/handle/
 * - codeforces.com/profile/handle
 * - @handle
 * - raw handle
 */
export function extractCodeforcesHandle(input: string | null | undefined): string {
    if (!input) return '';
    let trimmed = input.trim();
    if (!trimmed) return '';

    // Strip URL query parameters or hash if present
    trimmed = trimmed.split('?')[0].split('#')[0].trim();

    // Check for Codeforces profile URL pattern
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?codeforces\.(?:com|org|net)\/(?:profile\/)?([a-zA-Z0-9_.-]+)\/?/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1].trim();
    }

    // Strip leading @ or slashes
    return trimmed.replace(/^[@/]+/, '').replace(/\/+$/, '').trim();
}

/**
 * Intelligently extracts LeetCode & Codeforces handles with cross-platform swap detection.
 * E.g., if a user pasted a Codeforces URL into the LeetCode input and vice versa.
 */
export function sanitizePlatformHandles(
    leetcodeInput: string | null | undefined,
    codeforcesInput: string | null | undefined
): { leetcodeUsername: string; codeforcesHandle: string; swapped: boolean } {
    const rawLc = (leetcodeInput || '').trim();
    const rawCf = (codeforcesInput || '').trim();

    let leetcodeUsername = '';
    let codeforcesHandle = '';
    let swapped = false;

    const lcIsCf = isCodeforcesUrl(rawLc);
    const cfIsLc = isLeetCodeUrl(rawCf);

    if (lcIsCf && cfIsLc) {
        // Both fields were inverted
        leetcodeUsername = extractLeetcodeUsername(rawCf);
        codeforcesHandle = extractCodeforcesHandle(rawLc);
        swapped = true;
    } else if (lcIsCf && !rawCf) {
        // CF URL placed into LC input, CF input empty
        codeforcesHandle = extractCodeforcesHandle(rawLc);
        swapped = true;
    } else if (cfIsLc && !rawLc) {
        // LC URL placed into CF input, LC input empty
        leetcodeUsername = extractLeetcodeUsername(rawCf);
        swapped = true;
    } else {
        leetcodeUsername = extractLeetcodeUsername(rawLc);
        codeforcesHandle = extractCodeforcesHandle(rawCf);
    }

    return { leetcodeUsername, codeforcesHandle, swapped };
}
