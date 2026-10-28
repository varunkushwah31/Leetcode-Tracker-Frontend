import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
    BookOpenIcon,
    UsersIcon as Users,
    XCircleIcon as XCircle,
} from '@phosphor-icons/react';
import type { ClassroomSummaryDTO, AssignmentDTO } from '@/types';

interface ClassroomListProps {
    classrooms?: ClassroomSummaryDTO[];
    selectedClassroomId: string | null;
    onSelectClassroom: (id: string | null) => void;
    isAssignmentCompleted?: (assignment: AssignmentDTO) => boolean;
}

export function ClassroomList({
    classrooms = [],
    selectedClassroomId,
    onSelectClassroom,
    isAssignmentCompleted,
}: Readonly<ClassroomListProps>) {
    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
                    <BookOpenIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> My Classrooms
                </CardTitle>
                <div className="flex items-center gap-2">
                    {selectedClassroomId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectClassroom(null)}
                            className="h-7 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                            <XCircle className="w-3.5 h-3.5" /> Show All
                        </Button>
                    )}
                    <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-bold"
                    >
                        {classrooms.length} Enrolled
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
                <div className="space-y-3">
                    {classrooms.map((cls) => {
                        const isSelected = selectedClassroomId === cls.id;
                        const totalAssignments = cls.assignments?.length || 0;
                        const completedCount = cls.assignments?.filter(a => isAssignmentCompleted ? isAssignmentCompleted(a) : false).length || 0;
                        const pct = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 100;

                        return (
                            <button
                                key={cls.id}
                                type="button"
                                onClick={() => onSelectClassroom(isSelected ? null : cls.id!)}
                                className={`w-full p-4 border rounded-xl cursor-pointer transition-all text-left block group ${
                                    isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/50 dark:bg-emerald-950/20 dark:border-emerald-500/40 dark:ring-emerald-500/40'
                                        : 'bg-zinc-50/80 dark:bg-[#1a1a1a]/40 border-zinc-200/80 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-sm truncate ${
                                                isSelected
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-zinc-900 dark:text-white tracking-tight'
                                            }`}>
                                                {cls.className}
                                            </p>
                                            {isSelected && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs">
                                                    Filter Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-zinc-400" />
                                                {cls.studentIds?.length || 0} Peers
                                            </span>
                                            <span>
                                                {completedCount}/{totalAssignments} Solved
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className={`text-xs font-bold ${
                                            pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'
                                        }`}>
                                            {pct}%
                                        </span>
                                    </div>
                                </div>

                                {totalAssignments > 0 && (
                                    <div className="w-full bg-zinc-200 dark:bg-zinc-800/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${
                                                pct === 100 ? 'bg-emerald-500' : isSelected ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-emerald-600 dark:bg-emerald-500'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    {classrooms.length === 0 && (
                        <div className="p-6 text-center text-zinc-500">
                            <div className="w-10 h-10 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20 flex items-center justify-center mx-auto mb-2.5">
                                <BookOpenIcon className="w-5 h-5" weight="bold" />
                            </div>
                            <h5 className="text-zinc-900 dark:text-white font-bold text-sm">No Classrooms Enrolled</h5>
                            <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
                                Join a classroom to receive assigned problem sets from mentors.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
