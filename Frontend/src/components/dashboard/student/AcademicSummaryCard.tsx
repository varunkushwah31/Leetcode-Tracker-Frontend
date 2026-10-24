import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
    GraduationCapIcon as GraduationCap,
    CheckCircleIcon as CheckCircle,
    ClockIcon as Clock,
    BookOpenIcon,
    SparkleIcon as Sparkle,
} from '@phosphor-icons/react';
import type { ClassroomSummaryDTO } from '@/types';

interface AcademicSummaryCardProps {
    classrooms?: ClassroomSummaryDTO[];
    totalAssignments: number;
    completedCount: number;
    pendingCount: number;
    streak: number;
}

export function AcademicSummaryCard({
    classrooms = [],
    totalAssignments,
    completedCount,
    pendingCount,
}: Readonly<AcademicSummaryCardProps>) {
    const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-3">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
                    <span className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#5b4fff] dark:text-[#968fff]" /> Academic Mastery
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                        {completionRate}% Completed
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                            <BookOpenIcon className="w-3.5 h-3.5 text-[#5b4fff]" /> Assigned
                        </div>
                        <div className="text-lg font-black text-zinc-900 dark:text-white">
                            {totalAssignments}
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Solved
                        </div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {completedCount}
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141414] border border-zinc-200/80 dark:border-zinc-800/60 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending
                        </div>
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                            {pendingCount}
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        <span>Coursework Completion ({classrooms.length} Classroom{classrooms.length === 1 ? '' : 's'})</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-linear-to-r from-[#5b4fff] to-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-linear-to-r from-[#5b4fff]/10 via-[#5b4fff]/5 to-transparent border border-[#5b4fff]/20 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
                    <Sparkle className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff] shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-zinc-900 dark:text-white font-semibold">Automatic Verification:</strong>{' '}
                        Solve assigned problems on LeetCode or Codeforces with your connected profile. Click Auto-Verify to automatically sync and get marked complete!
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
