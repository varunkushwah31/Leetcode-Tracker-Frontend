import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ScrollArea } from '../../ui/scroll-area';
import { ClockIcon, CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react';
import type { StudentExtendedDTO } from '@/types';
import { UnifiedContestHistory } from './UnifiedContestHistory';

export function StudentRightSidebar({ data, totalSolved }: Readonly<{
    data: StudentExtendedDTO | null,
    totalSolved: number
}>) {
    const easyStats = data?.problemStats?.find(s => s.difficulty === 'Easy') || { count: 0, beatsPercentage: 0 };
    const medStats = data?.problemStats?.find(s => s.difficulty === 'Medium') || { count: 0, beatsPercentage: 0 };
    const hardStats = data?.problemStats?.find(s => s.difficulty === 'Hard') || { count: 0, beatsPercentage: 0 };

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    const progressTotal = Math.max(totalSolved, 1);

    return (
        <div className="space-y-8 min-w-0">
            {/* Difficulty Breakdown */}
            <Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg text-white tracking-tight">Difficulty Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-300">Easy</span>
                            <span className="font-bold text-emerald-500">
                                {easyStats.count} <span className="text-zinc-400 font-medium ml-1">({easyStats.beatsPercentage}% beats)</span>
                            </span>
                        </div>
                        <Progress value={(easyStats.count / progressTotal) * 100} className="h-2.5 bg-emerald-950/50 [&>div]:bg-emerald-500"/>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-300">Medium</span>
                            <span className="font-bold text-amber-500">
                                {medStats.count} <span className="text-zinc-400 font-medium ml-1">({medStats.beatsPercentage}% beats)</span>
                            </span>
                        </div>
                        <Progress value={(medStats.count / progressTotal) * 100} className="h-2.5 bg-amber-950/50 [&>div]:bg-amber-500"/>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-300">Hard</span>
                            <span className="font-bold text-rose-500">
                                {hardStats.count} <span className="text-zinc-400 font-medium ml-1">({hardStats.beatsPercentage}% beats)</span>
                            </span>
                        </div>
                        <Progress value={(hardStats.count / progressTotal) * 100} className="h-2.5 bg-rose-950/50 [&>div]:bg-rose-500"/>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white tracking-tight">
                        <ClockIcon className="w-5 h-5 text-[#5b4fff]"/> Recent Submissions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <ScrollArea className="h-70 pr-4">
                        <div className="flex flex-col gap-2.5">
                            {data?.recentSubmissions?.slice(0, 10).map((sub) => (
                                <a key={`${sub.titleSlug || sub.title}-${sub.timestamp}`} href={sub.questionLink} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-[#1a1a1a]/40 hover:bg-[#1a1a1a] border border-zinc-800/50 hover:border-zinc-700 rounded-xl transition-all group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-[#1a1b2e] p-1.5 rounded-lg group-hover:bg-[#5b4fff] transition-colors">
                                            <CheckCircle2 className="w-4 h-4 text-[#968fff] group-hover:text-white"/>
                                        </div>
                                        <div className="min-w-0 flex items-center gap-2">
                                            <p className="text-[13.5px] font-bold text-zinc-200 tracking-tight truncate">{sub.title}</p>
                                            {sub.platform && (
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                                                    sub.platform === 'CODEFORCES'
                                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                    {sub.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-zinc-500 shrink-0 uppercase tracking-wider">{formatDate(sub.timestamp)}</span>
                                </a>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Unified Contest History */}
            <UnifiedContestHistory
                contestHistory={data?.contestHistory}
                codeforcesContestHistory={data?.codeforcesContestHistory}
            />
        </div>
    );
}