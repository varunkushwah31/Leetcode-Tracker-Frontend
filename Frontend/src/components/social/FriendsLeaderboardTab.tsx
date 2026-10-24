import { useState, useEffect, useCallback } from 'react';
import {
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    SwordIcon as Swords,
    SpinnerIcon as Loader2,
    EyeIcon as Eye,
    UsersIcon as Users,
    SparkleIcon as Sparkles,
    MedalIcon as Medal
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { StreakFlame } from '../ui/StreakFlame';
import { SocialService } from '../../services/endpoints';
import type { FriendsLeaderboardEntryDTO } from '@/types';

interface FriendsLeaderboardTabProps {
    onViewDashboard: (studentId: string) => void;
    onChallengePvp?: (friendId?: string, friendName?: string) => void;
}

export function FriendsLeaderboardTab({ onViewDashboard, onChallengePvp }: Readonly<FriendsLeaderboardTabProps>) {
    const [entries, setEntries] = useState<FriendsLeaderboardEntryDTO[]>([]);
    const [sortBy, setSortBy] = useState<'totalSolved' | 'rating' | 'streak' | 'pvp'>('totalSolved');
    const [isLoading, setIsLoading] = useState(true);

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

    const topThree = entries.slice(0, 3);

    const getPrimaryValue = (e: FriendsLeaderboardEntryDTO) => {
        switch (sortBy) {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" />

                <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Friends Network Leaderboard
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Real-time competitive standings among you and your accepted coding peer network.
                        </p>
                    </div>
                </div>

                {/* Filter Switcher Segmented Control */}
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl flex-wrap">
                    <button
                        type="button"
                        onClick={() => setSortBy('totalSolved')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'totalSolved'
                                ? 'bg-white dark:bg-zinc-900 text-[#5b4fff] dark:text-[#968fff] shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Total Solved
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('rating')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'rating'
                                ? 'bg-white dark:bg-zinc-900 text-amber-500 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5" /> Rating
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('streak')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'streak'
                                ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5" /> Streak
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('pvp')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            sortBy === 'pvp'
                                ? 'bg-white dark:bg-zinc-900 text-indigo-500 shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Swords className="w-3.5 h-3.5" /> PVP Rating & Wins
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="w-9 h-9 animate-spin text-[#5b4fff]" />
                    <p className="text-xs font-semibold text-zinc-500">Updating leaderboard standings...</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Leaderboard is empty</p>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            Add coding friends to track daily problem solving and climb the ranks together.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Dynamic Adaptive Podium Layout:
                        - 1 user: Centered Champion Spotlight
                        - 2 users: Centered 2-column Duelist Layout (Fixes lopsided empty gap in Image 2!)
                        - 3+ users: Classic 3-Podium (#2 Silver, #1 Gold, #3 Bronze)
                    */}
                    {topThree.length === 1 && topThree[0] && (
                        <div className="max-w-md mx-auto">
                            <div className="p-7 rounded-3xl bg-linear-to-b from-amber-500/15 via-yellow-500/5 to-white dark:to-[#111111] border-2 border-amber-400 dark:border-amber-500/60 ring-4 ring-amber-400/10 text-center space-y-4 shadow-xl shadow-amber-500/10">
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 text-amber-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                                    <Trophy className="w-6 h-6 text-amber-950 mr-0.5" /> 1
                                </div>
                                <Avatar className="w-20 h-20 mx-auto border-3 border-amber-400 shadow-xl ring-4 ring-amber-400/20">
                                    <AvatarImage src={topThree[0].avatarUrl} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-xl">
                                        {topThree[0].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <p className="text-base font-extrabold text-zinc-900 dark:text-white truncate">
                                            {topThree[0].name}
                                        </p>
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                    </p>
                                </div>
                                <div className="py-1.5 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-800 dark:text-amber-300 inline-block">
                                    {getPrimaryValue(topThree[0])}
                                </div>
                                <div>
                                    {topThree[0].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
                                            className="h-8 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
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
                                                className="h-8 text-xs font-bold border-amber-400/60 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[0].studentId, topThree[0].name)}
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

                    {topThree.length === 2 && topThree[0] && topThree[1] && (
                        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
                            {/* 2nd Place Card */}
                            <div className="p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-300 dark:border-zinc-700 text-center space-y-3.5 shadow-md hover:border-zinc-400 transition-all">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 font-black text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto shadow-xs border border-zinc-300 dark:border-zinc-600">
                                    <Medal className="w-5 h-5 text-zinc-400 mr-0.5" /> 2
                                </div>
                                <Avatar className="w-16 h-16 mx-auto border-2 border-zinc-300 dark:border-zinc-600 shadow-md">
                                    <AvatarImage src={topThree[1].avatarUrl} />
                                    <AvatarFallback className="bg-zinc-100 text-zinc-700 font-bold">
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
                                <div className="py-1 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-zinc-800 dark:text-zinc-200 inline-block border border-zinc-200 dark:border-zinc-700">
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
                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> Your Standing
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onViewDashboard(topThree[1].studentId)}
                                                className="h-8 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
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

                            {/* 1st Place Card (Elevated Champion) */}
                            <div className="p-7 rounded-3xl bg-linear-to-b from-amber-500/15 via-yellow-500/5 to-white dark:to-[#111111] border-2 border-amber-400 dark:border-amber-500/60 ring-4 ring-amber-400/10 text-center space-y-4 shadow-xl shadow-amber-500/10 hover:scale-[1.02] transition-transform">
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 text-amber-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                                    <Trophy className="w-6 h-6 text-amber-950 mr-0.5" /> 1
                                </div>
                                <Avatar className="w-20 h-20 mx-auto border-3 border-amber-400 shadow-xl ring-4 ring-amber-400/20">
                                    <AvatarImage src={topThree[0].avatarUrl} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-xl">
                                        {topThree[0].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <p className="text-base font-black text-zinc-900 dark:text-white truncate">
                                            {topThree[0].name}
                                        </p>
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                    </div>
                                    {topThree[0].isCurrentUser && (
                                        <span className="text-[#5b4fff] text-xs font-bold">(You)</span>
                                    )}
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                    </p>
                                </div>
                                <div className="py-1.5 px-4 rounded-xl bg-amber-500/25 border border-amber-500/40 text-xs font-black text-amber-800 dark:text-amber-300 inline-block">
                                    {getPrimaryValue(topThree[0])}
                                </div>
                                <div>
                                    {topThree[0].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
                                            className="h-8 text-xs font-bold border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20 rounded-xl cursor-pointer"
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
                                                className="h-8 text-xs font-bold border-amber-400/60 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[0].studentId, topThree[0].name)}
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

                    {topThree.length >= 3 && topThree[0] && topThree[1] && topThree[2] && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 items-end">
                            {/* 2nd Place (Silver) */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-300 dark:border-zinc-700 text-center space-y-3.5 shadow-md sm:order-1 hover:border-zinc-400 transition-all">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 font-black text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto shadow-xs border border-zinc-300 dark:border-zinc-600">
                                    <Medal className="w-5 h-5 text-zinc-400 mr-0.5" /> 2
                                </div>
                                <Avatar className="w-15 h-15 mx-auto border-2 border-zinc-300 dark:border-zinc-600 shadow-md">
                                    <AvatarImage src={topThree[1].avatarUrl} />
                                    <AvatarFallback className="bg-zinc-100 text-zinc-700 font-bold">
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
                                <div className="py-1 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-zinc-800 dark:text-zinc-200 inline-block border border-zinc-200 dark:border-zinc-700">
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

                            {/* 1st Place (Gold Champion) */}
                            <div className="p-7 rounded-3xl bg-linear-to-b from-amber-500/15 via-yellow-500/5 to-white dark:to-[#111111] border-2 border-amber-400 dark:border-amber-500/60 ring-4 ring-amber-400/10 text-center space-y-4 shadow-xl shadow-amber-500/10 sm:order-2 hover:scale-[1.02] transition-transform">
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 text-amber-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                                    <Trophy className="w-6 h-6 text-amber-950 mr-0.5" /> 1
                                </div>
                                <Avatar className="w-20 h-20 mx-auto border-3 border-amber-400 shadow-xl ring-4 ring-amber-400/20">
                                    <AvatarImage src={topThree[0].avatarUrl} />
                                    <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-xl">
                                        {topThree[0].name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <p className="text-base font-black text-zinc-900 dark:text-white truncate">
                                            {topThree[0].name}
                                        </p>
                                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                    </div>
                                    {topThree[0].isCurrentUser && (
                                        <span className="text-[#5b4fff] text-xs font-bold">(You)</span>
                                    )}
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                    </p>
                                </div>
                                <div className="py-1.5 px-4 rounded-xl bg-amber-500/25 border border-amber-500/40 text-xs font-black text-amber-800 dark:text-amber-300 inline-block">
                                    {getPrimaryValue(topThree[0])}
                                </div>
                                <div>
                                    {topThree[0].isCurrentUser ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
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
                                                onClick={() => onViewDashboard(topThree[0].studentId)}
                                                className="h-8 text-xs font-bold border-amber-400/60 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5 mr-1" /> View Champion Profile
                                            </Button>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onChallengePvp(topThree[0].studentId, topThree[0].name)}
                                                    className="h-8 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer shadow-xs gap-1"
                                                >
                                                    <Swords className="w-3 h-3" /> Duel
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3rd Place (Bronze) */}
                            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-orange-300/80 dark:border-orange-900/50 text-center space-y-3.5 shadow-md sm:order-3 hover:border-orange-400 transition-all">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/60 font-black text-sm text-orange-800 dark:text-orange-400 flex items-center justify-center mx-auto shadow-xs border border-orange-300 dark:border-orange-800">
                                    <Medal className="w-5 h-5 text-orange-500 mr-0.5" /> 3
                                </div>
                                <Avatar className="w-15 h-15 mx-auto border-2 border-orange-300 dark:border-orange-800 shadow-md">
                                    <AvatarImage src={topThree[2].avatarUrl} />
                                    <AvatarFallback className="bg-orange-50 text-orange-700 font-bold">
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
                                <div className="py-1 px-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-xs font-black text-orange-800 dark:text-orange-400 inline-block border border-orange-200 dark:border-orange-900/60">
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

                    {/* Leaderboard Data Table */}
                    <div className="rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-175">
                                <thead>
                                    <tr className="border-b border-zinc-200/80 dark:border-zinc-800/70 bg-zinc-50/70 dark:bg-zinc-900/40 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                                        <th className="py-3.5 px-5 w-16 text-center">Rank</th>
                                        <th className="py-3.5 px-5">Student / Peer</th>
                                        <th className="py-3.5 px-5 text-center">Total Solved</th>
                                        <th className="py-3.5 px-5 text-center">Contest Rating</th>
                                        <th className="py-3.5 px-5 text-center">Streak</th>
                                        <th className="py-3.5 px-5 text-center">PVP Record</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                                    {entries.map((e) => (
                                        <tr
                                            key={e.studentId}
                                            className={`transition-colors ${
                                                e.isCurrentUser
                                                    ? 'bg-[#5b4fff]/5 dark:bg-[#5b4fff]/10 font-bold'
                                                    : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                                            }`}
                                        >
                                            <td className="py-4 px-5 text-center font-black">
                                                {e.rank === 1 ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-500 font-extrabold">
                                                        <Trophy className="w-4 h-4" /> #1
                                                    </span>
                                                ) : e.rank === 2 ? (
                                                    <span className="inline-flex items-center gap-1 text-zinc-400 font-extrabold">
                                                        <Medal className="w-4 h-4" /> #2
                                                    </span>
                                                ) : e.rank === 3 ? (
                                                    <span className="inline-flex items-center gap-1 text-orange-500 font-extrabold">
                                                        <Medal className="w-4 h-4" /> #3
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-500">#{e.rank}</span>
                                                )}
                                            </td>

                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                                        <AvatarImage src={e.avatarUrl} />
                                                        <AvatarFallback className="bg-zinc-100 text-zinc-700 text-xs font-bold">
                                                            {e.name.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-extrabold text-zinc-900 dark:text-white truncate">
                                                                {e.name}
                                                            </span>
                                                            {e.isCurrentUser && (
                                                                <Badge className="bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/25 text-[9px] font-extrabold px-1.5 py-0">
                                                                    You
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] text-zinc-400 truncate">
                                                            @{e.leetcodeUsername || e.codeforcesHandle || 'coder'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <p className="font-extrabold text-zinc-900 dark:text-white">{e.totalSolved}</p>
                                                <p className="text-[10px] text-zinc-400">
                                                    LC: {e.leetcodeSolved} · CF: {e.codeforcesSolved}
                                                </p>
                                            </td>

                                            <td className="py-4 px-5 text-center font-extrabold text-[#5b4fff] dark:text-[#968fff]">
                                                {Math.round(e.currentContestRating || 0) || 'Unrated'}
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                                    {e.streak}d <StreakFlame className="w-3.5 h-3.5" />
                                                </span>
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <p className="font-extrabold">
                                                    <span className="text-emerald-600 dark:text-emerald-400">{e.pvpWins}W</span>
                                                    <span className="text-zinc-400 mx-1">-</span>
                                                    <span className="text-rose-600 dark:text-rose-400">{e.pvpLosses}L</span>
                                                </p>
                                                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-300">
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
                                                            className="h-8 px-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-[#5b4fff] hover:bg-[#5b4fff]/10 rounded-xl cursor-pointer gap-1.5"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>View</span>
                                                        </Button>
                                                        {onChallengePvp && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => onChallengePvp(e.studentId, e.name)}
                                                                className="h-8 px-2.5 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl cursor-pointer gap-1 shadow-xs"
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
