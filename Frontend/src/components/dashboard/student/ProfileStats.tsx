import { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { ArrowSquareOutIcon as ExternalLink, FlameIcon, TrophyIcon, TerminalIcon, GearIcon as Settings, SpinnerIcon as Loader2 } from '@phosphor-icons/react';
import type { StudentExtendedDTO } from '@/types';
import { StudentService } from '@/services/endpoints';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

interface ProfileStatsProps {
    data: StudentExtendedDTO | null;
    totalSolved: number;
    rating: number;
    onProfileUpdated?: () => void;
}

function getCodeforcesRankColor(rank?: string): string {
    if (!rank) return 'text-zinc-400';
    const r = rank.toLowerCase();
    if (r.includes('grandmaster')) return 'text-rose-500';
    if (r.includes('master')) return 'text-orange-400';
    if (r.includes('candidate')) return 'text-purple-400';
    if (r.includes('expert')) return 'text-blue-400';
    if (r.includes('specialist')) return 'text-cyan-400';
    if (r.includes('pupil')) return 'text-emerald-400';
    return 'text-zinc-400';
}

export function ProfileStats({ data, totalSolved, rating, onProfileUpdated }: Readonly<ProfileStatsProps>) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [lcUsername, setLcUsername] = useState(data?.leetcodeUsername || '');
    const [cfHandle, setCfHandle] = useState(data?.codeforcesHandle || '');
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

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
            {/* Ambient glow behind profile */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-75 h-75 bg-[#5b4fff] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-75 h-75 bg-emerald-500 opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

            <Card className="relative z-10 bg-[#111111]/60 backdrop-blur-3xl border-zinc-800/50 shadow-2xl overflow-hidden rounded-[2rem]">
                {/* Gradient subtle top border */}
                <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#5b4fff]/50 to-transparent"></div>

                <CardContent className="p-8 sm:p-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                        {/* Avatar with pulsing glow */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-[#5b4fff] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                            <Avatar className="w-28 h-28 border-[3px] border-[#1a1b2e] ring-4 ring-[#5b4fff]/20 shadow-2xl relative z-10">
                                <AvatarImage src={data.avatarUrl} className="object-cover" />
                                <AvatarFallback className="bg-linear-to-br from-[#1a1b2e] to-[#2a2b4e] text-[#968fff] text-3xl font-bold">
                                    {data.name?.substring(0, 2) || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-zinc-700 p-1.5 rounded-full z-20 shadow-lg">
                                <FlameIcon className="w-5 h-5 text-orange-500 animate-flame" />
                            </div>
                        </div>

                        <div className="flex-1 w-full text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400 tracking-tight mb-1">
                                            {data.name || 'Student'}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={handleOpenEdit}
                                            title="Edit profile handles"
                                            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                                        {/* LeetCode Pill */}
                                        {data.leetcodeUsername ? (
                                            <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-zinc-800 text-xs">
                                                <span className="text-[#ffa116] font-semibold">LC:</span>
                                                <span className="text-zinc-300">@{data.leetcodeUsername}</span>
                                                <a
                                                    href={`https://leetcode.com/${data.leetcodeUsername}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-zinc-500 hover:text-white transition-colors ml-0.5"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleOpenEdit}
                                                className="text-xs text-zinc-500 hover:text-[#ffa116] border border-dashed border-zinc-700 hover:border-[#ffa116] px-2 py-0.5 rounded-md transition-colors"
                                            >
                                                + Link LeetCode
                                            </button>
                                        )}

                                        {/* Codeforces Pill */}
                                        {data.codeforcesHandle ? (
                                            <div className="flex items-center gap-1.5 bg-[#1a1a1a] px-2.5 py-1 rounded-md border border-zinc-800 text-xs">
                                                <span className="text-cyan-400 font-semibold">CF:</span>
                                                <span className="text-zinc-300">@{data.codeforcesHandle}</span>
                                                <a
                                                    href={`https://codeforces.com/profile/${data.codeforcesHandle}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-zinc-500 hover:text-white transition-colors ml-0.5"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleOpenEdit}
                                                className="text-xs text-zinc-500 hover:text-cyan-400 border border-dashed border-zinc-700 hover:border-cyan-400 px-2 py-0.5 rounded-md transition-colors"
                                            >
                                                + Link Codeforces
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-2 bg-[#1a1b2e]/60 border border-[#5b4fff]/20 px-4 py-2 rounded-full self-center md:self-auto">
                                    <FlameIcon className="w-4 h-4 text-orange-500 animate-flame" />
                                    <span className="text-sm font-bold text-white"><span className="text-orange-400 mr-1.5">{data.consistencyStreak || 0}</span>Day Combined Streak</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                                <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-sm font-medium text-zinc-400 mb-2">LeetCode Rank</p>
                                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center">
                                        <TrophyIcon className="w-5 h-5 text-amber-500 mr-2 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                        {data.rank ? `#${Number.parseInt(data.rank).toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>

                                <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-zinc-400 mb-1">Total Solved</p>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Unified</span>
                                    </div>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] tracking-tight">
                                        {totalSolved}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        LC: <span className="text-zinc-300 font-medium">{lcSolved}</span> • CF: <span className="text-zinc-300 font-medium">{cfSolved}</span>
                                    </p>
                                </div>

                                <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-br from-[#5b4fff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-sm font-medium text-zinc-400 mb-1">LeetCode Rating</p>
                                    <p className="text-2xl sm:text-3xl font-black text-[#968fff] drop-shadow-[0_0_12px_rgba(150,143,255,0.3)] tracking-tight">
                                        {rating}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">Contest Rating</p>
                                </div>

                                <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-sm font-medium text-zinc-400 mb-1">Codeforces Rating</p>
                                    <p className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.3)] tracking-tight">
                                        {cfRating > 0 ? cfRating : 'N/A'}
                                    </p>
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
                <DialogContent className="bg-[#111111] border border-zinc-800 text-white rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <TerminalIcon className="w-5 h-5 text-[#5b4fff]" /> Link Competitive Profiles
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={editError} />

                    <div className="space-y-4 py-3">
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase font-semibold text-zinc-400">LeetCode Username</label>
                            <Input
                                value={lcUsername}
                                onChange={(e) => setLcUsername(e.target.value)}
                                placeholder="neetcode123"
                                className="bg-[#1a1a1a] border-zinc-700 text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase font-semibold text-zinc-400">Codeforces Handle</label>
                            <Input
                                value={cfHandle}
                                onChange={(e) => setCfHandle(e.target.value)}
                                placeholder="tourist"
                                className="bg-[#1a1a1a] border-zinc-700 text-white"
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
                            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800"
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