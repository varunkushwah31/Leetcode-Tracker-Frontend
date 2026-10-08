import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
    TrophyIcon as Trophy,
    ClockIcon as Clock,
    ArrowSquareOutIcon as ExternalLink,
    CalendarBlankIcon as Calendar,
    ArrowsClockwiseIcon as RefreshCw,
    BroadcastIcon as Broadcast,
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

    // Live countdown ticker every 10 seconds
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
            {/* Top glowing accent bar */}
            <div className="h-1 w-full bg-linear-to-r from-blue-500 via-[#5b4fff] to-purple-600" />

            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span>Upcoming Contests</span>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void fetchContests(true)}
                        disabled={isRefreshing}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Refresh Contests"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1.5 pt-2">
                    {(['ALL', 'LEETCODE', 'CODEFORCES'] as const).map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setPlatformFilter(filter)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                platformFilter === filter
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            {filter === 'ALL' ? 'All Platforms' : filter === 'LEETCODE' ? 'LeetCode' : 'Codeforces'}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="pt-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {isLoading ? (
                    <div className="space-y-3 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
                        ))}
                    </div>
                ) : contests.length === 0 ? (
                    <div className="py-8 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        No scheduled contests found for selected platform.
                    </div>
                ) : (
                    contests.slice(0, 5).map((contest) => {
                        const countdown = formatCountdown(
                            contest.startTimeSeconds,
                            contest.durationSeconds,
                            contest.phase
                        );
                        const isLeetCode = contest.platform === 'LEETCODE';

                        return (
                            <div
                                key={contest.id}
                                className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 group"
                            >
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                                isLeetCode
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                            }`}
                                        >
                                            {isLeetCode ? 'LeetCode' : 'Codeforces'}
                                        </Badge>

                                        {countdown.isLive ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                                                <Broadcast className="w-3 h-3" /> Live
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                                                <Clock className="w-3 h-3 text-[#5b4fff]" />
                                                <span>{countdown.text}</span>
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#5b4fff] transition-colors">
                                        {contest.title}
                                    </h4>

                                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{formatStartTime(contest.startTimeSeconds)}</span>
                                        </span>
                                        <span>•</span>
                                        <span>{formatDuration(contest.durationSeconds)}</span>
                                    </div>
                                </div>

                                <a
                                    href={contest.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 pt-1"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2.5 rounded-xl text-xs font-semibold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-[#5b4fff] hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 cursor-pointer flex items-center gap-1 shadow-xs"
                                    >
                                        <span>Register</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </a>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
