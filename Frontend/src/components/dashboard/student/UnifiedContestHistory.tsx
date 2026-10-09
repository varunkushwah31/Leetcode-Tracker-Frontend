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
        // Sort chronologically ascending to calculate deltas accurately
        const sorted = [...(contestHistory || [])].sort((a, b) => {
            const timeA = typeof a.timestamp === 'number' ? a.timestamp : Number(a.timestamp) || 0;
            const timeB = typeof b.timestamp === 'number' ? b.timestamp : Number(b.timestamp) || 0;
            return timeA - timeB;
        });

        return sorted.map((c, idx) => {
            const currentRating = Math.round(Number(c.rating) || 0);
            const prevRating = idx > 0 ? Math.round(Number(sorted[idx - 1].rating) || 1500) : 1500;
            const delta = currentRating > 0 ? currentRating - prevRating : undefined;

            return {
                id: `lc-${c.title}-${c.timestamp || idx}`,
                platform: 'LEETCODE' as const,
                title: c.title,
                timestamp: typeof c.timestamp === 'number' ? c.timestamp : Number(c.timestamp) || 0,
                rank: c.ranking || 0,
                rating: currentRating,
                delta,
                problemsSolved: c.problemsSolved,
                totalProblems: c.totalProblems,
            };
        });
    }, [contestHistory]);

    const cfItems: UnifiedContestItem[] = useMemo(() => {
        // Sort chronologically ascending to calculate deltas accurately
        const sorted = [...(codeforcesContestHistory || [])].sort((a, b) => {
            const timeA = a.ratingUpdateTimeSeconds || (a as any).timestamp || 0;
            const timeB = b.ratingUpdateTimeSeconds || (b as any).timestamp || 0;
            return (typeof timeA === 'number' ? timeA : Number(timeA) || 0) - (typeof timeB === 'number' ? timeB : Number(timeB) || 0);
        });

        return sorted.map((c, idx) => {
            const currentRating = c.newRating ?? (c as any).rating ?? (c as any).new_rating ?? 0;
            const prevRating = idx > 0
                ? (sorted[idx - 1].newRating ?? (sorted[idx - 1] as any).rating ?? (sorted[idx - 1] as any).new_rating ?? currentRating)
                : (c.oldRating ?? (c as any).old_rating ?? currentRating);

            // Compute delta:
            // 1. If oldRating is explicitly provided, use currentRating - oldRating
            // 2. Or if explicit delta property exists, use it
            // 3. Otherwise if contest is not the first, compute difference from previous contest in chronological sequence
            let delta: number | undefined;
            if (c.oldRating !== undefined && c.oldRating !== null && !Number.isNaN(Number(c.oldRating))) {
                delta = currentRating - Number(c.oldRating);
            } else if ((c as any).delta !== undefined && !Number.isNaN(Number((c as any).delta))) {
                delta = Number((c as any).delta);
            } else if (idx > 0) {
                delta = currentRating - prevRating;
            } else {
                delta = 0;
            }

            return {
                id: `cf-${c.contestId || idx}-${c.ratingUpdateTimeSeconds || (c as any).timestamp || idx}`,
                platform: 'CODEFORCES' as const,
                title: c.contestName || (c as any).title || 'Codeforces Round',
                timestamp: typeof (c.ratingUpdateTimeSeconds || (c as any).timestamp) === 'number'
                    ? (c.ratingUpdateTimeSeconds || (c as any).timestamp)
                    : Number(c.ratingUpdateTimeSeconds || (c as any).timestamp) || 0,
                rank: c.rank || 0,
                rating: currentRating,
                delta,
            };
        });
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
            <CardHeader className="pb-3">
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

            <CardContent className="p-4 pt-0 overflow-hidden">
                <ScrollArea className={`${scrollHeightClass} pr-4 w-full [&>div]:!block [&>div]:w-full overflow-hidden`}>
                    <div className="flex flex-col gap-2.5 w-full min-w-0">
                        {displayedItems.map((contest) => (
                            <div
                                key={contest.id}
                                className="flex items-center justify-between p-3 bg-zinc-50/80 dark:bg-[#1a1a1a]/40 hover:bg-zinc-100/90 dark:hover:bg-[#1a1a1a]/80 border border-zinc-200/80 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700/60 rounded-xl transition-all group overflow-hidden w-full min-w-0"
                            >
                                <div className="min-w-0 flex-1 pr-2 overflow-hidden">
                                    <div className="flex items-center gap-1.5 mb-1 min-w-0 overflow-hidden">
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
                                            className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors min-w-0 flex-1"
                                            title={contest.title}
                                        >
                                            {contest.title}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate min-w-0">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                                            Rank #{contest.rank > 0 ? contest.rank.toLocaleString() : 'N/A'}
                                        </span>
                                        <span className="text-zinc-400 dark:text-zinc-600 shrink-0">•</span>
                                        <span className="text-zinc-500 shrink-0">{formatDate(contest.timestamp)}</span>
                                        {contest.problemsSolved !== undefined && contest.totalProblems !== undefined && (
                                            <>
                                                <span className="text-zinc-400 dark:text-zinc-600 shrink-0">•</span>
                                                <span className="text-zinc-600 dark:text-zinc-400 font-medium truncate min-w-0">
                                                    {contest.problemsSolved}/{contest.totalProblems} solved
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0 min-w-[56px] flex flex-col items-end justify-center self-center pl-1">
                                    <p
                                        className={`text-sm font-bold tracking-tight whitespace-nowrap ${
                                            contest.platform === 'CODEFORCES'
                                                ? 'text-cyan-600 dark:text-cyan-400'
                                                : 'text-amber-600 dark:text-amber-500'
                                        }`}
                                    >
                                        {contest.rating > 0 ? contest.rating : '—'}
                                    </p>
                                    {contest.delta !== undefined && !Number.isNaN(contest.delta) ? (
                                        <p
                                            className={`text-[11px] font-bold tracking-tight whitespace-nowrap ${
                                                contest.delta > 0
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : contest.delta < 0
                                                    ? 'text-rose-600 dark:text-rose-400'
                                                    : 'text-zinc-500 dark:text-zinc-400'
                                            }`}
                                        >
                                            {contest.delta > 0 ? `+${contest.delta}` : contest.delta}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
