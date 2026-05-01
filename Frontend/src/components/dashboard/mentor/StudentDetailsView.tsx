import { useState, useEffect } from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import {
    ArrowLeft, Flame, CheckCircle2, ExternalLink, Loader2, BrainCircuit, Clock, Award, Activity
} from 'lucide-react';
import { StudentService } from '@/services/endpoints';
import type { StudentExtendedDTO } from '@/types';
import { ActivityHeatmap } from '../student/ActivityHeatmap';
import {ErrorBanner} from "@/components/ui/ErrorBanner.tsx"; // <-- 1. Import the Banner

interface StudentDetailsViewProps {
    username: string;
    onBack: () => void;
}

export function StudentDetailsView({ username, onBack }: StudentDetailsViewProps) {
    const [data, setData] = useState<StudentExtendedDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // <-- 2. Add Error State

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onBack]);

    useEffect(() => {
        const fetchStudentProfile = async () => {
            setLoading(true);
            setError(null); // Clear errors before fetching
            try {
                const res = await StudentService.getExtendedProfile(username);
                setData(res.data);
            } catch (err: any) {
                setError(err.message); // Set specific error from API
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

    const rating = Math.round(data?.currentContestRating || 0);

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff] mb-4" />
                    <p className="text-zinc-400 font-medium tracking-wide">Fetching LeetCode data...</p>
                </div>
            </div>
        );
    }

    // --- 3. Handle the Error State gracefully ---
    if (error) {
        return (
            <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="max-w-md w-full bg-[#111111] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-4 text-center">Profile Sync Failed</h2>
                    <ErrorBanner message={error} />
                    <Button
                        onClick={onBack}
                        className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const cardClasses = "border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-[#111111]/85 backdrop-blur-2xl rounded-2xl";

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col overflow-y-auto animate-in fade-in duration-300">
            {/* Unique dot grid texture background */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 pointer-events-none"></div>
            {/* Subtle ambient glow behind content */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-[#5b4fff] opacity-[0.05] blur-[120px] rounded-full pointer-events-none"></div>

            <header className="sticky top-0 z-50 bg-[#111111]/90 backdrop-blur-xl border-b border-zinc-800/60 px-4 md:px-8 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4 ml-75">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="bg-[#1a1b2e] border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all rounded-xl shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Classroom
                    </Button>
                    <span className="hidden sm:inline text-sm text-zinc-500 font-medium">
                        Press <kbd className="bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-300 font-mono text-xs mx-1">Esc</kbd> to close
                    </span>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 relative z-10">

                {/* Top Banner */}
                <Card className={`p-8 ${cardClasses}`}>
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <Avatar className="w-24 h-24 border border-zinc-800 shadow-xl rounded-full">
                                <AvatarImage src={data.avatarUrl} />
                                <AvatarFallback className="bg-[#1a1b2e] text-[#968fff] text-3xl font-bold">
                                    {data.name?.substring(0, 2).toUpperCase() || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl font-extrabold mb-1 text-white tracking-tight">{data.name}</h1>
                                <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#b4afff] transition-colors flex items-center mb-3 font-medium">
                                    @{data.leetcodeUsername} <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-8 bg-[#1a1b2e]/40 p-5 rounded-xl border border-zinc-800/60 shadow-inner">
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Rank</p>
                                <p className="text-2xl font-bold text-white">{data.rank ? `#${parseInt(data.rank).toLocaleString()}` : 'N/A'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Solved</p>
                                <p className="text-2xl font-bold text-emerald-400">{totalSolved}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Rating</p>
                                <p className="text-2xl font-bold text-[#b4afff]">{rating}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Streak</p>
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
                        <Card className={cardClasses}>
                            <CardHeader className="border-b border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-white tracking-tight flex items-center"><Activity className="w-5 h-5 mr-2 text-[#5b4fff]" /> 12-Week Activity</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                <ActivityHeatmap progressHistory={data.progressHistory} />
                            </CardContent>
                        </Card>

                        <Card className={cardClasses}>
                            <CardHeader className="border-b border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-white tracking-tight flex items-center"><BrainCircuit className="w-5 h-5 mr-2 text-[#5b4fff]" /> Top Skills</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-3">
                                    {data.skills && data.skills.length > 0 ? (
                                        data.skills.sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 15).map((skill, i) => (
                                            <div key={i} className="flex items-center bg-[#1a1b2e]/30 rounded-xl px-3 py-2 border border-zinc-800/60 shadow-sm">
                                                <span className="text-sm font-medium text-zinc-300 mr-3">{skill.tagName}</span>
                                                <span className="text-[11px] font-bold bg-[#5b4fff]/20 text-[#b4afff] px-2 py-0.5 rounded-md">{skill.problemsSolved}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-500 py-4 italic">No topic data available.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card className={cardClasses}>
                            <CardHeader className="border-b border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-white tracking-tight">Difficulty Breakdown</CardTitle></CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-emerald-400 font-bold tracking-wide">Easy</span><span className="font-bold text-white">{easyCount}</span></div>
                                    <Progress value={(easyCount / totalSolved) * 100} className="h-2.5 bg-[#1a1b2e] border border-zinc-800/60 [&>div]:bg-emerald-500 shadow-inner" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-amber-400 font-bold tracking-wide">Medium</span><span className="font-bold text-white">{medCount}</span></div>
                                    <Progress value={(medCount / totalSolved) * 100} className="h-2.5 bg-[#1a1b2e] border border-zinc-800/60 [&>div]:bg-amber-500 shadow-inner" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-rose-400 font-bold tracking-wide">Hard</span><span className="font-bold text-white">{hardCount}</span></div>
                                    <Progress value={(hardCount / totalSolved) * 100} className="h-2.5 bg-[#1a1b2e] border border-zinc-800/60 [&>div]:bg-rose-500 shadow-inner" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`flex flex-col ${cardClasses}`}>
                            <CardHeader className="border-b border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-white tracking-tight flex items-center"><Clock className="w-5 h-5 mr-2 text-[#5b4fff]" /> Recent Activity</CardTitle></CardHeader>
                            <CardContent className="flex-1 p-0 px-6 pb-6 pt-6">
                                <ScrollArea className="h-64 pr-4 custom-scrollbar">
                                    <div className="space-y-4">
                                        {data.recentSubmissions?.slice(0, 15).map((sub, i) => (
                                            <div key={i} className="flex items-start space-x-3 pb-4 border-b border-zinc-800/60 last:border-0 last:pb-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-[14px] font-medium leading-tight text-white mb-1">{sub.title}</p>
                                                    <p className="text-xs text-zinc-500">{formatDate(sub.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {data.badges && data.badges.length > 0 && (
                            <Card className={cardClasses}>
                                <CardHeader className="border-b border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-white tracking-tight flex items-center"><Award className="w-5 h-5 mr-2 text-amber-500" /> Earned Badges</CardTitle></CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-3 gap-3">
                                        {data.badges.slice(0, 6).map((badge, i) => (
                                            <div key={i} className="aspect-square bg-[#1a1b2e]/40 rounded-xl flex items-center justify-center border border-zinc-800/60 p-2 shadow-sm" title={badge.title}>
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