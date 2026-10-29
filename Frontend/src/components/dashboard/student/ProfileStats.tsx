import { useState, useMemo } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import {
    ArrowSquareOutIcon as ExternalLink,
    TrophyIcon,
    TerminalIcon,
    GearIcon as Settings,
    SpinnerIcon as Loader2,
    TrendUpIcon as TrendingUp,
    TrendDownIcon as TrendingDown,
    ChartLineIcon,
} from '@phosphor-icons/react';
import type { StudentExtendedDTO, CodeforcesContestHistory } from '@/types';
import { StudentService } from '@/services/endpoints';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { StreakFlame } from '@/components/ui/StreakFlame';

interface ProfileStatsProps {
    data: StudentExtendedDTO | null;
    totalSolved: number;
    rating: number;
    onProfileUpdated?: () => void;
}

function getCodeforcesRankColor(rank?: string): string {
    if (!rank) return 'text-zinc-500 dark:text-zinc-400';
    const r = rank.toLowerCase();
    if (r.includes('grandmaster')) return 'text-rose-600 dark:text-rose-500';
    if (r.includes('master')) return 'text-orange-500 dark:text-orange-400';
    if (r.includes('candidate')) return 'text-purple-600 dark:text-purple-400';
    if (r.includes('expert')) return 'text-blue-600 dark:text-blue-400';
    if (r.includes('specialist')) return 'text-cyan-600 dark:text-cyan-400';
    if (r.includes('pupil')) return 'text-emerald-600 dark:text-emerald-400';
    return 'text-zinc-500 dark:text-zinc-400';
}

interface RawCodeforcesContestItem extends Partial<CodeforcesContestHistory> {
    timestamp?: number | string;
    rating?: number;
    delta?: number;
}

export function ProfileStats({ data, totalSolved, rating, onProfileUpdated }: Readonly<ProfileStatsProps>) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [lcUsername, setLcUsername] = useState(data?.leetcodeUsername || '');
    const [cfHandle, setCfHandle] = useState(data?.codeforcesHandle || '');
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const lcDelta = useMemo(() => {
        if (!data?.contestHistory || data.contestHistory.length === 0) return null;
        const sorted = [...data.contestHistory].sort((a, b) => a.timestamp - b.timestamp);
        const latestIdx = sorted.length - 1;
        const latest = sorted[latestIdx];
        const prevRating = latestIdx > 0 ? sorted[latestIdx - 1].rating : 1500;
        return Math.round(latest.rating) - Math.round(prevRating);
    }, [data?.contestHistory]);

    const cfDelta = useMemo(() => {
        if (!data?.codeforcesContestHistory || data.codeforcesContestHistory.length === 0) return null;
        const sorted = [...data.codeforcesContestHistory].sort((a, b) => {
            const rawA = a as RawCodeforcesContestItem;
            const rawB = b as RawCodeforcesContestItem;
            const timeA = Number(rawA.ratingUpdateTimeSeconds ?? rawA.timestamp ?? 0);
            const timeB = Number(rawB.ratingUpdateTimeSeconds ?? rawB.timestamp ?? 0);
            return timeA - timeB;
        });
        const latest = sorted.at(-1)!;
        const rawLatest = latest as RawCodeforcesContestItem;
        if (rawLatest.oldRating !== undefined && rawLatest.oldRating !== null && !Number.isNaN(rawLatest.oldRating)) {
            const cur = rawLatest.newRating ?? rawLatest.rating ?? 0;
            return cur - rawLatest.oldRating;
        }
        if (rawLatest.delta !== undefined && !Number.isNaN(rawLatest.delta)) {
            return Number(rawLatest.delta);
        }
        if (sorted.length > 1) {
            const prev = sorted.at(-2)! as RawCodeforcesContestItem;
            const cur = rawLatest.newRating ?? rawLatest.rating ?? 0;
            const prevR = prev.newRating ?? prev.rating ?? 0;
            return cur - prevR;
        }
        return null;
    }, [data?.codeforcesContestHistory]);

    if (!data) return null;

    const handleOpenEdit = () => {
        setLcUsername(data.leetcodeUsername || '');
        setCfHandle(data.codeforcesHandle || '');
        setEditError(null);
        setIsEditOpen(true);
    };

    const handleSaveHandles = async () => {
        const lcTrim = lcUsername.trim();
        const cfTrim = cfHandle.trim();
        if (!lcTrim && !cfTrim) {
            setEditError('At least one platform username (LeetCode or Codeforces) is required.');
            return;
        }
        setIsSaving(true);
        setEditError(null);
        try {
            await StudentService.updateHandles(lcTrim || undefined, cfTrim || undefined);
            setIsEditOpen(false);
            if (onProfileUpdated) {
                onProfileUpdated();
            }
        } catch (err: unknown) {
            setEditError(err instanceof Error ? err.message : 'Failed to update handles');
        } finally {
            setIsSaving(false);
        }
    };

    const cfRating = data.codeforcesRating || 0;
    const cfRank = data.codeforcesRank || 'Unrated';
    const cfRankColor = getCodeforcesRankColor(cfRank);
    const lcSolved = data.leetcodeSolvedCount ?? Math.max(0, totalSolved - (data.codeforcesSolvedCount || 0));
    const cfSolved = data.codeforcesSolvedCount || 0;

    return (
        <div className="mb-8 relative">
            <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
                <CardContent className="p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6">

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <Avatar className="w-18 h-18 sm:w-20 sm:h-20 border-2 border-zinc-200/80 dark:border-zinc-700/80 shadow-xs relative z-10">
                                <AvatarImage src={data.avatarUrl} className="object-cover" />
                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xl sm:text-2xl font-extrabold">
                                    {data.name?.substring(0, 2) || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-full z-20 shadow-xs flex items-center justify-center">
                                <StreakFlame className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
                                            {data.name || 'Student'}
                                        </h2>
                                        {data.authProvider === 'GOOGLE' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80" title="Signed in with Google">
                                                Google
                                            </span>
                                        )}
                                        {data.authProvider === 'GITHUB' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80" title="Signed in with GitHub">
                                                GitHub
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleOpenEdit}
                                            title="Edit profile handles"
                                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                        {/* LeetCode Pill */}
                                        {data.leetcodeUsername ? (
                                            <div className="inline-flex items-center gap-1.5 bg-zinc-100/90 dark:bg-[#141414] px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-xs shadow-2xs group hover:border-amber-500/30 transition-colors">
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-[#ffa116] border border-amber-500/20 tracking-wider">
                                                    LC
                                                </span>
                                                <span className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
                                                    @{data.leetcodeUsername}
                                                </span>
                                                <a
                                                    href={`https://leetcode.com/${data.leetcodeUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors ml-0.5"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleOpenEdit}
                                                className="text-xs font-medium text-zinc-500 hover:text-[#ffa116] border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#ffa116] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                            >
                                                + Link LeetCode
                                            </button>
                                        )}

                                        {/* Codeforces Pill */}
                                        {data.codeforcesHandle ? (
                                            <div className="inline-flex items-center gap-1.5 bg-zinc-100/90 dark:bg-[#141414] px-2.5 py-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 text-xs shadow-2xs group hover:border-cyan-500/30 transition-colors">
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 tracking-wider">
                                                    CF
                                                </span>
                                                <span className="font-mono text-xs font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
                                                    @{data.codeforcesHandle}
                                                </span>
                                                <a
                                                    href={`https://codeforces.com/profile/${data.codeforcesHandle}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors ml-0.5"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleOpenEdit}
                                                className="text-xs font-medium text-zinc-500 hover:text-cyan-500 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-cyan-500 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                            >
                                                + Link Codeforces
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Combined Streak Pill */}
                                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/90 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs self-center md:self-auto">
                                    <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                        <StreakFlame className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-sm sm:text-base font-black text-zinc-900 dark:text-white tabular-nums tracking-tight">
                                            {data.consistencyStreak || 0}
                                        </span>
                                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                                            Day Streak
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hidden sm:inline-block">
                                            Combined
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 4 Stat Tiles Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
                                {/* LeetCode Rank */}
                                <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60 transition-colors">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">LeetCode Rank</span>
                                        <TrophyIcon className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        {data.rank && (
                                            <span className="text-sm sm:text-base font-bold text-zinc-400 dark:text-zinc-500 select-none">
                                                #
                                            </span>
                                        )}
                                        <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums truncate">
                                            {data.rank ? Number.parseInt(data.rank).toLocaleString() : 'N/A'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                                        Global Standing
                                    </p>
                                </div>

                                {/* Total Solved */}
                                <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60 transition-colors">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Solved</span>
                                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Unified
                                        </span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                        {totalSolved}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                                        <span className="inline-flex items-center gap-1 font-mono">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">LC: {lcSolved}</span>
                                        </span>
                                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                        <span className="inline-flex items-center gap-1 font-mono">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
                                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">CF: {cfSolved}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* LeetCode Rating */}
                                <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60 transition-colors">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">LeetCode Rating</span>
                                        <ChartLineIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                            {rating > 0 ? rating : 'Unrated'}
                                        </span>
                                        {lcDelta !== null && (
                                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                                                lcDelta > 0
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : lcDelta < 0
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                            }`}>
                                                {lcDelta > 0 ? (
                                                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                ) : lcDelta < 0 ? (
                                                    <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                                ) : null}
                                                {lcDelta > 0 ? `+${lcDelta}` : lcDelta}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                                        Contest Rating
                                    </p>
                                </div>

                                {/* Codeforces Rating */}
                                <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60 transition-colors">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Codeforces Rating</span>
                                        <TerminalIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                            {cfRating > 0 ? cfRating : 'N/A'}
                                        </span>
                                        {cfDelta !== null && (
                                            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                                                cfDelta > 0
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : cfDelta < 0
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                            }`}>
                                                {cfDelta > 0 ? (
                                                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                ) : cfDelta < 0 ? (
                                                    <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                                ) : null}
                                                {cfDelta > 0 ? `+${cfDelta}` : cfDelta}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-[11px] font-bold uppercase tracking-wider mt-1 truncate ${cfRankColor}`}>
                                        {cfRank}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Handle Management Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                            <TerminalIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Link Competitive Profiles
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={editError} />

                    <div className="space-y-4 py-3">
                        <div className="space-y-1.5">
                            <label htmlFor="edit-lc-username" className="text-xs uppercase font-semibold text-zinc-600 dark:text-zinc-400">LeetCode Username</label>
                            <Input
                                id="edit-lc-username"
                                value={lcUsername}
                                onChange={(e) => setLcUsername(e.target.value)}
                                placeholder="neetcode123"
                                className="bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="edit-cf-handle" className="text-xs uppercase font-semibold text-zinc-600 dark:text-zinc-400">Codeforces Handle</label>
                            <Input
                                id="edit-cf-handle"
                                value={cfHandle}
                                onChange={(e) => setCfHandle(e.target.value)}
                                placeholder="tourist"
                                className="bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white"
                            />
                            <p className="text-xs text-zinc-500">
                                Link either LeetCode, Codeforces, or both. You need at least one platform linked to your account.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            className="bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveHandles}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Save & Sync
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
