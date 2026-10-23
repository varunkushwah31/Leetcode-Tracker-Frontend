import { describe, it, expect } from 'vitest';
import { formatProblemTitle, getProblemPlatform } from './problemFormatter';

describe('problemFormatter', () => {
    it('formats kebab-case LeetCode slugs correctly with title casing and Roman numerals', () => {
        expect(formatProblemTitle('find-target-indices-after-sorting-array'))
            .toBe('Find Target Indices After Sorting Array');
        expect(formatProblemTitle('subarrays-distinct-element-sum-of-squares-i'))
            .toBe('Subarrays Distinct Element Sum Of Squares I');
        expect(formatProblemTitle('two-sum-ii-input-array-is-sorted'))
            .toBe('Two Sum II Input Array Is Sorted');
        expect(formatProblemTitle('lru-cache'))
            .toBe('LRU Cache');
    });

    it('formats Codeforces problem identifiers correctly', () => {
        expect(formatProblemTitle('282a')).toBe('282A');
        expect(formatProblemTitle('1915c')).toBe('1915C');
        expect(formatProblemTitle('71A')).toBe('71A');
    });

    it('resolves correct URLs and platforms for LeetCode and Codeforces', () => {
        const lc = getProblemPlatform('two-sum');
        expect(lc.platform).toBe('LeetCode');
        expect(lc.url).toBe('https://leetcode.com/problems/two-sum/');

        const cf = getProblemPlatform('282a');
        expect(cf.platform).toBe('Codeforces');
        expect(cf.url).toBe('https://codeforces.com/problemset/problem/282/A');
    });
});
