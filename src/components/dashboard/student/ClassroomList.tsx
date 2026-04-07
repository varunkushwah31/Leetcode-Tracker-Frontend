import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { BookOpen, TrendingUp } from 'lucide-react';
import type { ClassroomSummaryDTO } from '../../../types';

interface ClassroomListProps {
    classrooms?: ClassroomSummaryDTO[];
    selectedClassroomId: string | null;
    onSelectClassroom: (id: string | null) => void;
}

export function ClassroomList({ classrooms, selectedClassroomId, onSelectClassroom }: ClassroomListProps) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-slate-700" /> My Classrooms
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
                                    ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' 
                                    : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            <div>
                                <p className={`font-bold ${selectedClassroomId === cls.id ? 'text-blue-900' : 'text-slate-900'}`}>
                                    {cls.className}
                                </p>
                                <p className={`text-xs font-medium mt-1 ${selectedClassroomId === cls.id ? 'text-blue-700' : 'text-slate-500'}`}>
                                    {cls.assignments?.length || 0} Total Assignments
                                </p>
                            </div>
                            <TrendingUp className={`w-5 h-5 ${selectedClassroomId === cls.id ? 'text-blue-500' : 'text-slate-400'}`} />
                        </div>
                    ))}
                    {(!classrooms || classrooms.length === 0) && (
                        <p className="col-span-2 text-sm text-slate-500 py-4">You are not enrolled in any classrooms.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}