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
 <Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-lg text-white tracking-tight">
 <BookOpen className="w-5 h-5 text-[#5b4fff]"/> My Classrooms
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
 ? 'bg-[#5b4fff]/10 border-[#5b4fff]/50 shadow-lg ring-1 ring-[#5b4fff]/50'
 : 'bg-[#1a1a1a]/40 border border-zinc-800/50 hover:bg-[#1a1a1a]/80 hover:border-zinc-700'
 }`}
 >
 <div>
 <p className={`font-bold ${selectedClassroomId === cls.id ? 'text-[#968fff]' : 'text-white tracking-tight'}`}>
 {cls.className}
 </p>
 <p className={`text-xs font-medium mt-1 ${selectedClassroomId === cls.id ? 'text-[#b4afff]' : 'text-zinc-400'}`}>
 {cls.assignments?.length || 0} Total Assignments
 </p>
 </div>
 <TrendingUp className={`w-5 h-5 ${selectedClassroomId === cls.id ? 'text-[#5b4fff] ' : 'text-zinc-400'}`} />
 </div>
 ))}
 {(!classrooms || classrooms.length === 0) && (
 <p className="col-span-2 text-sm text-zinc-400 py-4">You are not enrolled in any classrooms.</p>
 )}
 </div>
 </CardContent>
 </Card>
 );
}