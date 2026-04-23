import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ScrollArea } from '../../ui/scroll-area';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { StudentExtendedDTO } from '@/types';

export function StudentRightSidebar({ data, totalSolved }: { data: StudentExtendedDTO | null, totalSolved: number }) {
    const easyStats = data?.problemStats?.find(s => s.difficulty === 'Easy') || { count: 0, beatsPercentage: 0 };
    const medStats = data?.problemStats?.find(s => s.difficulty === 'Medium') || { count: 0, beatsPercentage: 0 };
    const hardStats = data?.problemStats?.find(s => s.difficulty === 'Hard') || { count: 0, beatsPercentage: 0 };

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    return (
        <div className="space-y-8 min-w-0">
            {/* Difficulty Breakdown */}
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-900 dark:text-white">Difficulty Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">Easy</span>
                            <span className="font-bold text-emerald-500">
                                {easyStats.count} <span className="text-zinc-400 dark:text-zinc-500 font-medium ml-1">({easyStats.beatsPercentage}% beats)</span>
                            </span>
                        </div>
                        <Progress value={(easyStats.count / totalSolved) * 100} className="h-2.5 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">Medium</span>
                            <span className="font-bold text-amber-500">
                                {medStats.count} <span className="text-zinc-400 dark:text-zinc-500 font-medium ml-1">({medStats.beatsPercentage}% beats)</span>
                            </span>
                        </div>
                        <Progress value={(medStats.count / totalSolved) * 100} className="h-2.5 bg-amber-100 dark:bg-amber-950 [&>div]:bg-amber-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">Hard</span>
                            <span className="font-bold text-rose-500">
                                {hardStats.count} <span className="text-zinc-400 dark:text-zinc-500 font-medium ml-1">({hardStats.beatsPercentage}% beats)</span>
                            </span>
                        </div>
                        <Progress value={(hardStats.count / totalSolved) * 100} className="h-2.5 bg-rose-100 dark:bg-rose-950 [&>div]:bg-rose-500" />
                    </div>
                </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white">
                        <Clock className="w-5 h-5 text-blue-500" /> Recent Submissions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-64">
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {data?.recentSubmissions?.slice(0, 10).map((sub, idx) => (
                                <a key={idx} href={sub.questionLink} target="_blank" rel="noreferrer" className="flex flex-col p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-3 min-w-0">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{sub.title}</p>
                                        </div>
                                        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{formatDate(sub.timestamp)}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}