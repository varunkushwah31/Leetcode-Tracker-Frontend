import { useState, useMemo } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { ArrowSquareOutIcon as ExternalLink, TrophyIcon, TerminalIcon, GearIcon as Settings, SpinnerIcon as Loader2, TrendUpIcon as TrendingUp, TrendDownIcon as TrendingDown } from '@phosphor-icons/react';
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
        <div className="mb-10 relative">
            {/* Ambient glow behind profile in dark mode only */}
            <div className="hidden dark:block">
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-75 h-75 bg-[#5b4fff] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-75 h-75 bg-emerald-500 opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
            </div>

            <Card className="relative z-10 bg-white dark:bg-[#111111]/60 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-md dark:shadow-2xl overflow-hidden rounded-[2rem] transition-colors duration-200">
                {/* Gradient subtle top border */}
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#5b4fff]/40 dark:via-[#5b4fff]/50 to-transparent"></div>

                <CardContent className="p-4.5 sm:p-8 lg:p-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">

                        {/* Avatar with pulsing glow */}
                        <div className="relative group shrink-0">
                            <div className="absolute inset-0 bg-[#5b4fff] rounded-full blur-2xl opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity duration-700"></div>
                            <Avatar className="w-20 h-20 sm:w-28 sm:h-28 border-[3px] border-white dark:border-zinc-800 ring-4 ring-[#5b4fff]/10 dark:ring-[#5b4fff]/20 shadow-xl dark:shadow-2xl relative z-10">
                                <AvatarImage src={data.avatarUrl} className="object-cover" />
                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-[#5b4fff] dark:text-[#968fff] text-2xl sm:text-3xl font-bold">
                                    {data.name?.substring(0, 2) || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-white dark:bg-zinc-900 border border-orange-200/90 dark:border-orange-500/30 p-1 sm:p-1.5 rounded-full z-20 shadow-md ring-2 ring-orange-500/10 dark:ring-orange-500/20 flex items-center justify-center">
                                <StreakFlame className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                        </div>

                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 sm:mb-6">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3">
                                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-linear-to-r dark:from-white dark:to-zinc-400 tracking-tight mb-1">
                                            {data.name || 'Student'}
                                        </h2>
                                        {data.authProvider === 'GOOGLE' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60" title="Signed in with Google">
                                                Google
                                            </span>
                                        )}
                                        {data.authProvider === 'GITHUB' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700" title="Signed in with GitHub">
                                                GitHub
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleOpenEdit}
                                            title="Edit profile handles"
                                            className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer interactive-press hover:rotate-45"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mt-1">
                                        {/* LeetCode Pill */}
                                        {data.leetcodeUsername ? (
                                            <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-zinc-900/60 px-2.5 py-1 rounded-md border border-amber-500/20 dark:border-zinc-800 text-xs interactive-press">
                                                <span className="text-[#ffa116] font-semibold">LC:</span>
                                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">@{data.leetcodeUsername}</span>
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
                                                className="text-xs text-zinc-500 hover:text-[#ffa116] border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#ffa116] px-2 py-0.5 rounded-md transition-colors cursor-pointer interactive-press"
                                            >
                                                + Link LeetCode
                                            </button>
                                        )}

                                        {/* Codeforces Pill */}
                                        {data.codeforcesHandle ? (
                                            <div className="flex items-center gap-1.5 bg-cyan-500/10 dark:bg-zinc-900/60 px-2.5 py-1 rounded-md border border-cyan-500/20 dark:border-zinc-800 text-xs interactive-press">
                                                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">CF:</span>
                                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">@{data.codeforcesHandle}</span>
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
                                                className="text-xs text-zinc-500 hover:text-cyan-500 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-cyan-500 px-2 py-0.5 rounded-md transition-colors cursor-pointer interactive-press"
                                            >
                                                + Link Codeforces
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-2 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full self-center md:self-auto shadow-xs dark:shadow-none hover:scale-105 transition-transform duration-200 cursor-default">
                                    <StreakFlame className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white"><span className="text-orange-500 dark:text-orange-400 mr-1.5">{data.consistencyStreak || 0}</span>Day Combined Streak</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-6 sm:mt-8">
                                <div className="bg-zinc-50/90 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 p-3.5 sm:p-5 rounded-2xl hover:bg-zinc-100/90 dark:hover:bg-zinc-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[#5b4fff]/5 group relative overflow-hidden shadow-xs dark:shadow-none">
                                    <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 sm:mb-2">LeetCode Rank</p>
                                    <p className="text-lg sm:text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center transition-transform duration-300 group-hover:scale-105 origin-left truncate">
                                        <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mr-1.5 sm:mr-2 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                        {data.rank ? `#${Number.parseInt(data.rank).toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-zinc-50/90 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 p-3.5 sm:p-5 rounded-2xl hover:bg-zinc-100/90 dark:hover:bg-zinc-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[#5b4fff]/5 group relative overflow-hidden shadow-xs dark:shadow-none">
                                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Total Solved</p>
                                        <span className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Unified</span>
                                    </div>
                                    <p className="text-lg sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.25)] tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left">
                                        {totalSolved}
                                    </p>
                                    <p className="text-[11px] sm:text-xs text-zinc-500 mt-1 truncate">
                                        LC: <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{lcSolved}</span> • CF: <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{cfSolved}</span>
                                    </p>
                                </div>

                                <div className="bg-zinc-50/90 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 p-3.5 sm:p-5 rounded-2xl hover:bg-zinc-100/90 dark:hover:bg-zinc-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[#5b4fff]/5 group relative overflow-hidden shadow-xs dark:shadow-none">
                                    <div className="absolute inset-0 bg-linear-to-br from-[#5b4fff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">LeetCode Rating</p>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <p className="text-lg sm:text-2xl lg:text-3xl font-black text-[#5b4fff] dark:text-[#968fff] drop-shadow-[0_0_12px_rgba(150,143,255,0.25)] tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left">
                                            {rating}
                                        </p>
                                        {lcDelta !== null && (
                                            <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md border ${
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
                                    <p className="text-xs text-zinc-500 mt-1">Contest Rating</p>
                                </div>

                                <div className="bg-zinc-50/90 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 p-3.5 sm:p-5 rounded-2xl hover:bg-zinc-100/90 dark:hover:bg-zinc-800/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[#5b4fff]/5 group relative overflow-hidden shadow-xs dark:shadow-none">
                                    <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Codeforces Rating</p>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <p className="text-lg sm:text-2xl lg:text-3xl font-black text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.25)] tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left">
                                            {cfRating > 0 ? cfRating : 'N/A'}
                                        </p>
                                        {cfDelta !== null && (
                                            <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md border ${
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
                                    <p className={`text-xs capitalize font-semibold mt-1 ${cfRankColor}`}>
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
                            <TerminalIcon className="w-5 h-5 text-[#5b4fff]" /> Link Competitive Profiles
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
                            className="bg-[#5b4fff] hover:bg-[#4a3ecc] text-white"
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
