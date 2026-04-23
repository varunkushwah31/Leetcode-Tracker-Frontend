import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { BookOpen, RefreshCw, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { AssignmentDTO } from '@/types';

const getDaysUntilDue = (dueTimestamp: number) => {
 const diffDays = Math.ceil((new Date(dueTimestamp * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
 if (diffDays < 0) return { text: 'Overdue', color: 'text-rose-600 ' };
 if (diffDays === 0) return { text: 'Due today', color: 'text-amber-600 ' };
 return { text: `${diffDays} days left`, color: 'text-zinc-400' };
};

interface PendingAssignmentsProps {
 assignments: { classroomId: string, className: string, assignment: AssignmentDTO }[];
 isSyncing: boolean;
 onSync: () => void;
 selectedClassroomId: string | null;
 onClearFilter: () => void;
}

export function PendingAssignments({ assignments, isSyncing, onSync, selectedClassroomId, onClearFilter }: PendingAssignmentsProps) {
 return (
 <Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
 <CardHeader className="bg-transparent border-b border-zinc-800/60 flex flex-row items-center justify-between">
 <div>
 <CardTitle className="flex items-center gap-2 text-lg text-white tracking-tight">
 <BookOpen className="w-5 h-5 text-[#968fff]"/> Pending Assignments
 </CardTitle>
 <CardDescription className="mt-1 text-zinc-400">{selectedClassroomId ? `Filtered by selected classroom` : `Assigned by your mentors`}</CardDescription>
 </div>
 <div className="flex gap-2">
 {selectedClassroomId && (
 <Button onClick={onClearFilter} variant="ghost"className="text-zinc-400 hover:text-white">Clear Filter</Button>
 )}
 <Button onClick={onSync} disabled={isSyncing} variant="outline"className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
 <RefreshCw className={`w-4 h-4 mr-2 text-[#968fff] ${isSyncing ? 'animate-spin' : ''}`} />
 {isSyncing ? 'Syncing...' : 'Auto-Sync'}
 </Button>
 </div>
 </CardHeader>
 <CardContent className="p-0">
 <div className="divide-y divide-zinc-800/50">
 {assignments.map((item, idx) => {
 const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
 return (
 <div key={idx} className="p-6 hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
 <div>
 <Badge variant="outline"className="bg-[#1a1a1a] text-zinc-400 border-zinc-700 mb-2 uppercase tracking-wider text-[10px] font-bold">
 {item.className}
 </Badge>
 <h4 className="text-lg font-bold text-white tracking-tight">{item.assignment.titleSlug}</h4>
 <div className="flex items-center gap-1.5 mt-2 text-sm">
 <Calendar className="w-4 h-4 text-zinc-400"/>
 <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
 </div>
 </div>
 <Button asChild className="bg-transparent border border-zinc-700 hover:bg-zinc-800 text-[14px] text-white border-transparent">
 <a href={item.assignment.questionLink} target="_blank"rel="noopener noreferrer">
 Solve <ExternalLink className="w-4 h-4 ml-2"/>
 </a>
 </Button>
 </div>
 );
 })}
 {assignments.length === 0 && (
 <div className="p-12 text-center text-zinc-400">
 <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3"/>
 <h3 className="text-lg font-bold text-white tracking-tight">All Caught Up!</h3>
 <p className="text-sm mt-1">You have no pending assignments.</p>
 </div>
 )}
 </div>
 </CardContent>
 </Card>
 );
}