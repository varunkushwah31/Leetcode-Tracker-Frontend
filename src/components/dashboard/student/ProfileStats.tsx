import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ExternalLink, Flame } from 'lucide-react';
import type { StudentExtendedDTO } from '../../../types';

interface ProfileStatsProps {
    data: StudentExtendedDTO | null;
    totalSolved: number;
    rating: number;
}

export function ProfileStats({ data, totalSolved, rating }: ProfileStatsProps) {
    if (!data) return null;

    return (
        <Card className="mb-8 shadow-sm border-slate-200">
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <Avatar className="w-20 h-20 border-2 border-slate-100 shadow-sm">
                        <AvatarImage src={data.avatarUrl} />
                        <AvatarFallback className="bg-blue-50 text-blue-700 text-xl font-bold">
                            {data.name?.substring(0, 2) || 'ST'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl font-bold text-slate-900">@{data.leetcodeUsername}</h2>
                            <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:text-[#1d4ed8]">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Global Rank</p>
                                <p className="text-2xl font-bold text-slate-900">{data.rank ? `#${parseInt(data.rank).toLocaleString()}` : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Solved</p>
                                <p className="text-2xl font-bold text-slate-900">{totalSolved}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Contest Rating</p>
                                <p className="text-2xl font-bold text-slate-900">{rating}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                                    <Flame className="w-4 h-4 text-orange-500" /> Streak
                                </p>
                                <p className="text-2xl font-bold text-orange-600">{data.consistencyStreak || 0} days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}