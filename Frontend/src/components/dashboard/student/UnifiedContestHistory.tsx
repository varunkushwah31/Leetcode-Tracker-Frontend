import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { TrophyIcon } from '@phosphor-icons/react';
import type { ContestHistory, CodeforcesContestHistory } from '@/types';

export interface UnifiedContestItem {
    id: string;
    platform: 'LEETCODE' | 'CODEFORCES';
    title: string;
    timestamp: number;
    rank: number;
    rating: number;
    delta?: number;
    problemsSolved?: number;
    totalProblems?: number;
}

interface UnifiedContestHistoryProps {
    contestHistory?: ContestHistory[];
    codeforcesContestHistory?: CodeforcesContestHistory[];
    className?: string;
    cardClassName?: string;
    maxDisplay?: number;
    scrollHeightClass?: string;
}

export function UnifiedContestHistory({
    contestHistory = [],
    codeforcesContestHistory = [],
    className = '',
    cardClassName,
    maxDisplay = 20,
    scrollHeightClass = 'h-64',
}: Readonly<UnifiedContestHistoryProps>) {
    const [platformFilter, setPlatformFilter] = useState<'ALL' | 'LEETCODE' | 'CODEFORCES'>('ALL');

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number'
            ? new Date(ts * 1000).toLocaleDateString()
            : new Date(ts).toLocaleDateString();
    };

    const lcItems: UnifiedContestItem[] = useMemo(() => {
        return (contestHistory || []).map((c, idx) => ({
            id: `lc-${c.title}-${c.timestamp || idx}`,
            platform: 'LEETCODE' as const,
            title: c.title,
            timestamp: c.timestamp,
            rank: c.ranking,
            rating: Math.round(c.rating),
            problemsSolved: c.problemsSolved,
            totalProblems: c.totalProblems,
        }));
    }, [contestHistory]);

    const cfItems: UnifiedContestItem[] = useMemo(() => {
        return (codeforcesContestHistory || []).map((c) => ({
            id: `cf-${c.contestId}-${c.ratingUpdateTimeSeconds}`,
            platform: 'CODEFORCES' as const,
            title: c.contestName,
            timestamp: c.ratingUpdateTimeSeconds,
            rank: c.rank,
            rating: c.newRating,
            delta: c.newRating - c.oldRating,
        }));
    }, [codeforcesContestHistory]);

    const allItems: UnifiedContestItem[] = useMemo(() => {
        return [...lcItems, ...cfItems].sort((a, b) => b.timestamp - a.timestamp);
    }, [lcItems, cfItems]);

    const displayedItems = useMemo(() => {
        let items = allItems;
        if (platformFilter === 'LEETCODE') {
            items = [...lcItems].sort((a, b) => b.timestamp - a.timestamp);
        } else if (platformFilter === 'CODEFORCES') {
            items = [...cfItems].sort((a, b) => b.timestamp - a.timestamp);
        }
        return items.slice(0, maxDisplay);
    }, [allItems, lcItems, cfItems, platformFilter, maxDisplay]);

    const totalCount = allItems.length;
    const lcCount = lcItems.length;
    const cfCount = cfItems.length;
    const hasMultiplePlatforms = lcCount > 0 && cfCount > 0;

    if (totalCount === 0) {
        return null;
    }

    const defaultCardClass = "relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200";

    return (
        <Card className={`${cardClassName || defaultCardClass} ${className}`}>
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white tracking-tight">
                        <TrophyIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Contest History
                    </CardTitle>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0">
                        {totalCount} {totalCount === 1 ? 'contest' : 'contests'}
                    </span>
                </div>

                {hasMultiplePlatforms && (
                    <div className="flex items-center gap-1 mt-2.5 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/60 w-fit">
                        <button
                            type="button"
                            onClick={() => setPlatformFilter('ALL')}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${
                                platformFilter === 'ALL'
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setPlatformFilter('LEETCODE')}
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                                platformFilter === 'LEETCODE'
                                    ? 'bg-amber-500/15 dark:bg-[#ffa116]/20 text-amber-700 dark:text-[#ffa116] border border-amber-500/30 shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-zinc-200'
                            }`}
                        >
                            LC ({lcCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setPlatformFilter('CODEFORCES')}
                            className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                                platformFilter === 'CODEFORCES'
                                    ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-zinc-200'
                            }`}
                        >
                            CF ({cfCount})
                        </button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-4 pt-4">
                <ScrollArea className={`${scrollHeightClass} pr-4`}>
                    <div className="flex flex-col gap-2.5">
                        {displayedItems.map((contest) => (
                            <div
                                key={contest.id}
                                className="flex items-center justify-between p-3 bg-zinc-50/80 dark:bg-[#1a1a1a]/40 hover:bg-zinc-100/90 dark:hover:bg-[#1a1a1a]/80 border border-zinc-200/80 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700/60 rounded-xl transition-all group"
                            >
                                <div className="min-w-0 flex-1 pr-3">
                                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                                        <span
                                            className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                                contest.platform === 'CODEFORCES'
                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                            }`}
                                        >
                                            {contest.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                        </span>
                                        <p
                                            className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors"
                                            title={contest.title}
                                        >
                                            {contest.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                            Rank #{contest.rank > 0 ? contest.rank.toLocaleString() : 'N/A'}
                                        </span>
                                        <span className="text-zinc-400 dark:text-zinc-600">•</span>
                                        <span className="text-zinc-500">{formatDate(contest.timestamp)}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p
                                        className={`text-sm font-bold tracking-tight ${
                                            contest.platform === 'CODEFORCES' ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-[#ffa116]'
                                        }`}
                                    >
                                        {contest.rating}
                                    </p>
                                    {contest.platform === 'CODEFORCES' && contest.delta !== undefined ? (
                                        <p
                                            className={`text-[10px] font-bold ${
                                                contest.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                            }`}
                                        >
                                            {contest.delta >= 0 ? `+${contest.delta}` : contest.delta}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                            {contest.problemsSolved !== undefined && contest.totalProblems !== undefined
                                                ? `${contest.problemsSolved}/${contest.totalProblems} solved`
                                                : contest.problemsSolved !== undefined
                                                ? `${contest.problemsSolved} solved`
                                                : 'Completed'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
