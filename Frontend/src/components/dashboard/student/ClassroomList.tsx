import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { BookOpenIcon, TrendUpIcon as TrendingUp } from '@phosphor-icons/react';
import type { ClassroomSummaryDTO } from '@/types';

interface ClassroomListProps {
    classrooms?: ClassroomSummaryDTO[];
    selectedClassroomId: string | null;
    onSelectClassroom: (id: string | null) => void;
}

export function ClassroomList({ classrooms, selectedClassroomId, onSelectClassroom }: Readonly<ClassroomListProps>) {
    return (
        <Card className="flex flex-col h-full relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
                    <BookOpenIcon className="w-5 h-5 text-[#5b4fff]"/> My Classrooms
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 sm:p-5">
                <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
                    {classrooms?.map(cls => (
                        <button
                            key={cls.id}
                            type="button"
                            onClick={() => onSelectClassroom(selectedClassroomId === cls.id ? null : cls.id!)}
                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all text-left w-full ${
                                selectedClassroomId === cls.id
                                    ? 'bg-[#5b4fff]/10 border-[#5b4fff]/50 shadow-md ring-1 ring-[#5b4fff]/50'
                                    : 'bg-zinc-50/80 dark:bg-[#1a1a1a]/40 border-zinc-200/80 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a]/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                        >
                            <div>
                                <p className={`font-bold ${selectedClassroomId === cls.id ? 'text-[#5b4fff] dark:text-[#968fff]' : 'text-zinc-900 dark:text-white tracking-tight'}`}>
                                    {cls.className}
                                </p>
                                <p className={`text-xs font-medium mt-1 ${selectedClassroomId === cls.id ? 'text-[#5b4fff]/80 dark:text-[#b4afff]' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {cls.assignments?.length || 0} Total Assignments
                                </p>
                            </div>
                            <TrendingUp className={`w-5 h-5 ${selectedClassroomId === cls.id ? 'text-[#5b4fff]' : 'text-zinc-400'}`} />
                        </button>
                    ))}
                    {(!classrooms || classrooms.length === 0) && (
                        <div className="col-span-full p-8 text-center text-zinc-500">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-[#5b4fff] dark:text-[#968fff] border border-indigo-500/20 flex items-center justify-center mx-auto mb-2.5">
                                <BookOpenIcon className="w-5 h-5" weight="bold" />
                            </div>
                            <h5 className="text-zinc-900 dark:text-white font-bold text-sm">No Classrooms Enrolled</h5>
                            <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">Join a classroom to receive assigned problem sets from mentors.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}