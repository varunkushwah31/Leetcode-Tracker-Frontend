import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ChartBarIcon as ChartBar } from '@phosphor-icons/react';
import type { StudentExtendedDTO } from '@/types';

export function DifficultyBreakdownCard({ data, totalSolved }: Readonly<{
    data: StudentExtendedDTO | null;
    totalSolved: number;
}>) {
    const easyStats = data?.problemStats?.find(s => s.difficulty === 'Easy') || { count: 0, beatsPercentage: 0 };
    const medStats = data?.problemStats?.find(s => s.difficulty === 'Medium') || { count: 0, beatsPercentage: 0 };
    const hardStats = data?.problemStats?.find(s => s.difficulty === 'Hard') || { count: 0, beatsPercentage: 0 };

    const progressTotal = Math.max(totalSolved, 1);

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                    <ChartBar className="w-4.5 h-4.5 mr-2 text-[#5b4fff]" /> Difficulty Breakdown
                </CardTitle>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    {totalSolved} Solved
                </span>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Easy</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-500 tabular-nums">
                            {easyStats.count} <span className="text-zinc-500 dark:text-zinc-400 font-medium ml-1">({easyStats.beatsPercentage}% beats)</span>
                        </span>
                    </div>
                    <Progress value={(easyStats.count / progressTotal) * 100} className="h-2.5 bg-emerald-100 dark:bg-emerald-950/50 [&>div]:bg-emerald-500"/>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Medium</span>
                        <span className="font-bold text-amber-600 dark:text-amber-500 tabular-nums">
                            {medStats.count} <span className="text-zinc-500 dark:text-zinc-400 font-medium ml-1">({medStats.beatsPercentage}% beats)</span>
                        </span>
                    </div>
                    <Progress value={(medStats.count / progressTotal) * 100} className="h-2.5 bg-amber-100 dark:bg-amber-950/50 [&>div]:bg-amber-500"/>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Hard</span>
                        <span className="font-bold text-rose-600 dark:text-rose-500 tabular-nums">
                            {hardStats.count} <span className="text-zinc-500 dark:text-zinc-400 font-medium ml-1">({hardStats.beatsPercentage}% beats)</span>
                        </span>
                    </div>
                    <Progress value={(hardStats.count / progressTotal) * 100} className="h-2.5 bg-rose-100 dark:bg-rose-950/50 [&>div]:bg-rose-500"/>
                </div>
            </CardContent>
        </Card>
    );
}
