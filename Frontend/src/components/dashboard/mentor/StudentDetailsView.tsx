import { useState, useEffect } from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import {
    ArrowLeftIcon, FlameIcon, CheckCircleIcon as CheckCircle2, ArrowSquareOutIcon as ExternalLink, SpinnerIcon as Loader2, BrainIcon as BrainCircuit, ClockIcon, MedalIcon as Award, PulseIcon as Activity, DownloadSimpleIcon as Download
} from '@phosphor-icons/react';
import { StudentService } from '@/services/endpoints';
import type { StudentExtendedDTO } from '@/types';
import { ActivityHeatmap } from '../student/ActivityHeatmap';
import { ContestRatingsSection } from '../student/ContestRatingsSection';
import { UnifiedContestHistory } from '../student/UnifiedContestHistory';
import { ErrorBanner } from "@/components/ui/ErrorBanner.tsx";

interface StudentDetailsViewProps {
    username: string;
    classroomName?: string;
    onBack: () => void;
}

export function StudentDetailsView({ username, classroomName, onBack }: Readonly<StudentDetailsViewProps>) {
    const [data, setData] = useState<StudentExtendedDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // <-- 2. Add Error State
    const [isExporting, setIsExporting] = useState(false);

    const handleExportReport = async () => {
        setIsExporting(true);
        try {
            const res = await StudentService.exportStudentReport(username);
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${username}_Performance_Report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error('Failed to export student report:', err);
        } finally {
            setIsExporting(false);
        }
    };

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
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to fetch student profile');
            } finally {
                setLoading(false);
            }
        };
        void fetchStudentProfile();
    }, [username]);

    const easyCount = data?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = data?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = data?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const actualSolved = data?.totalSolved ?? (easyCount + medCount + hardCount);
    const totalSolved = actualSolved;
    const progressTotal = Math.max(actualSolved, 1);

    const rating = Math.round(data?.currentContestRating || 0);

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto p-6 lg:p-10 min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff] mb-4" />
                    <p className="text-zinc-400 font-medium tracking-wide">Fetching profile data...</p>
                </div>
            </div>
        );
    }

    // --- 3. Handle the Error State gracefully ---
    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto p-6 lg:p-10 min-h-[60vh] flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 text-center">Profile Sync Failed</h2>
                    <ErrorBanner message={error} />
                    <Button
                        onClick={onBack}
                        className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const cardClasses = "border border-zinc-200/90 dark:border-zinc-800/60 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-white dark:bg-[#111111]/85 backdrop-blur-2xl rounded-2xl";

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-6 relative z-10 animate-in fade-in duration-200">
            {/* Top Navigation Bar with Back button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="bg-white dark:bg-[#1a1b2e] border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all rounded-xl shadow-sm dark:shadow-md flex items-center gap-2 px-4 py-2 text-sm font-medium hover:-translate-x-0.5 cursor-pointer"
                >
                    <ArrowLeftIcon className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" weight="bold" />
                    <span>Back to {classroomName || 'Classroom'}</span>
                </Button>
                <div className="flex items-center gap-2.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportReport}
                        disabled={isExporting}
                        className="bg-white dark:bg-[#1a1b2e] border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold h-9 px-3.5 shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                        {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Download className="w-3.5 h-3.5 text-[#5b4fff] dark:text-[#968fff] mr-1" />}
                        Export Report (CSV)
                    </Button>
                    <span className="text-xs text-zinc-500 font-medium hidden sm:inline-flex items-center gap-1.5">
                        Press <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-300 font-mono text-xs border border-zinc-200 dark:border-zinc-700">Esc</kbd> to return
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg text-xs"
                    >
                        Close
                    </Button>
                </div>
            </div>

                {/* Top Banner */}
                <Card className={`p-8 ${cardClasses}`}>
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <Avatar className="w-24 h-24 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-full">
                                <AvatarImage src={data.avatarUrl} />
                                <AvatarFallback className="bg-zinc-100 dark:bg-[#1a1b2e] text-[#5b4fff] dark:text-[#968fff] text-3xl font-bold">
                                    {data.name?.substring(0, 2).toUpperCase() || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl font-extrabold mb-1 text-zinc-900 dark:text-white tracking-tight">{data.name}</h1>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {data.leetcodeUsername && (
                                        <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="text-zinc-600 dark:text-zinc-400 hover:text-[#5b4fff] dark:hover:text-[#b4afff] transition-colors inline-flex items-center text-xs font-medium bg-zinc-100 dark:bg-[#1a1b2e]/60 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                            LC: @{data.leetcodeUsername} <ExternalLink className="h-3 w-3 ml-1.5" />
                                        </a>
                                    )}
                                    {data.codeforcesHandle && (
                                        <a href={`https://codeforces.com/profile/${data.codeforcesHandle}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors inline-flex items-center text-xs font-medium bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                            CF: @{data.codeforcesHandle} <ExternalLink className="h-3 w-3 ml-1.5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-8 bg-zinc-50/80 dark:bg-[#1a1b2e]/40 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-inner">
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Rank</p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{data.rank ? `#${Number.parseInt(data.rank).toLocaleString()}` : (data.codeforcesRank || 'N/A')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Solved</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalSolved}</p>
                                {Boolean(data.codeforcesSolvedCount && data.codeforcesSolvedCount > 0) && (
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">LC: {data.leetcodeSolvedCount ?? (easyCount + medCount + hardCount)} | CF: {data.codeforcesSolvedCount}</p>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Rating</p>
                                <p className="text-2xl font-bold text-[#5b4fff] dark:text-[#b4afff]">{rating}</p>
                                {Boolean(data.codeforcesRating && data.codeforcesRating > 0) && (
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">CF: {data.codeforcesRating}</p>
                                )}
                            </div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Streak</p>
                                <p className="text-2xl font-bold text-amber-500 flex justify-center items-center">
                                    {data.consistencyStreak || 0} <FlameIcon className="w-5 h-5 ml-1 animate-flame" />
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className={cardClasses}>
                            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center"><Activity className="w-5 h-5 mr-2 text-[#5b4fff]" /> 12-Week Activity</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                <ActivityHeatmap progressHistory={data.progressHistory} />
                            </CardContent>
                        </Card>

                        <Card className={cardClasses}>
                            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center"><BrainCircuit className="w-5 h-5 mr-2 text-[#5b4fff]" /> Top Skills</CardTitle></CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex flex-wrap gap-3">
                                    {data.skills && data.skills.length > 0 ? (
                                        data.skills.toSorted((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 15).map((skill) => (
                                            <div key={skill.tagName} className="flex items-center bg-zinc-100/70 dark:bg-[#1a1b2e]/30 rounded-xl px-3 py-2 border border-zinc-200 dark:border-zinc-800/60 shadow-sm">
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mr-3">{skill.tagName}</span>
                                                <span className="text-[11px] font-bold bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#b4afff] px-2 py-0.5 rounded-md">{skill.problemsSolved}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-500 py-4 italic">No topic data available.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <ContestRatingsSection
                            contestHistory={data.contestHistory}
                            currentContestRating={data.currentContestRating}
                            globalRanking={data.rank}
                            codeforcesContestHistory={data.codeforcesContestHistory}
                            codeforcesRating={data.codeforcesRating}
                            codeforcesMaxRating={data.codeforcesMaxRating}
                            codeforcesRank={data.codeforcesRank}
                            codeforcesMaxRank={data.codeforcesMaxRank}
                        />

                        {/* Unified Contest History */}
                        <UnifiedContestHistory
                            contestHistory={data.contestHistory}
                            codeforcesContestHistory={data.codeforcesContestHistory}
                            cardClassName={cardClasses}
                        />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <Card className={cardClasses}>
                            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Difficulty Breakdown</CardTitle></CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">Easy</span><span className="font-bold text-zinc-900 dark:text-white">{easyCount}</span></div>
                                    <Progress value={(easyCount / progressTotal) * 100} className="h-2.5 bg-emerald-100 dark:bg-[#1a1b2e] border border-emerald-200 dark:border-zinc-800/60 [&>div]:bg-emerald-500 shadow-inner" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-amber-600 dark:text-amber-400 font-bold tracking-wide">Medium</span><span className="font-bold text-zinc-900 dark:text-white">{medCount}</span></div>
                                    <Progress value={(medCount / progressTotal) * 100} className="h-2.5 bg-amber-100 dark:bg-[#1a1b2e] border border-amber-200 dark:border-zinc-800/60 [&>div]:bg-amber-500 shadow-inner" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2"><span className="text-rose-600 dark:text-rose-400 font-bold tracking-wide">Hard</span><span className="font-bold text-zinc-900 dark:text-white">{hardCount}</span></div>
                                    <Progress value={(hardCount / progressTotal) * 100} className="h-2.5 bg-rose-100 dark:bg-[#1a1b2e] border border-rose-200 dark:border-zinc-800/60 [&>div]:bg-rose-500 shadow-inner" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`flex flex-col ${cardClasses}`}>
                            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center"><ClockIcon className="w-5 h-5 mr-2 text-[#5b4fff]" /> Recent Activity</CardTitle></CardHeader>
                            <CardContent className="flex-1 p-0 px-6 pb-6 pt-6">
                                <ScrollArea className="h-64 pr-4 custom-scrollbar">
                                    <div className="space-y-4">
                                        {data.recentSubmissions?.slice(0, 15).map((sub) => (
                                            <div key={`${sub.platform || 'LC'}-${sub.titleSlug || sub.title}-${sub.timestamp}`} className="flex items-start space-x-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/60 last:border-0 last:pb-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[14px] font-medium leading-tight text-zinc-900 dark:text-white truncate">{sub.title}</p>
                                                        {sub.platform && (
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                                                                sub.platform === 'CODEFORCES'
                                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                                                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                                            }`}>
                                                                {sub.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                                            </span>
                                                        )}
                                                    </div>
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
                                <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4"><CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center"><Award className="w-5 h-5 mr-2 text-amber-500" /> Earned Badges</CardTitle></CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-3 gap-3">
                                        {data.badges.slice(0, 6).map((badge) => (
                                            <div key={`${badge.title}-${badge.icon}`} className="aspect-square bg-zinc-100/80 dark:bg-[#1a1b2e]/40 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800/60 p-2 shadow-sm" title={badge.title}>
                                                <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt="badge" className="w-10 h-10 object-contain" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
        </div>
    );
}