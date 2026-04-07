import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { BookOpen, RefreshCw, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { AssignmentDTO } from '../../../types';

const getDaysUntilDue = (dueTimestamp: number) => {
    const diffDays = Math.ceil((new Date(dueTimestamp * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', color: 'text-rose-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-amber-600' };
    return { text: `${diffDays} days left`, color: 'text-slate-600' };
};

// Define Props
interface PendingAssignmentsProps {
    assignments: { classroomId: string, className: string, assignment: AssignmentDTO }[];
    isSyncing: boolean;
    onSync: () => void;
    selectedClassroomId: string | null;
    onClearFilter: () => void;
}

export function PendingAssignments({ assignments, isSyncing, onSync, selectedClassroomId, onClearFilter }: PendingAssignmentsProps) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-blue-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5 text-blue-600" /> Pending Assignments</CardTitle>
                    <CardDescription className="mt-1">{selectedClassroomId ? `Filtered by selected classroom` : `Assigned by your mentors`}</CardDescription>
                </div>
                <div className="flex gap-2">
                    {selectedClassroomId && (
                        <Button onClick={onClearFilter} variant="ghost" className="text-slate-500">Clear Filter</Button>
                    )}
                    <Button onClick={onSync} disabled={isSyncing} variant="outline" className="bg-white">
                        <RefreshCw className={`w-4 h-4 mr-2 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Auto-Sync'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                    {assignments.map((item, idx) => {
                        const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
                        return (
                            <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                <div>
                                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 mb-2 uppercase tracking-wider text-[10px] font-bold">{item.className}</Badge>
                                    <h4 className="text-lg font-bold text-slate-900">{item.assignment.titleSlug}</h4>
                                    <div className="flex items-center gap-1.5 mt-2 text-sm">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
                                    </div>
                                </div>
                                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                    <a href={item.assignment.questionLink} target="_blank" rel="noopener noreferrer">
                                        Solve <ExternalLink className="w-4 h-4 ml-2" />
                                    </a>
                                </Button>
                            </div>
                        );
                    })}
                    {assignments.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}