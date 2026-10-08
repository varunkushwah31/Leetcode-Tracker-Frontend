import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import {
    TrophyIcon as Trophy,
    ClockIcon as Clock,
    ArrowSquareOutIcon as ExternalLink,
    ArrowsClockwiseIcon as RefreshCw,
} from '@phosphor-icons/react';
import { ContestScheduleService } from '@/services/endpoints';
import type { UpcomingContestDTO } from '@/types';

export function UpcomingContestsCard() {
    const [contests, setContests] = useState<UpcomingContestDTO[]>([]);
    const [platformFilter, setPlatformFilter] = useState<'ALL' | 'LEETCODE' | 'CODEFORCES'>('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [nowSeconds, setNowSeconds] = useState(Math.floor(Date.now() / 1000));

    const fetchContests = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await ContestScheduleService.getUpcomingContests(platformFilter);
            setContests(res.data);
        } catch (err) {
            console.warn('Could not load upcoming contests:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchContests();
    }, [platformFilter]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNowSeconds(Math.floor(Date.now() / 1000));
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const formatCountdown = (startSec: number, durationSec: number, phase: string) => {
        const diff = startSec - nowSeconds;
        if (phase === 'CODING' || (diff <= 0 && diff + durationSec > 0)) {
            return { text: 'LIVE NOW', isLive: true };
        }
        if (diff <= 0) {
            return { text: 'Ended', isLive: false };
        }

        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);

        if (days > 0) {
            return { text: `in ${days}d ${hours}h`, isLive: false };
        }
        if (hours > 0) {
            return { text: `in ${hours}h ${minutes}m`, isLive: false };
        }
        return { text: `in ${minutes}m`, isLive: false };
    };

    const formatStartTime = (sec: number) => {
        const date = new Date(sec * 1000);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (sec: number) => {
        const hours = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        if (mins === 0) return `${hours}h`;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    };

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Upcoming Contests</span>
                </CardTitle>

                {/* Platform Filters matching UnifiedContestHistory style */}
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800/50">
                    <button
                        type="button"
                        onClick={() => setPlatformFilter('ALL')}
                        className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            platformFilter === 'ALL'
                                ? 'bg-[#5b4fff] text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlatformFilter('LEETCODE')}
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            platformFilter === 'LEETCODE'
                                ? 'bg-amber-500/15 dark:bg-[#ffa116]/20 text-amber-700 dark:text-[#ffa116] border border-amber-500/30 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-zinc-200'
                        }`}
                    >
                        LC
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlatformFilter('CODEFORCES')}
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            platformFilter === 'CODEFORCES'
                                ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-zinc-200'
                        }`}
                    >
                        CF
                    </button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void fetchContests(true)}
                        disabled={isRefreshing}
                        className="h-6 w-6 ml-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                        title="Refresh Contests"
                    >
                        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-3">
                <ScrollArea className="h-64 pr-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="space-y-2.5">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 animate-pulse border border-zinc-200/50 dark:border-zinc-800/40"
                                />
                            ))}
                        </div>
                    ) : contests.length === 0 ? (
                        <p className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-8">
                            No upcoming contests found.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            {contests.map((contest) => {
                                const countdown = formatCountdown(
                                    contest.startTimeSeconds,
                                    contest.durationSeconds,
                                    contest.phase
                                );
                                const isLeetCode = contest.platform === 'LEETCODE';

                                return (
                                    <a
                                        key={contest.id}
                                        href={contest.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-zinc-50/80 dark:bg-[#1a1a1a]/40 hover:bg-zinc-100/90 dark:hover:bg-[#222228] border border-zinc-200/80 dark:border-zinc-800/50 hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 rounded-xl transition-all cursor-pointer group no-underline text-inherit"
                                    >
                                        <div className="min-w-0 flex-1 pr-3">
                                            <div className="flex items-center gap-1.5 mb-1 min-w-0">
                                                <span
                                                    className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                                                        isLeetCode
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                    }`}
                                                >
                                                    {isLeetCode ? 'LC' : 'CF'}
                                                </span>
                                                <p
                                                    className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 tracking-tight truncate group-hover:text-[#5b4fff] dark:group-hover:text-[#968fff] transition-colors"
                                                    title={contest.title}
                                                >
                                                    {contest.title}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                                {countdown.isLive ? (
                                                    <span className="font-extrabold text-rose-500 dark:text-rose-400 flex items-center gap-1 shrink-0">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                        LIVE NOW
                                                    </span>
                                                ) : (
                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3 text-emerald-500" />
                                                        {countdown.text}
                                                    </span>
                                                )}
                                                <span className="text-zinc-400 dark:text-zinc-600 shrink-0">•</span>
                                                <span className="truncate">{formatStartTime(contest.startTimeSeconds)}</span>
                                                <span className="text-zinc-400 dark:text-zinc-600 shrink-0">•</span>
                                                <span className="shrink-0">{formatDuration(contest.durationSeconds)}</span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-[#5b4fff] dark:group-hover:text-[#968fff] group-hover:bg-[#5b4fff]/10 transition-colors">
                                            <span>Register</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
