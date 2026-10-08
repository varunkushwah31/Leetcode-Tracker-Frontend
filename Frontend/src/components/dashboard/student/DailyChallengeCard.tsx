import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
    FlameIcon as Flame,
    UsersIcon as Users,
    ArrowSquareOutIcon as ExternalLink,
    CheckCircleIcon as CheckCircle,
    ArrowsClockwiseIcon as RefreshCw,
} from '@phosphor-icons/react';
import { DailyChallengeService } from '@/services/endpoints';
import type { DailyChallengeDTO } from '@/types';

interface DailyChallengeCardProps {
    classroomId?: string | null;
}

export function DailyChallengeCard({ classroomId }: Readonly<DailyChallengeCardProps>) {
    const [challenge, setChallenge] = useState<DailyChallengeDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchChallenge = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await DailyChallengeService.getDailyChallenge(classroomId || undefined);
            setChallenge(res.data);
        } catch (err) {
            console.warn('Could not load Daily Challenge:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchChallenge();
    }, [classroomId]);

    const formattedDateStr = useMemo(() => {
        if (!challenge?.date) return 'Today';
        try {
            const parts = challenge.date.split('-').map(Number);
            if (parts.length === 3) {
                const dt = new Date(parts[0], parts[1] - 1, parts[2]);
                return dt.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                });
            }
            return challenge.date;
        } catch {
            return challenge.date;
        }
    }, [challenge?.date]);

    if (isLoading) {
        return (
            <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center animate-pulse">
                            <Flame className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
                <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
            </Card>
        );
    }

    if (!challenge) {
        return null;
    }

    const isSolved = challenge.userSolvedLeetcode;

    const difficultyBadge = (diff?: string) => {
        const d = diff?.toLowerCase();
        if (d === 'easy') {
            return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        }
        if (d === 'medium') {
            return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        }
        if (d === 'hard') {
            return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        }
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    };

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/60">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <Flame className="w-5 h-5" weight="fill" />
                    </div>
                    <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>Problem of the Day</span>
                        </CardTitle>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Official LeetCode Daily Challenge • {formattedDateStr}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isSolved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                            Solved Today
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            Pending Today
                        </span>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void fetchChallenge(true)}
                        disabled={isRefreshing}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                        title="Refresh POTD"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
                {/* Problem Overview Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                #{challenge.leetcodeFrontendId || 'Daily'}
                            </span>
                            <Badge
                                variant="outline"
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${difficultyBadge(
                                    challenge.leetcodeDifficulty
                                )}`}
                            >
                                {challenge.leetcodeDifficulty || 'Medium'}
                            </Badge>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                            {challenge.leetcodeTitle || 'LeetCode Daily Challenge'}
                        </h3>

                        {challenge.leetcodeTopicTags && challenge.leetcodeTopicTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {challenge.leetcodeTopicTags.slice(0, 4).map((tag) => (
                                    <span
                                        key={tag}
                                        className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/40 font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 pt-1 sm:pt-0">
                        <a
                            href={challenge.leetcodeUrl || 'https://leetcode.com/problemset/all/'}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button
                                className={`h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                                    isSolved
                                        ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                                        : 'bg-[#5b4fff] hover:bg-[#4d40ef] text-white shadow-[#5b4fff]/20'
                                }`}
                            >
                                <span>{isSolved ? 'Review on LeetCode' : 'Solve on LeetCode'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </a>
                    </div>
                </div>

                {/* Integrated Classroom Ticker Footer */}
                {challenge.classroomTotalStudents > 0 && (
                    <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <Users className="w-4 h-4 text-[#5b4fff] shrink-0" weight="bold" />
                            <span>
                                <strong className="text-zinc-900 dark:text-white font-bold">
                                    {challenge.classroomSolvedCount} of {challenge.classroomTotalStudents}
                                </strong>{' '}
                                students in{' '}
                                <span className="font-semibold text-[#5b4fff] dark:text-[#968fff]">
                                    {challenge.classroomName || 'your classroom'}
                                </span>{' '}
                                solved today's POTD
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5 sm:w-44 shrink-0">
                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#5b4fff] rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, challenge.classroomSolvedPercentage))}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">
                                {challenge.classroomSolvedPercentage}%
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
