import { useState, useEffect, useCallback } from 'react';
import {
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    SwordIcon as Swords,
    SpinnerIcon as Loader2,
    EyeIcon as Eye,
    UsersIcon as Users,
    SparkleIcon as Sparkles
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-amber-500/50 to-transparent pointer-events-none" />

                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Friends Network Leaderboard
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Real-time competitive standings among you and your accepted coding peer network
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1.5 rounded-2xl flex-wrap">
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
                        <Swords className="w-3.5 h-3.5" /> PVP Wins
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                    <p className="text-xs font-semibold text-zinc-500">Updating leaderboard standings...</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Leaderboard is empty</p>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            Add friends to compete, track daily problem solving, and climb the ranks together!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Top 3 3D Podium */}
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 items-end">
                            {/* 2nd Place (Silver) */}
                            {topThree[1] && (
                                <div className="p-5 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-300 dark:border-zinc-700 text-center space-y-3 shadow-sm sm:order-1 hover:border-zinc-400 transition-all">
                                    <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 font-black text-sm text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto shadow-xs border border-zinc-300 dark:border-zinc-600">
                                        🥈 2
                                    </div>
                                    <Avatar className="w-14 h-14 mx-auto border-2 border-zinc-300 dark:border-zinc-600 shadow-md">
                                        <AvatarImage src={topThree[1].avatarUrl} />
                                        <AvatarFallback className="bg-zinc-100 text-zinc-700 font-bold">
                                            {topThree[1].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">
                                            {topThree[1].name} {topThree[1].isCurrentUser && <span className="text-[#5b4fff]">(You)</span>}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 truncate">
                                            @{topThree[1].leetcodeUsername || topThree[1].codeforcesHandle || 'coder'}
                                        </p>
                                    </div>
                                    <div className="py-1 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-extrabold text-zinc-800 dark:text-zinc-200 inline-block border border-zinc-200 dark:border-zinc-700">
                                        {getPrimaryValue(topThree[1])}
                                    </div>
                                    <div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[1].studentId)}
                                            className="h-7 text-xs text-zinc-500 hover:text-[#5b4fff] cursor-pointer"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* 1st Place (Gold Champion) */}
                            {topThree[0] && (
                                <div className="p-6 rounded-3xl bg-linear-to-b from-amber-500/15 via-yellow-500/10 to-white dark:to-[#111111] border-2 border-amber-400 dark:border-amber-500/60 ring-4 ring-amber-400/10 text-center space-y-3.5 shadow-xl shadow-amber-500/10 sm:order-2 hover:scale-[1.02] transition-transform">
                                    <div className="w-11 h-11 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 text-amber-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                                        🥇 1
                                    </div>
                                    <Avatar className="w-16 h-16 mx-auto border-3 border-amber-400 shadow-lg ring-4 ring-amber-400/20">
                                        <AvatarImage src={topThree[0].avatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 font-extrabold text-lg">
                                            {topThree[0].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center justify-center gap-1">
                                            <p className="text-sm font-black text-zinc-900 dark:text-white truncate">
                                                {topThree[0].name}
                                            </p>
                                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                        </div>
                                        {topThree[0].isCurrentUser && (
                                            <span className="text-[#5b4fff] text-xs font-bold">(You)</span>
                                        )}
                                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                                            @{topThree[0].leetcodeUsername || topThree[0].codeforcesHandle || 'champion'}
                                        </p>
                                    </div>
                                    <div className="py-1.5 px-4 rounded-xl bg-amber-500/25 border border-amber-500/40 text-xs font-black text-amber-800 dark:text-amber-300 inline-block">
                                        {getPrimaryValue(topThree[0])}
                                    </div>
                                    <div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[0].studentId)}
                                            className="h-7 text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 cursor-pointer"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" /> View Champion Profile
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* 3rd Place (Bronze) */}
                            {topThree[2] && (
                                <div className="p-5 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-amber-700/30 dark:border-amber-700/40 text-center space-y-3 shadow-sm sm:order-3 hover:border-amber-700/60 transition-all">
                                    <div className="w-9 h-9 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 font-black text-sm flex items-center justify-center mx-auto shadow-xs border border-amber-700/30">
                                        🥉 3
                                    </div>
                                    <Avatar className="w-14 h-14 mx-auto border-2 border-amber-700/40 shadow-md">
                                        <AvatarImage src={topThree[2].avatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 font-bold">
                                            {topThree[2].name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">
                                            {topThree[2].name} {topThree[2].isCurrentUser && <span className="text-[#5b4fff]">(You)</span>}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 truncate">
                                            @{topThree[2].leetcodeUsername || topThree[2].codeforcesHandle || 'coder'}
                                        </p>
                                    </div>
                                    <div className="py-1 px-3 rounded-xl bg-amber-700/15 border border-amber-700/30 text-xs font-extrabold text-amber-800 dark:text-amber-300 inline-block">
                                        {getPrimaryValue(topThree[2])}
                                    </div>
                                    <div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDashboard(topThree[2].studentId)}
                                            className="h-7 text-xs text-zinc-500 hover:text-[#5b4fff] cursor-pointer"
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Ranked Table */}
                    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 overflow-hidden bg-white dark:bg-[#111111]/80 backdrop-blur-3xl shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-black tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-5">Rank</th>
                                        <th className="py-3.5 px-5">Student / Peer</th>
                                        <th className="py-3.5 px-5 text-center">Total Solved</th>
                                        <th className="py-3.5 px-5 text-center">Contest Rating</th>
                                        <th className="py-3.5 px-5 text-center">Streak</th>
                                        <th className="py-3.5 px-5 text-center">PVP Record</th>
                                        <th className="py-3.5 px-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                                    {entries.map((e) => (
                                        <tr
                                            key={e.studentId}
                                            className={`transition-colors ${
                                                e.isCurrentUser
                                                    ? 'bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 font-bold'
                                                    : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                                            }`}
                                        >
                                            <td className="py-4 px-5 font-black text-sm">
                                                {e.rank === 1 ? '🥇 1' : e.rank === 2 ? '🥈 2' : e.rank === 3 ? '🥉 3' : `#${e.rank}`}
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-700">
                                                        <AvatarImage src={e.avatarUrl} />
                                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-[10px] font-bold">
                                                            {e.name.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-zinc-900 dark:text-white font-extrabold">{e.name}</span>
                                                            {e.isCurrentUser && (
                                                                <Badge className="bg-[#5b4fff] text-white text-[9px] px-1.5 py-0 font-extrabold rounded-md">
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
                                            <td className="py-4 px-5 text-center font-black text-zinc-900 dark:text-white">
                                                {e.totalSolved}
                                                <span className="text-[10px] text-zinc-400 block font-normal">
                                                    LC: {e.leetcodeSolved} · CF: {e.codeforcesSolved}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-center font-extrabold text-amber-600 dark:text-amber-400">
                                                {Math.round(e.currentContestRating || 0)}
                                            </td>
                                            <td className="py-4 px-5 text-center font-extrabold text-rose-500">
                                                {e.streak}d
                                            </td>
                                            <td className="py-4 px-5 text-center font-extrabold text-zinc-700 dark:text-zinc-300">
                                                {e.pvpWins}W - {e.pvpLosses}L
                                                <span className="text-[10px] text-zinc-400 block font-normal">
                                                    {e.pvpWinRate}% win rate
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onViewDashboard(e.studentId)}
                                                    className="h-8 text-xs text-zinc-600 dark:text-zinc-400 hover:text-[#5b4fff] dark:hover:text-white cursor-pointer gap-1.5 rounded-xl"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </Button>
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
