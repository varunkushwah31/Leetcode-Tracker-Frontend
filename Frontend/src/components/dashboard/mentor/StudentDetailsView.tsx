import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ScrollArea } from '../../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import {
    ArrowLeft,
    Flame,
    CheckCircle2,
    ExternalLink,
    Loader2,
    BrainCircuit,
    Clock,
    Award,
    Activity
} from 'lucide-react';
import { StudentService } from '@/services/endpoints';
import type { StudentExtendedDTO } from '@/types';
import { ActivityHeatmap } from '../student/ActivityHeatmap';

interface StudentDetailsViewProps {
    username: string;
    onBack: () => void;
}

export function StudentDetailsView({ username, onBack }: StudentDetailsViewProps) {
    const [data, setData] = useState<StudentExtendedDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentProfile = async () => {
            setLoading(true);
            try {
                const res = await StudentService.getExtendedProfile(username);
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch student details", err);
            } finally {
                setLoading(false);
            }
        };
        void fetchStudentProfile();
    }, [username]);

    const easyCount = data?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = data?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = data?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = (easyCount + medCount + hardCount) || 1;

    // Fixed TS6133: We will now use this rating variable in the banner below!
    const rating = Math.round(data?.currentContestRating || 0);

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-zinc-50 dark:bg-[#09090B] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Fetching LeetCode data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="fixed inset-0 z-50 bg-zinc-50 dark:bg-[#09090B] flex flex-col overflow-y-auto animate-in fade-in duration-200 transition-colors">

            {/* Header */}
            <header className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm transition-colors duration-200">
                <Button variant="ghost" onClick={onBack} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
                </Button>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">

                {/* Top Banner */}
                <Card className="p-8 bg-linear-to-b from-zinc-800 to-zinc-900 text-white border border-zinc-700/50 dark:from-zinc-900 dark:to-[#09090B] dark:border-zinc-800 shadow-md">
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <Avatar className="w-24 h-24 border border-zinc-700 shadow-xl rounded-full">
                                <AvatarImage src={data.avatarUrl} />
                                <AvatarFallback className="bg-zinc-800 dark:bg-zinc-950 text-white text-3xl font-bold">
                                    {data.name?.substring(0, 2) || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">{data.name}</h1>
                                <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center mb-3">
                                    @{data.leetcodeUsername} <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-8 bg-black/20 p-5 rounded-xl backdrop-blur-sm border border-white/5">
                            <div className="text-center">
                                <p className="text-sm font-medium text-zinc-400 mb-1">Rank</p>
                                <p className="text-2xl font-bold text-white">{data.rank ? `#${parseInt(data.rank).toLocaleString()}` : 'N/A'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-zinc-400 mb-1">Solved</p>
                                <p className="text-2xl font-bold text-emerald-400">{totalSolved}</p>
                            </div>
                            {/* FIXED: Displaying the Rating here */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-zinc-400 mb-1">Rating</p>
                                <p className="text-2xl font-bold text-blue-400">{rating}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-zinc-400 mb-1">Streak</p>
                                <p className="text-2xl font-bold text-amber-500 flex justify-center items-center">
                                    {data.consistencyStreak || 0} <Flame className="w-5 h-5 ml-1" />
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CardHeader><CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center"><Activity className="w-5 h-5 mr-2 text-zinc-400" /> 12-Week Activity</CardTitle></CardHeader>
                            <CardContent>
                                <ActivityHeatmap progressHistory={data.progressHistory} />
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CardHeader><CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center"><BrainCircuit className="w-5 h-5 mr-2 text-zinc-400" /> Top Skills</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills && data.skills.length > 0 ? (
                                        data.skills.sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 15).map((skill, i) => (
                                            <div key={i} className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-200 dark:border-zinc-700/50">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mr-2">{skill.tagName}</span>
                                                <span className="text-xs bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded shadow-sm border border-transparent dark:border-zinc-800">{skill.problemsSolved}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-500 py-4">No topic data available.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <CardHeader><CardTitle className="text-lg text-zinc-900 dark:text-white">Difficulty Breakdown</CardTitle></CardHeader>
                            <CardContent className="space-y-5">
                                {/* FIXED: Replaced indicatorClassName with [&>div] targeting */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-emerald-600 dark:text-emerald-400 font-medium">Easy</span><span className="font-bold text-zinc-900 dark:text-white">{easyCount}</span></div>
                                    <Progress value={(easyCount / totalSolved) * 100} className="h-2 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-amber-600 dark:text-amber-500 font-medium">Medium</span><span className="font-bold text-zinc-900 dark:text-white">{medCount}</span></div>
                                    <Progress value={(medCount / totalSolved) * 100} className="h-2 bg-amber-100 dark:bg-amber-950 [&>div]:bg-amber-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-rose-600 dark:text-rose-500 font-medium">Hard</span><span className="font-bold text-zinc-900 dark:text-white">{hardCount}</span></div>
                                    <Progress value={(hardCount / totalSolved) * 100} className="h-2 bg-rose-100 dark:bg-rose-950 [&>div]:bg-rose-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
                            <CardHeader><CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center"><Clock className="w-5 h-5 mr-2 text-zinc-400" /> Recent Activity</CardTitle></CardHeader>
                            <CardContent className="flex-1 p-0 px-6 pb-6">
                                <ScrollArea className="h-64 pr-4">
                                    <div className="space-y-4">
                                        {data.recentSubmissions?.slice(0, 15).map((sub, i) => (
                                            <div key={i} className="flex items-start space-x-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium leading-tight text-zinc-900 dark:text-white">{sub.title}</p>
                                                    <p className="text-xs text-zinc-500 mt-1">{formatDate(sub.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {data.badges && data.badges.length > 0 && (
                            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <CardHeader><CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center"><Award className="w-5 h-5 mr-2 text-amber-500" /> Earned Badges</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-3">
                                        {data.badges.slice(0, 6).map((badge, i) => (
                                            <div key={i} className="aspect-square bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700/50 p-2" title={badge.title}>
                                                <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt="badge" className="w-10 h-10 object-contain" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}