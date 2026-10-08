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

/**
 * Parses problem input (URL or slug/identifier) and returns canonical slug and detected platform.
 */
export function parseProblemInput(
    input: string,
    platform: 'LEETCODE' | 'CODEFORCES' = 'LEETCODE'
): { slug: string; detectedPlatform: 'LEETCODE' | 'CODEFORCES'; problemNumber?: string } {
    const trimmed = (input || '').trim();
    const cfMatch = trimmed.match(/(?:problemset\/problem|contest|gym)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/i);
    if (cfMatch) {
        const pNum = `${cfMatch[1]}${cfMatch[2].toUpperCase()}`;
        return { slug: pNum, detectedPlatform: 'CODEFORCES', problemNumber: pNum };
    }

    const lcMatch = trimmed.match(/problems\/([a-zA-Z0-9_-]+)/i);
    if (lcMatch) {
        return { slug: lcMatch[1].toLowerCase(), detectedPlatform: 'LEETCODE' };
    }

    if (platform === 'CODEFORCES') {
        const cleanCF = trimmed.replace('/', '').toUpperCase();
        return { slug: cleanCF, detectedPlatform: 'CODEFORCES', problemNumber: cleanCF };
    }

    return { slug: trimmed.toLowerCase(), detectedPlatform: 'LEETCODE' };
}

/**
 * Extracts and humanizes a problem title automatically from a URL or problem slug/id.
 * Allows mentors to assign questions via URL without manually typing problem titles.
 */
export function extractTitleFromUrlOrSlug(
    input: string,
    platform?: 'LEETCODE' | 'CODEFORCES'
): string {
    if (!input || !input.trim()) return '';
    const trimmed = input.trim();

    // 1. Codeforces URL or Problem ID
    const cfMatch = trimmed.match(/(?:problemset\/problem|contest|gym)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/i);
    if (cfMatch) {
        return `Problem ${cfMatch[1]}${cfMatch[2].toUpperCase()}`;
    }
    if (platform === 'CODEFORCES') {
        const cleanCF = trimmed.replace('/', '').toUpperCase();
        const cfIdMatch = cleanCF.match(/^(\d+)([A-Z0-9]+)$/);
        if (cfIdMatch) {
            return `Problem ${cfIdMatch[1]}${cfIdMatch[2]}`;
        }
    }

    // 2. LeetCode URL or Slug
    const lcMatch = trimmed.match(/problems\/([a-zA-Z0-9_-]+)/i);
    const slug = lcMatch ? lcMatch[1] : (platform !== 'CODEFORCES' && !trimmed.startsWith('http') ? trimmed : '');

    if (slug) {
        const romanNumerals = new Set(['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']);
        const acronyms = new Set(['lru', 'lfu', 'bst', 'trie', 'sql', 'dp', 'bfs', 'dfs', 'gcd', 'lcm']);

        return slug
            .split(/[-_]+/)
            .filter(Boolean)
            .map(word => {
                const lower = word.toLowerCase();
                if (romanNumerals.has(lower)) return lower.toUpperCase();
                if (acronyms.has(lower)) return lower.toUpperCase();
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }

    return '';
}

