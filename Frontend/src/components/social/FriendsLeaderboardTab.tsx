import { useState, useEffect, useCallback } from 'react';
import {
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    SwordIcon as Swords,
    SpinnerIcon as Loader2,
    EyeIcon as Eye,
    UsersIcon as Users
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SocialService } from '../../services/endpoints';
import type { FriendsLeaderboardEntryDTO } from '@/types';

interface FriendsLeaderboardTabProps {
    onViewDashboard: (studentId: string) => void;
}

export function FriendsLeaderboardTab({ onViewDashboard }: FriendsLeaderboardTabProps) {
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
                return `${Math.round(e.currentContestRating)} Rating`;
            case 'streak':
                return `${e.streak}d Streak`;
            case 'pvp':
                return `${e.pvpWins}W (${e.pvpWinRate}%)`;
            case 'totalSolved':
            default:
                return `${e.totalSolved} Solved`;
        }
    };

    return (
        <div className="space-y-6">
            {/* Sort Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Friends Leaderboard</h3>
                        <p className="text-[11px] text-zinc-500">Rankings among you and your accepted coding friends</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl flex-wrap">
                    <button
                        type="button"
                        onClick={() => setSortBy('totalSolved')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                            sortBy === 'totalSolved'
                                ? 'bg-white dark:bg-zinc-700 text-[#5b4fff] dark:text-[#968fff] shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Total Solved
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('rating')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                            sortBy === 'rating'
                                ? 'bg-white dark:bg-zinc-700 text-amber-500 shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5" /> Rating
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('streak')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                            sortBy === 'streak'
                                ? 'bg-white dark:bg-zinc-700 text-rose-500 shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Flame className="w-3.5 h-3.5" /> Streak
                    </button>
                    <button
                        type="button"
                        onClick={() => setSortBy('pvp')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                            sortBy === 'pvp'
                                ? 'bg-white dark:bg-zinc-700 text-indigo-500 shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Swords className="w-3.5 h-3.5" /> PVP Wins
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                    <p className="text-xs font-medium text-zinc-500">Updating leaderboard...</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
                    <Users className="w-8 h-8 text-zinc-400 mx-auto" />
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Leaderboard is empty</p>
                    <p className="text-xs text-zinc-500">Add friends to compete and climb the leaderboard together!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Top 3 Podium */}
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                            {/* 2nd Place */}
                            {topThree[1] && (
                                <div className="p-4 rounded-2xl bg-linear-to-b from-zinc-100 to-white dark:from-zinc-800/60 dark:to-zinc-900 border border-zinc-300 dark:border-zinc-700 text-center space-y-2 shadow-xs sm:order-1 sm:mt-6">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 font-black text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto shadow-xs">
                                        🥈 2
                                    </div>
                                    <Avatar className="w-12 h-12 mx-auto border-2 border-zinc-300 dark:border-zinc-600">
                                        <AvatarImage src={topThree[1].avatarUrl} />
                                        <AvatarFallback className="bg-zinc-200 text-zinc-700 font-bold">
                                            {topThree[1].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                            {topThree[1].name} {topThree[1].isCurrentUser && '(You)'}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 truncate">@{topThree[1].leetcodeUsername || topThree[1].codeforcesHandle}</p>
                                    </div>
                                    <div className="py-1 px-2.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 inline-block">
                                        {getPrimaryValue(topThree[1])}
                                    </div>
                                </div>
                            )}

                            {/* 1st Place (Gold Champion) */}
                            {topThree[0] && (
                                <div className="p-5 rounded-2xl bg-linear-to-b from-amber-500/15 via-yellow-500/10 to-white dark:to-zinc-900 border-2 border-amber-400 dark:border-amber-500/50 text-center space-y-2.5 shadow-md sm:order-2">
                                    <div className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center mx-auto shadow-sm">
                                        🥇 1
                                    </div>
                                    <Avatar className="w-14 h-14 mx-auto border-2 border-amber-400 shadow-md">
                                        <AvatarImage src={topThree[0].avatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 font-bold text-base">
                                            {topThree[0].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white truncate">
                                            {topThree[0].name} {topThree[0].isCurrentUser && '(You)'}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 truncate">@{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle}</p>
                                    </div>
                                    <div className="py-1 px-3 rounded-lg bg-amber-500/20 text-xs font-black text-amber-700 dark:text-amber-300 inline-block">
                                        {getPrimaryValue(topThree[0])}
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place */}
                            {topThree[2] && (
                                <div className="p-4 rounded-2xl bg-linear-to-b from-orange-100/60 to-white dark:from-zinc-800/60 dark:to-zinc-900 border border-amber-700/30 text-center space-y-2 shadow-xs sm:order-3 sm:mt-8">
                                    <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 font-black text-xs flex items-center justify-center mx-auto shadow-xs">
                                        🥉 3
                                    </div>
                                    <Avatar className="w-12 h-12 mx-auto border-2 border-amber-700/30">
                                        <AvatarImage src={topThree[2].avatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 font-bold">
                                            {topThree[2].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                            {topThree[2].name} {topThree[2].isCurrentUser && '(You)'}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 truncate">@{topThree[2].leetcodeUsername || topThree[2].codeforcesHandle}</p>
                                    </div>
                                    <div className="py-1 px-2.5 rounded-lg bg-amber-700/10 text-xs font-bold text-amber-800 dark:text-amber-300 inline-block">
                                        {getPrimaryValue(topThree[2])}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Ranked Table */}
                    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Rank</th>
                                        <th className="py-3 px-4">Student</th>
                                        <th className="py-3 px-4 text-center">Total Solved</th>
                                        <th className="py-3 px-4 text-center">Contest Rating</th>
                                        <th className="py-3 px-4 text-center">Streak</th>
                                        <th className="py-3 px-4 text-center">PVP Record</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                                    {entries.map((e) => (
                                        <tr
                                            key={e.studentId}
                                            className={`transition-colors ${
                                                e.isCurrentUser
                                                    ? 'bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 font-bold'
                                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                            }`}
                                        >
                                            <td className="py-3.5 px-4 font-bold">
                                                {e.rank === 1 ? '🥇 1' : e.rank === 2 ? '🥈 2' : e.rank === 3 ? '🥉 3' : `#${e.rank}`}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="w-7 h-7">
                                                        <AvatarImage src={e.avatarUrl} />
                                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-[10px] font-bold">
                                                            {e.name.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-zinc-900 dark:text-white font-bold">{e.name}</span>
                                                            {e.isCurrentUser && (
                                                                <Badge className="bg-[#5b4fff] text-white text-[9px] px-1 py-0 font-bold">
                                                                    YOU
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-zinc-400">
                                                            @{e.leetcodeUsername || e.codeforcesHandle || 'coder'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-zinc-900 dark:text-white">
                                                {e.totalSolved}
                                                <span className="text-[10px] text-zinc-400 block font-normal">
                                                    LC: {e.leetcodeSolved} · CF: {e.codeforcesSolved}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                                                {Math.round(e.currentContestRating || 0)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-rose-500">
                                                {e.streak}d
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300">
                                                {e.pvpWins}W - {e.pvpLosses}L
                                                <span className="text-[10px] text-zinc-400 block font-normal">
                                                    {e.pvpWinRate}% win rate
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                {!e.isCurrentUser && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onViewDashboard(e.studentId)}
                                                        className="h-7 text-xs text-zinc-500 hover:text-[#5b4fff] cursor-pointer gap-1"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> View
                                                    </Button>
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
