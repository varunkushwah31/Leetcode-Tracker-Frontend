import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
    FlameIcon as Flame,
    UsersIcon as Users,
    ArrowSquareOutIcon as ExternalLink,
    CheckCircleIcon as CheckCircle,
    ArrowsClockwiseIcon as RefreshCw,
    SparkleIcon as Sparkles,
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
    const [activeTab, setActiveTab] = useState<'LEETCODE' | 'CODEFORCES'>('LEETCODE');

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

    if (isLoading) {
        return (
            <Card className="bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center animate-pulse">
                            <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
                <div className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-xl animate-pulse" />
            </Card>
        );
    }

    if (!challenge) {
        return null;
    }

    const isLcSolved = challenge.userSolvedLeetcode;
    const isCfSolved = challenge.userSolvedCodeforces;

    const difficultyColor = (diff?: string) => {
        switch (diff?.toLowerCase()) {
            case 'easy':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'medium':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'hard':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            default:
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        }
    };

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            {/* Top glowing accent bar */}
            <div className="h-1 w-full bg-linear-to-r from-orange-500 via-amber-500 to-[#5b4fff]" />

            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-xs">
                            <Flame className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                    Problem of the Day
                                </CardTitle>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                    <Sparkles className="w-3 h-3" /> Daily Pick
                                </span>
                            </div>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Official challenges for {challenge.date}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('LEETCODE')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'LEETCODE'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <span>LeetCode</span>
                                {isLcSolved && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('CODEFORCES')}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'CODEFORCES'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                <span>Codeforces</span>
                                {isCfSolved && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void fetchChallenge(true)}
                            disabled={isRefreshing}
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            title="Refresh POTD"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
                {/* Classroom Ticker Banner */}
                {challenge.classroomTotalStudents > 0 ? (
                    <div className="rounded-xl p-4 bg-linear-to-r from-indigo-50/80 via-purple-50/50 to-blue-50/80 dark:from-[#5b4fff]/10 dark:via-purple-950/20 dark:to-blue-950/20 border border-indigo-200/70 dark:border-[#5b4fff]/20 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                                <Users className="w-4 h-4 text-[#5b4fff]" />
                                <span>
                                    {challenge.classroomSolvedCount} of {challenge.classroomTotalStudents} students in{' '}
                                    <span className="font-extrabold text-[#5b4fff] dark:text-[#968fff]">
                                        {challenge.classroomName || 'your classroom'}
                                    </span>{' '}
                                    have solved today's POTD!
                                </span>
                            </div>
                            <span className="text-xs font-extrabold text-[#5b4fff] dark:text-[#968fff]">
                                {challenge.classroomSolvedPercentage}%
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-[#5b4fff] to-emerald-500 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${Math.min(100, Math.max(0, challenge.classroomSolvedPercentage))}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-zinc-400" />
                            <span>Classroom ticker active when enrolled in a classroom</span>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-400">Collaborative streak</span>
                    </div>
                )}

                {/* Active Tab Problem Details */}
                {activeTab === 'LEETCODE' ? (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#13141f]/50 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="font-bold border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    >
                                        #{challenge.leetcodeFrontendId || 'Daily'}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={`font-bold ${difficultyColor(challenge.leetcodeDifficulty)}`}
                                    >
                                        {challenge.leetcodeDifficulty || 'Medium'}
                                    </Badge>
                                    {isLcSolved ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> Solved Today
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold"
                                        >
                                            Pending Today
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                                    {challenge.leetcodeTitle || 'LeetCode Daily Challenge'}
                                </h3>
                                {challenge.leetcodeTopicTags && challenge.leetcodeTopicTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {challenge.leetcodeTopicTags.slice(0, 4).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                <a
                                    href={challenge.leetcodeUrl || `https://leetcode.com/problemset/all/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        className={`w-full sm:w-auto h-9 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                            isLcSolved
                                                ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                                                : 'bg-[#5b4fff] hover:bg-[#4b3feb] text-white shadow-[#5b4fff]/20'
                                        }`}
                                    >
                                        <span>{isLcSolved ? 'Review on LeetCode' : 'Solve on LeetCode'}</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#13141f]/50 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/60">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="font-bold border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                                    >
                                        {challenge.codeforcesContestId
                                            ? `${challenge.codeforcesContestId}${challenge.codeforcesIndex || ''}`
                                            : 'CF Pick'}
                                    </Badge>
                                    {challenge.codeforcesRating ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold"
                                        >
                                            {challenge.codeforcesRating} Rating
                                        </Badge>
                                    ) : null}
                                    {isCfSolved ? (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> Solved Today
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold"
                                        >
                                            Pending Today
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                                    {challenge.codeforcesTitle || 'Codeforces Daily Pick'}
                                </h3>
                                {challenge.codeforcesTags && challenge.codeforcesTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {challenge.codeforcesTags.slice(0, 4).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                                <a
                                    href={challenge.codeforcesUrl || `https://codeforces.com/problemset`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto"
                                >
                                    <Button
                                        className={`w-full sm:w-auto h-9 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                                            isCfSolved
                                                ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                                        }`}
                                    >
                                        <span>{isCfSolved ? 'Review on Codeforces' : 'Solve on Codeforces'}</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
