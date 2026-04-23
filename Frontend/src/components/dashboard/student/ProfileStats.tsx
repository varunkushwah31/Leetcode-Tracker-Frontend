import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ExternalLink, Flame, Trophy } from 'lucide-react';
import type { StudentExtendedDTO } from '@/types';

interface ProfileStatsProps {
    data: StudentExtendedDTO | null;
    totalSolved: number;
    rating: number;
}

export function ProfileStats({ data, totalSolved, rating }: ProfileStatsProps) {
    if (!data) return null;

    return (
        <Card className="mb-8 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <Avatar className="w-20 h-20 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <AvatarImage src={data.avatarUrl} />
                        <AvatarFallback className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xl font-bold">
                            {data.name?.substring(0, 2) || 'ST'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">@{data.leetcodeUsername}</h2>
                            <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer"
                               className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-6 bg-zinc-50 dark:bg-[#09090B] p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Global Rank</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center">
                                    <Trophy className="w-4 h-4 text-amber-500 mr-1.5 hidden sm:block" />
                                    {data.rank ? `#${parseInt(data.rank).toLocaleString()}` : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Total Solved</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalSolved}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Contest Rating</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{rating}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                                    <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Streak
                                </p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{data.consistencyStreak || 0} days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}