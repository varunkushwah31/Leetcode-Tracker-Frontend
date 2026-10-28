import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    SwordIcon as Swords,
    SpinnerIcon as Loader2,
    EyeIcon as Eye,
    UsersIcon as Users,
    ChartLineUpIcon as ChartLineUp,
    StarIcon as Star,
    MedalIcon as Medal,
    MagnifyingGlassIcon as Search,
    CrownIcon as Crown
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { StreakFlame } from '../ui/StreakFlame';
import { SocialService } from '../../services/endpoints';
import { getCScoreTier } from '../../lib/cScoreCalculator';
import type { FriendsLeaderboardEntryDTO } from '@/types';

interface FriendsLeaderboardTabProps {
    onViewDashboard: (studentId: string) => void;
    onChallengePvp?: (friendId?: string, friendName?: string) => void;
}

export function FriendsLeaderboardTab({ onViewDashboard, onChallengePvp }: Readonly<FriendsLeaderboardTabProps>) {
    const [entries, setEntries] = useState<FriendsLeaderboardEntryDTO[]>([]);
    const [sortBy, setSortBy] = useState<'cScore' | 'totalSolved' | 'rating' | 'streak' | 'pvp'>('cScore');
    const [isLoading, setIsLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');

    const loadLeaderboard = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await SocialService.getFriendsLeaderboard(sortBy);
            setEntries(res.data || []);
        } catch (err) {
            console.error('Failed to load friends leaderboard:', err);
        } finally {
            setIsLoading(false);
        }
    }, [sortBy]);

    useEffect(() => {
        void loadLeaderboard();
    }, [loadLeaderboard]);

    const topThree = useMemo(() => entries.slice(0, 3), [entries]);

    const filteredEntries = useMemo(() => {
        if (!searchFilter.trim()) return entries;
        const q = searchFilter.toLowerCase();
        return entries.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.leetcodeUsername?.toLowerCase().includes(q) ||
            e.codeforcesHandle?.toLowerCase().includes(q)
        );
    }, [entries, searchFilter]);

    const getPrimaryValue = (e: FriendsLeaderboardEntryDTO) => {
        switch (sortBy) {
            case 'cScore':
                return `${e.cScore ?? 500} C-Score · ${getCScoreTier(e.cScore).tier}`;
            case 'rating':
                return `${Math.round(e.currentContestRating || 0)} Rating`;
            case 'streak':
                return `${e.streak}d Streak`;
            case 'pvp':
                return `${e.pvpRating ?? 1200} Elo · ${e.pvpWins}W (${e.pvpWinRate}%)`;
            case 'totalSolved':
            default:
                return `${e.totalSolved} Solved`;
        }
    };

    return (
        <div className="space-y-6">
            {/* Sort Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-sm ring-4 ring-amber-500/10">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                Friends Network Leaderboard
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Live Standings
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Real-time competitive standings among you and your accepted coding peer network.
                        </p>
                    </div>
                </div>

                {/* Filter Switcher Segmented Control */}
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/90 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex-wrap shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setSortBy('cScore')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'cScore'
                                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-emerald-500/30'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <ChartLineUp className="w-3.5 h-3.5 text-emerald-500" /> C-Score
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('totalSolved')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'totalSolved'
                                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-emerald-500/30'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Solved
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('rating')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'rating'
                                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-emerald-500/30'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rating
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('streak')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'streak'
                                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-emerald-500/30'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5 text-rose-500" /> Streak
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('pvp')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'pvp'
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-black border border-zinc-200/60 dark:border-zinc-700/60'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Swords className="w-3.5 h-3.5 text-[#5b4fff]" /> PVP Duels
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                    <p className="text-xs font-bold text-zinc-500">Updating leaderboard standings...</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                        <Trophy className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                        <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">Leaderboard is Empty</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Add coding friends to track daily problem solving, compare contest ratings, and climb the ranks together.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Dynamic Adaptive Podium Layout:
                        - 1 user: Centered Champion Spotlight
                        - 2 users: Centered 2-column Duelist Layout
                        - 3+ users: Classic 3-Podium (#2 Silver, #1 Gold, #3 Bronze)
                    */}
                    {topThree.length === 1 && topThree[0] && (
                        <div className="max-w-md mx-auto">
                            <div className="p-7 rounded-3xl bg-linear-to-b from-amber-500/5 via-white to-white dark:from-amber-500/10 dark:via-[#111114] dark:to-[#111114] border-2 border-amber-500/40 shadow-xl shadow-amber-500/10 text-center space-y-4 relative overflow-hidden">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rank 1 · Gold
                                </div>
                                <div className="relative inline-block mx-auto">
                                    <Avatar className="w-22 h-22 mx-auto border-4 border-amber-500/60 shadow-lg ring-4 ring-amber-500/20">
                                        <AvatarImage src={topThree[0].avatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-2xl">
                                            {topThree[0].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-md">
                                        <Crown className="w-4 h-4" weight="fill" />
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <p className="text-base font-black text-zinc-900 dark:text-white truncate">
                                            {topThree[0].name}
                                        </p>
                                        <Star className="w-4 h-4 text-amber-500 shrink-0" weight="fill" />
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                    </p>
                                </div>
                                <div className="py-1 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 inline-block shadow-2xs">
                                    {getPrimaryValue(topThree[0])}
                                </div>
                                <div>
                                    {topThree[0].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
                                            className="h-8.5 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
                                            title="View standing notice"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[0].studentId)}
                                                className="h-8.5 text-xs font-bold border-amber-400/60 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[0].studentId, topThree[0].name)}
                                                    className="h-8.5 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1.5"
                                                >
                                                    <Swords className="w-3.5 h-3.5" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {topThree.length === 2 && topThree[0] && topThree[1] && (
                        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
                            {/* 2nd Place Card (Silver) */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-2xl border-2 border-zinc-300 dark:border-zinc-700 text-center space-y-3.5 shadow-md hover:border-zinc-400 transition-all">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-black">
                                    <Medal className="w-3.5 h-3.5 text-zinc-400" /> Rank 2 · Silver
                                </div>
                                <Avatar className="w-18 h-18 mx-auto border-4 border-zinc-300 dark:border-zinc-600 shadow-md">
                                    <AvatarImage src={topThree[1].avatarUrl} />
                                    <AvatarFallback className="bg-zinc-100 text-zinc-700 font-bold text-lg">
                                        {topThree[1].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                                        {topThree[1].name} {topThree[1].isCurrentUser && <span className="text-[#5b4fff] font-bold text-xs ml-1">(You)</span>}
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                                        @{topThree[1].leetcodeUsername || topThree[1].codeforcesHandle || 'coder'}
                                    </p>
                                </div>
                                <div className="py-1 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-bold text-zinc-800 dark:text-zinc-200 inline-block border border-zinc-200/80 dark:border-zinc-700 shadow-2xs">
                                    {getPrimaryValue(topThree[1])}
                                </div>
                                <div>
                                    {topThree[1].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[1].studentId)}
                                            className="h-8.5 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
                                            title="View standing notice"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[1].studentId)}
                                                className="h-8.5 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[1].studentId, topThree[1].name)}
                                                    className="h-8.5 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1"
                                                >
                                                    <Swords className="w-3 h-3" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 1st Place Card (Elevated Gold Champion) */}
                            <div className="p-7 rounded-3xl bg-linear-to-b from-amber-500/5 via-white to-white dark:from-amber-500/10 dark:via-[#111114] dark:to-[#111114] border-2 border-amber-500/40 text-center space-y-4 shadow-xl shadow-amber-500/10 relative overflow-hidden">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rank 1 · Gold
                                </div>
                                <Avatar className="w-22 h-22 mx-auto border-4 border-amber-500/60 shadow-lg ring-4 ring-amber-500/20">
                                    <AvatarImage src={topThree[0].avatarUrl} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-2xl">
                                        {topThree[0].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                                            {topThree[0].name}
                                        </p>
                                        <Star className="w-4 h-4 text-amber-500 shrink-0" weight="fill" />
                                    </div>
                                    {topThree[0].isCurrentUser && (
                                        <span className="text-[#5b4fff] text-xs font-bold">(You)</span>
                                    )}
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                    </p>
                                </div>
                                <div className="py-1 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 inline-block shadow-2xs">
                                    {getPrimaryValue(topThree[0])}
                                </div>
                                <div>
                                    {topThree[0].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
                                            className="h-8.5 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
                                            title="View standing notice"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[0].studentId)}
                                                className="h-8.5 text-xs font-bold border-amber-400/60 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[0].studentId, topThree[0].name)}
                                                    className="h-8.5 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1"
                                                >
                                                    <Swords className="w-3 h-3" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {topThree.length >= 3 && topThree[0] && topThree[1] && topThree[2] && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 items-end">
                            {/* 2nd Place (Silver) */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-2xl border-2 border-zinc-300 dark:border-zinc-700 text-center space-y-3.5 shadow-md sm:order-1 hover:border-zinc-400 transition-all">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-black">
                                    <Medal className="w-3.5 h-3.5 text-zinc-400" /> Rank 2 · Silver
                                </div>
                                <Avatar className="w-16 h-16 mx-auto border-3 border-zinc-300 dark:border-zinc-600 shadow-sm">
                                    <AvatarImage src={topThree[1].avatarUrl} />
                                    <AvatarFallback className="bg-zinc-100 text-zinc-700 font-bold text-base">
                                        {topThree[1].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                                        {topThree[1].name} {topThree[1].isCurrentUser && <span className="text-[#5b4fff] text-xs font-bold">(You)</span>}
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                                        @{topThree[1].leetcodeUsername || topThree[1].codeforcesHandle || 'coder'}
                                    </p>
                                </div>
                                <div className="py-1 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs font-bold text-zinc-800 dark:text-zinc-200 inline-block border border-zinc-200/80 dark:border-zinc-700 shadow-2xs">
                                    {getPrimaryValue(topThree[1])}
                                </div>
                                <div>
                                    {topThree[1].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[1].studentId)}
                                            className="h-8 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
                                            title="View standing notice"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[1].studentId)}
                                                className="h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[1].studentId, topThree[1].name)}
                                                    className="h-8 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1"
                                                >
                                                    <Swords className="w-3 h-3" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 1st Place (Gold Champion Pedestal) */}
                            <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-b from-amber-500/10 via-white to-white dark:from-amber-500/15 dark:via-[#111114] dark:to-[#111114] border-2 border-amber-500/50 text-center space-y-4 shadow-xl shadow-amber-500/15 sm:order-2 transition-all relative">
                                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 text-xs font-black">
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rank 1 · Gold
                                </div>
                                <Avatar className="w-22 h-22 mx-auto border-4 border-amber-500/60 shadow-lg ring-4 ring-amber-500/20">
                                    <AvatarImage src={topThree[0].avatarUrl} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-2xl">
                                        {topThree[0].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate">
                                            {topThree[0].name}
                                        </p>
                                        <Star className="w-4 h-4 text-amber-500 shrink-0" weight="fill" />
                                    </div>
                                    {topThree[0].isCurrentUser && (
                                        <span className="text-[#5b4fff] text-xs font-bold">(You)</span>
                                    )}
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                    </p>
                                </div>
                                <div className="py-1 px-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 inline-block shadow-2xs">
                                    {getPrimaryValue(topThree[0])}
                                </div>
                                <div>
                                    {topThree[0].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
                                            className="h-8.5 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
                                            title="View standing notice"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[0].studentId)}
                                                className="h-8.5 text-xs font-bold border-amber-400/60 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[0].studentId, topThree[0].name)}
                                                    className="h-8.5 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1"
                                                >
                                                    <Swords className="w-3 h-3" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3rd Place (Bronze) */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-2xl border-2 border-orange-500/30 dark:border-orange-500/25 text-center space-y-3.5 shadow-md sm:order-3 hover:border-orange-500/50 transition-all">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/25 text-xs font-black">
                                    <Medal className="w-3.5 h-3.5 text-orange-500" /> Rank 3 · Bronze
                                </div>
                                <Avatar className="w-16 h-16 mx-auto border-3 border-orange-500/40 shadow-sm">
                                    <AvatarImage src={topThree[2].avatarUrl} />
                                    <AvatarFallback className="bg-orange-50 text-orange-700 font-bold text-base">
                                        {topThree[2].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                                        {topThree[2].name} {topThree[2].isCurrentUser && <span className="text-[#5b4fff] text-xs font-bold">(You)</span>}
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                                        @{topThree[2].leetcodeUsername || topThree[2].codeforcesHandle || 'coder'}
                                    </p>
                                </div>
                                <div className="py-1 px-3.5 rounded-xl bg-orange-500/10 dark:bg-orange-950/30 text-xs font-bold text-orange-800 dark:text-orange-400 inline-block border border-orange-200 dark:border-orange-900/50 shadow-2xs">
                                    {getPrimaryValue(topThree[2])}
                                </div>
                                <div>
                                    {topThree[2].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[2].studentId)}
                                            className="h-8 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
                                            title="View standing notice"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[2].studentId)}
                                                className="h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[2].studentId, topThree[2].name)}
                                                    className="h-8 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1"
                                                >
                                                    <Swords className="w-3 h-3" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Table Section with Search Filter */}
                    <div className="rounded-3xl bg-white/95 dark:bg-[#111114]/90 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/80 overflow-hidden shadow-sm">
                        {/* Table Search & Filter Bar */}
                        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#5b4fff]" />
                                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                    Network Standings ({filteredEntries.length})
                                </span>
                            </div>

                            <div className="relative max-w-xs w-full">
                                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <Input
                                    type="text"
                                    placeholder="Filter by name or handle..."
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="pl-8.5 pr-3 h-8.5 text-xs bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-175">
                                <thead>
                                    <tr className="border-b border-zinc-200/80 dark:border-zinc-800/70 bg-zinc-50/70 dark:bg-zinc-900/40 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        <th className="py-3.5 px-5 w-16 text-center">Rank</th>
                                        <th className="py-3.5 px-5">Student / Peer</th>
                                        <th className="py-3.5 px-5 text-center">C-Score</th>
                                        <th className="py-3.5 px-5 text-center">Total Solved</th>
                                        <th className="py-3.5 px-5 text-center">Contest Rating</th>
                                        <th className="py-3.5 px-5 text-center">Streak</th>
                                        <th className="py-3.5 px-5 text-center">PVP Record</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                                    {filteredEntries.map((e) => (
                                        <tr
                                            key={e.studentId}
                                            className={`transition-colors ${
                                                e.isCurrentUser
                                                    ? 'bg-[#5b4fff]/5 dark:bg-[#5b4fff]/10 font-bold border-l-4 border-l-[#5b4fff]'
                                                    : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                                            }`}
                                        >
                                            <td className="py-4 px-5 text-center font-bold">
                                                {e.rank === 1 ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                                                        <Trophy className="w-4 h-4" /> #1
                                                    </span>
                                                ) : e.rank === 2 ? (
                                                    <span className="inline-flex items-center gap-1 text-zinc-400 font-bold">
                                                        <Medal className="w-4 h-4" /> #2
                                                    </span>
                                                ) : e.rank === 3 ? (
                                                    <span className="inline-flex items-center gap-1 text-orange-500 font-bold">
                                                        <Medal className="w-4 h-4" /> #3
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-500">#{e.rank}</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs">
                                                        <AvatarImage src={e.avatarUrl} />
                                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                                                            {e.name.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                                                                {e.name}
                                                            </span>
                                                            {e.isCurrentUser && (
                                                                <Badge className="bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/25 text-[9px] font-bold px-1.5 py-0">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                            @{e.leetcodeUsername || e.codeforcesHandle || 'coder'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-bold text-sm text-[#5b4fff] dark:text-[#968fff]">
                                                        {e.cScore ?? 500}
                                                    </span>
                                                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border ${getCScoreTier(e.cScore).badgeClass}`}>
                                                        {getCScoreTier(e.cScore).tier}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100">{e.totalSolved}</p>
                                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                                    LC: {e.leetcodeSolved} · CF: {e.codeforcesSolved}
                                                </p>
                                            </td>

                                            <td className="py-4 px-5 text-center font-bold text-zinc-900 dark:text-zinc-100">
                                                {Math.round(e.currentContestRating || 0) ? Math.round(e.currentContestRating || 0) : <span className="text-zinc-400 font-normal">Unrated</span>}
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                                    {e.streak}d <StreakFlame className="w-3.5 h-3.5" />
                                                </span>
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <p className="font-semibold">
                                                    <span className="text-emerald-600 dark:text-emerald-400">{e.pvpWins}W</span>
                                                    <span className="text-zinc-400 mx-1">-</span>
                                                    <span className="text-rose-600 dark:text-rose-400">{e.pvpLosses}L</span>
                                                </p>
                                                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                                                        {e.pvpRating ?? 1200} Elo
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400">
                                                        · {e.pvpWinRate}% WR
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5 text-right">
                                                {e.isCurrentUser ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onViewDashboard(e.studentId)}
                                                        className="h-8 px-3 text-xs font-bold text-[#5b4fff] bg-[#5b4fff]/10 hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer gap-1.5"
                                                        title="View standing notice"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>You</span>
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onViewDashboard(e.studentId)}
                                                            className="h-8 px-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#5b4fff] hover:bg-[#5b4fff]/10 rounded-xl cursor-pointer gap-1.5"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>Profile</span>
                                                        </Button>
                                                        {onChallengePvp && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => onChallengePvp(e.studentId, e.name)}
                                                                className="h-8 px-2.5 text-xs font-semibold border-zinc-200 dark:border-zinc-700 hover:border-[#5b4fff] hover:text-[#5b4fff] text-zinc-700 dark:text-zinc-300 rounded-xl cursor-pointer gap-1"
                                                            >
                                                                <Swords className="w-3 h-3" />
                                                                <span>Duel</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
