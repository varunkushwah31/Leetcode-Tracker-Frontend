import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
    GraduationCapIcon as GraduationCap,
    CheckCircleIcon as CheckCircle,
    ClockIcon as Clock,
    BookOpenIcon,
    ShieldCheckIcon as ShieldCheck,
    ListChecksIcon as ListChecks,
    UsersIcon as Users,
} from '@phosphor-icons/react';
import type { ClassroomSummaryDTO } from '@/types';

interface AcademicSummaryCardProps {
    classrooms?: ClassroomSummaryDTO[];
    totalAssignments: number;
    completedCount: number;
    pendingCount: number;
    streak?: number;
    className?: string;
}

export function AcademicSummaryCard({
    classrooms = [],
    totalAssignments,
    completedCount,
    pendingCount,
    className = '',
}: Readonly<AcademicSummaryCardProps>) {
    const completionRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : (totalAssignments === 0 && classrooms.length > 0 ? 100 : 0);
    const totalPeers = classrooms.reduce((acc, c) => acc + (c.studentIds?.length || 0), 0);

    return (
        <Card className={`relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200 ${className}`}>
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <CardTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                            <div className="p-2 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <span>Academic & Coursework Mastery</span>
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Real-time assignment progress, completion benchmarks, and verification across enrolled classrooms
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                            {completionRate}% Coursework Completed
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {classrooms.length} Active Classroom{classrooms.length === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
                {/* 4-Pillar Academic KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider">Enrolled</span>
                            <BookOpenIcon className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" />
                        </div>
                        <div className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">
                            {classrooms.length}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{totalPeers} Peers in Class</span>
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider">Assigned</span>
                            <ListChecks className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" />
                        </div>
                        <div className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">
                            {totalAssignments}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                            Curated problem sets
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider">Solved</span>
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {completedCount}
                        </div>
                        <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 font-medium mt-1">
                            {completionRate}% verified rate
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50/90 dark:bg-[#141414]/80 border border-zinc-200/80 dark:border-zinc-800/60">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
                            <Clock className={`w-4 h-4 ${pendingCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                        </div>
                        <div className={`text-2xl font-black tabular-nums ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {pendingCount}
                        </div>
                        <p className={`text-[11px] font-medium mt-1 ${pendingCount > 0 ? 'text-amber-600/90 dark:text-amber-400/90' : 'text-emerald-600/90 dark:text-emerald-400/90'}`}>
                            {pendingCount === 0 ? 'All caught up' : 'Awaiting completion'}
                        </p>
                    </div>
                </div>

                {/* Progress Meter & Automatic Verification Notice */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2">
                    <div className="lg:col-span-7 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            <span>Overall Coursework Completion</span>
                            <span className="text-[#5b4fff] dark:text-[#968fff]">{completedCount} of {totalAssignments} Solved ({completionRate}%)</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    completionRate === 100 ? 'bg-emerald-500' : 'bg-[#5b4fff]'
                                }`}
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-5 p-3 rounded-xl bg-[#5b4fff]/5 dark:bg-[#5b4fff]/10 border border-[#5b4fff]/20 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff] shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-zinc-900 dark:text-white font-semibold">Automatic Verification:</strong>{' '}
                            Solved on LeetCode or Codeforces? Click Auto-Verify on any assignment to instantly credit your submission.
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
