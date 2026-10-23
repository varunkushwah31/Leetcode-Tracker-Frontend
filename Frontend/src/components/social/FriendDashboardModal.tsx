import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import {
    SwordIcon as Swords,
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    BookOpenIcon as BookOpen,
    ArrowSquareOutIcon as ExternalLink,
    SpinnerIcon as Loader2,
    UsersIcon as Users,
    ClockIcon as Clock,
    SparkleIcon as Sparkles,
    MagnifyingGlassIcon as Search,
    MedalIcon as Medal
} from '@phosphor-icons/react';
import { SocialService } from '../../services/endpoints';
import { formatProblemTitle, getProblemPlatform } from '@/lib/problemFormatter';
import type { FriendComparisonDTO } from '@/types';

interface FriendDashboardModalProps {
    friendId: string | null;
    open: boolean;
    onClose: () => void;
    onChallengePvp?: (friendId: string, friendName: string) => void;
}

export function FriendDashboardModal({ friendId, open, onClose, onChallengePvp }: FriendDashboardModalProps) {
    const [comparison, setComparison] = useState<FriendComparisonDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'comparison' | 'submissions'>('overview');
    const [searchFilter, setSearchFilter] = useState('');

    useEffect(() => {
        if (!open || !friendId) return;

        let isMounted = true;
        setIsLoading(true);
        setError(null);
        setSearchFilter('');

        SocialService.getFriendDashboard(friendId)
            .then(res => {
                if (isMounted) setComparison(res.data);
            })
            .catch(err => {
                if (isMounted) setError(err.response?.data?.message || 'Failed to load friend dashboard.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, [open, friendId]);

    const profile = comparison?.friendProfile;

    const easyCount = profile?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = profile?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = profile?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = profile?.totalSolved ?? (easyCount + medCount + hardCount);
    const progressTotal = Math.max(totalSolved, 1);

    const easyPct = Math.round((easyCount / progressTotal) * 100);
    const medPct = Math.round((medCount / progressTotal) * 100);
    const hardPct = Math.round((hardCount / progressTotal) * 100);

    // Head-to-head calculations
    const userWins = comparison?.userPvpWinsAgainstFriend ?? 0;
    const friendWins = comparison?.friendPvpWinsAgainstUser ?? 0;
    const pvpDraws = comparison?.pvpDraws ?? 0;
    const totalMatches = userWins + friendWins + pvpDraws;
    const winRate = totalMatches > 0 ? Math.round((userWins / totalMatches) * 100) : 0;

    // Filtered lists for peer learning
    const filteredFriendOnly = useMemo(() => {
        if (!comparison?.friendOnlySolved) return [];
        if (!searchFilter.trim()) return comparison.friendOnlySolved;
        const q = searchFilter.toLowerCase();
        return comparison.friendOnlySolved.filter(s =>
            s.toLowerCase().includes(q) || formatProblemTitle(s).toLowerCase().includes(q)
        );
    }, [comparison?.friendOnlySolved, searchFilter]);

    const filteredMutual = useMemo(() => {
        if (!comparison?.mutualSolved) return [];
        if (!searchFilter.trim()) return comparison.mutualSolved;
        const q = searchFilter.toLowerCase();
        return comparison.mutualSolved.filter(s =>
            s.toLowerCase().includes(q) || formatProblemTitle(s).toLowerCase().includes(q)
        );
    }, [comparison?.mutualSolved, searchFilter]);

    const filteredUserOnly = useMemo(() => {
        if (!comparison?.userOnlySolved) return [];
        if (!searchFilter.trim()) return comparison.userOnlySolved;
        const q = searchFilter.toLowerCase();
        return comparison.userOnlySolved.filter(s =>
            s.toLowerCase().includes(q) || formatProblemTitle(s).toLowerCase().includes(q)
        );
    }, [comparison?.userOnlySolved, searchFilter]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-2xl rounded-3xl relative">
                {/* Subtle top ambient glow line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#5b4fff]/60 to-transparent pointer-events-none" />

                {/* Dialog Header with friend overview */}
                <DialogHeader className="p-6 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="w-14 h-14 border-2 border-[#5b4fff]/40 ring-4 ring-[#5b4fff]/10 shadow-lg">
                                    <AvatarImage src={profile?.avatarUrl} className="object-cover" />
                                    <AvatarFallback className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 text-[#5b4fff] dark:text-[#968fff] font-bold text-lg">
                                        {profile?.name?.substring(0, 2) || 'FR'}
                                    </AvatarFallback>
                                </Avatar>
                                {profile?.consistencyStreak && profile.consistencyStreak > 0 ? (
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-0.5 rounded-full shadow-xs">
                                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                                    </div>
                                ) : null}
                            </div>

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DialogTitle className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                        {profile?.name || 'Friend Profile'}
                                    </DialogTitle>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5">
                                        Friend
                                    </Badge>
                                    {profile?.rank && (
                                        <Badge variant="outline" className="text-[10px] font-bold border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                                            Rank #{profile.rank}
                                        </Badge>
                                    )}
                                </div>

                                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                                    {profile?.leetcodeUsername && (
                                        <a
                                            href={`https://leetcode.com/${profile.leetcodeUsername}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[#ffa116] hover:underline font-medium"
                                        >
                                            <span>LC: @{profile.leetcodeUsername}</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                    {profile?.codeforcesHandle && (
                                        <>
                                            <span className="text-zinc-400">·</span>
                                            <a
                                                href={`https://codeforces.com/profile/${profile.codeforcesHandle}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-500 hover:underline font-medium"
                                            >
                                                <span>CF: @{profile.codeforcesHandle}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>

                        {onChallengePvp && profile && (
                            <Button
                                onClick={() => {
                                    onClose();
                                    onChallengePvp(profile.id!, profile.name);
                                }}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4 py-2 gap-2 shadow-md hover:shadow-lg hover:shadow-[#5b4fff]/20 transition-all cursor-pointer self-start sm:self-auto"
                            >
                                <Swords className="w-4 h-4" /> Challenge to Duel
                            </Button>
                        )}
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="flex items-center gap-2 mt-5 pt-3 border-t border-zinc-200/70 dark:border-zinc-800/60 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveSection('overview')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                activeSection === 'overview'
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/60'
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5" /> Overview & Stats
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('comparison')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                activeSection === 'comparison'
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/60'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Peer Learning & Overlap
                            {comparison && comparison.friendOnlySolved?.length > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                    activeSection === 'comparison' ? 'bg-white/20 text-white' : 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff]'
                                }`}>
                                    {comparison.friendOnlySolved.length} new
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('submissions')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                activeSection === 'submissions'
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-800/60'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" /> Recent Submissions
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                            <p className="text-xs font-semibold text-zinc-500">Loading friend profile...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {!isLoading && comparison && activeSection === 'overview' && (
                        <div className="space-y-6">
                            {/* Key Performance Indicators Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {/* Total Solved */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-1">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                                        <span>Total Solved</span>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <p className="text-2xl font-black text-zinc-900 dark:text-white">{totalSolved}</p>
                                    <p className="text-[11px] text-zinc-400">LeetCode & Codeforces</p>
                                </div>

                                {/* Contest Rating */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-1">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                                        <span>Contest Rating</span>
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <p className="text-2xl font-black text-zinc-900 dark:text-white">
                                        {Math.round(profile?.currentContestRating || 0)}
                                    </p>
                                    <p className="text-[11px] text-zinc-400">
                                        CF: {profile?.codeforcesRating || 'Unrated'}
                                    </p>
                                </div>

                                {/* Consistency Streak */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-1">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                                        <span>Streak</span>
                                        <Flame className="w-4 h-4 text-rose-500" />
                                    </div>
                                    <p className="text-2xl font-black text-zinc-900 dark:text-white">
                                        {profile?.consistencyStreak || 0}d
                                    </p>
                                    <p className="text-[11px] text-zinc-400">Consecutive days</p>
                                </div>

                                {/* Head-to-Head Duel Record */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-1">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                                        <span>Head-to-Head</span>
                                        <Swords className="w-4 h-4 text-[#5b4fff]" />
                                    </div>
                                    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                            {userWins}W
                                        </span>
                                        <span className="text-zinc-400 text-lg font-bold">-</span>
                                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                            {friendWins}L
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 whitespace-nowrap">
                                        {pvpDraws} draws {totalMatches > 0 ? `· ${winRate}% win rate` : '· No duels yet'}
                                    </p>
                                </div>
                            </div>

                            {/* Problem Breakdown with Modern Progress Bars */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        Problem Difficulty Breakdown
                                    </h4>
                                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                                        {totalSolved} Completed
                                    </span>
                                </div>

                                <div className="space-y-3.5">
                                    {/* Easy */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Easy
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                                                {easyCount} <span className="text-zinc-400 font-normal">({easyPct}%)</span>
                                            </span>
                                        </div>
                                        <Progress value={easyPct} className="h-2 bg-emerald-100 dark:bg-emerald-950/40 [&>div]:bg-emerald-500 rounded-full" />
                                    </div>

                                    {/* Medium */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                                                {medCount} <span className="text-zinc-400 font-normal">({medPct}%)</span>
                                            </span>
                                        </div>
                                        <Progress value={medPct} className="h-2 bg-amber-100 dark:bg-amber-950/40 [&>div]:bg-amber-500 rounded-full" />
                                    </div>

                                    {/* Hard */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-rose-500" /> Hard
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300 font-bold">
                                                {hardCount} <span className="text-zinc-400 font-normal">({hardPct}%)</span>
                                            </span>
                                        </div>
                                        <Progress value={hardPct} className="h-2 bg-rose-100 dark:bg-rose-950/40 [&>div]:bg-rose-500 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Earned Badges Showcase */}
                            {profile?.badges && profile.badges.length > 0 && (
                                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                            <Medal className="w-4 h-4 text-amber-500" /> Earned Badges ({profile.badges.length})
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {profile.badges.map((badge, idx) => {
                                            const iconSrc = badge.icon
                                                ? (badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`)
                                                : null;

                                            return (
                                                <div
                                                    key={`${badge.title}-${idx}`}
                                                    className="aspect-square bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex flex-col items-center justify-center p-2.5 border border-zinc-200/80 dark:border-zinc-800 hover:border-[#5b4fff]/40 hover:shadow-md transition-all group"
                                                    title={badge.title}
                                                >
                                                    {iconSrc ? (
                                                        <img
                                                            src={iconSrc}
                                                            alt={badge.title}
                                                            className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg">
                                                            🏆
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 text-center truncate max-w-full mt-1.5">
                                                        {badge.title}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && comparison && activeSection === 'comparison' && (
                        <div className="space-y-6">
                            {/* Insight Banner */}
                            <div className="p-4 rounded-2xl bg-linear-to-r from-[#5b4fff]/10 via-indigo-500/10 to-purple-500/10 border border-[#5b4fff]/25 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
                                <span className="p-2 rounded-xl bg-[#5b4fff] text-white shrink-0 mt-0.5">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <div>
                                    <span className="font-extrabold text-[#5b4fff] dark:text-[#968fff]">
                                        Peer-to-Peer Learning Insight:{' '}
                                    </span>
                                    Compare what your friend has mastered that you haven't solved yet. Click on any problem to practice directly or challenge your friend to a 1v1 duel!
                                </div>
                            </div>

                            {/* Search Filter Bar */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <Input
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    placeholder="Search problem titles in this comparison..."
                                    className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-xs h-9.5"
                                />
                            </div>

                            {/* 1. Solved by Friend, You Haven't (Learn from Friend) */}
                            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-200/80 dark:border-indigo-800/50 space-y-3.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                            Solved by {profile?.name?.split(' ')[0]} (Learn from Friend)
                                        </h4>
                                    </div>
                                    <Badge className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5">
                                        {filteredFriendOnly.length} questions to try
                                    </Badge>
                                </div>

                                {filteredFriendOnly.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-zinc-500">
                                        {searchFilter ? 'No matching problems found.' : 'You have solved all recent problems in their catalog! Great job!'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredFriendOnly.map((slug) => {
                                            const { platform, url } = getProblemPlatform(slug);
                                            const title = formatProblemTitle(slug);

                                            return (
                                                <div
                                                    key={slug}
                                                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 flex items-center justify-between gap-2 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition-all group"
                                                >
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 min-w-0 flex-1"
                                                        title={`Solve ${title}`}
                                                    >
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                                            {platform === 'LeetCode' ? 'LC' : 'CF'}
                                                        </span>
                                                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                                            {title}
                                                        </span>
                                                    </a>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                            title="Open problem in new tab"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                        {onChallengePvp && profile && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onClose();
                                                                    onChallengePvp(profile.id!, profile.name);
                                                                }}
                                                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#5b4fff]/10 hover:bg-[#5b4fff] text-[#5b4fff] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                                                title="Duel your friend on this problem"
                                                            >
                                                                <Swords className="w-3 h-3" /> Duel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 2. Mutual Solved Problems */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 space-y-3.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                            Mutual Mastered Problems
                                        </h4>
                                    </div>
                                    <span className="text-[11px] text-zinc-500 font-medium">
                                        {filteredMutual.length} shared solutions to compare
                                    </span>
                                </div>

                                {filteredMutual.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-zinc-500">
                                        {searchFilter ? 'No matching problems found.' : 'No mutual problems found yet.'}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredMutual.map((slug) => {
                                            const { url } = getProblemPlatform(slug);
                                            const title = formatProblemTitle(slug);

                                            return (
                                                <a
                                                    key={slug}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-500 hover:shadow-xs transition-all"
                                                >
                                                    <span>{title}</span>
                                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* 3. You Solved, Friend Hasn't (Help Your Friend) */}
                            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 space-y-3.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-[#5b4fff]" />
                                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                            Solved by You (Guide & Mentor Your Friend)
                                        </h4>
                                    </div>
                                    <span className="text-[11px] text-zinc-500 font-medium">
                                        {filteredUserOnly.length} problems
                                    </span>
                                </div>

                                {filteredUserOnly.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-zinc-500">
                                        {searchFilter ? 'No matching problems found.' : 'No additional problems recorded.'}
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {filteredUserOnly.map((slug) => {
                                            const { url } = getProblemPlatform(slug);
                                            const title = formatProblemTitle(slug);

                                            return (
                                                <a
                                                    key={slug}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 hover:border-[#5b4fff]/50 hover:shadow-xs transition-all"
                                                >
                                                    <span>{title}</span>
                                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isLoading && comparison && activeSection === 'submissions' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Recent Verified Submissions
                                </h4>
                                <span className="text-xs text-zinc-400">
                                    {profile?.recentSubmissions?.length || 0} Submissions
                                </span>
                            </div>

                            <ScrollArea className="h-80 pr-2 custom-scrollbar">
                                <div className="space-y-2.5">
                                    {(!profile?.recentSubmissions || profile.recentSubmissions.length === 0) ? (
                                        <div className="py-12 text-center text-xs text-zinc-500">
                                            No recent submissions logged for this coder.
                                        </div>
                                    ) : (
                                        profile.recentSubmissions.map((sub, idx) => {
                                            const title = sub.title || formatProblemTitle(sub.titleSlug);
                                            const targetUrl = sub.questionLink || (sub.titleSlug ? `https://leetcode.com/problems/${sub.titleSlug}/` : '#');

                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                        <div className="truncate">
                                                            <a
                                                                href={targetUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs font-bold text-zinc-900 dark:text-white hover:text-[#5b4fff] transition-colors truncate block"
                                                            >
                                                                {title}
                                                            </a>
                                                            <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                {sub.timestamp ? new Date(sub.timestamp * 1000).toLocaleString() : 'Recent'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                                        {sub.platform || 'LeetCode'}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
