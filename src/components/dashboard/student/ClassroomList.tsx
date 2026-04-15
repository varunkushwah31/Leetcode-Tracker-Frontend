import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { BookOpen, TrendingUp } from 'lucide-react';
import type { ClassroomSummaryDTO } from '@/types';

interface ClassroomListProps {
    classrooms?: ClassroomSummaryDTO[];
    selectedClassroomId: string | null;
    onSelectClassroom: (id: string | null) => void;
}

export function ClassroomList({ classrooms, selectedClassroomId, onSelectClassroom }: ClassroomListProps) {
    return (
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white">
                    <BookOpen className="w-5 h-5 text-zinc-700 dark:text-zinc-400" /> My Classrooms
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    {classrooms?.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => onSelectClassroom(selectedClassroomId === cls.id ? null : cls.id!)}
                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                                selectedClassroomId === cls.id
                                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 dark:border-blue-500/50 shadow-md ring-1 ring-blue-500 dark:ring-blue-500/50'
                                    : 'bg-zinc-50 dark:bg-[#09090B] border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800'
                            }`}
                        >
                            <div>
                                <p className={`font-bold ${selectedClassroomId === cls.id ? 'text-blue-900 dark:text-blue-400' : 'text-zinc-900 dark:text-white'}`}>
                                    {cls.className}
                                </p>
                                <p className={`text-xs font-medium mt-1 ${selectedClassroomId === cls.id ? 'text-blue-700 dark:text-blue-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {cls.assignments?.length || 0} Total Assignments
                                </p>
                            </div>
                            <TrendingUp className={`w-5 h-5 ${selectedClassroomId === cls.id ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-600'}`} />
                        </div>
                    ))}
                    {(!classrooms || classrooms.length === 0) && (
                        <p className="col-span-2 text-sm text-zinc-500 dark:text-zinc-400 py-4">You are not enrolled in any classrooms.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}