import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { BookOpen, RefreshCw, Calendar, ExternalLink, CheckCircle2 } from 'lucide-react';
import type { AssignmentDTO } from '@/types';

const getDaysUntilDue = (dueTimestamp: number) => {
    const diffDays = Math.ceil((new Date(dueTimestamp * 1000).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', color: 'text-rose-600 dark:text-rose-400' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-amber-600 dark:text-amber-400' };
    return { text: `${diffDays} days left`, color: 'text-zinc-600 dark:text-zinc-400' };
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
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader className="bg-zinc-50/50 dark:bg-[#09090B]/50 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Pending Assignments
                    </CardTitle>
                    <CardDescription className="mt-1 dark:text-zinc-400">{selectedClassroomId ? `Filtered by selected classroom` : `Assigned by your mentors`}</CardDescription>
                </div>
                <div className="flex gap-2">
                    {selectedClassroomId && (
                        <Button onClick={onClearFilter} variant="ghost" className="text-zinc-500 dark:text-zinc-400">Clear Filter</Button>
                    )}
                    <Button onClick={onSync} disabled={isSyncing} variant="outline" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        <RefreshCw className={`w-4 h-4 mr-2 text-blue-600 dark:text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Auto-Sync'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {assignments.map((item, idx) => {
                        const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
                        return (
                            <div key={idx} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div>
                                    <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 mb-2 uppercase tracking-wider text-[10px] font-bold">
                                        {item.className}
                                    </Badge>
                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{item.assignment.titleSlug}</h4>
                                    <div className="flex items-center gap-1.5 mt-2 text-sm">
                                        <Calendar className="w-4 h-4 text-zinc-400" />
                                        <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
                                    </div>
                                </div>
                                <Button asChild className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white border-transparent">
                                    <a href={item.assignment.questionLink} target="_blank" rel="noopener noreferrer">
                                        Solve <ExternalLink className="w-4 h-4 ml-2" />
                                    </a>
                                </Button>
                            </div>
                        );
                    })}
                    {assignments.length === 0 && (
                        <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 dark:text-emerald-500/50 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">All Caught Up!</h3>
                            <p className="text-sm mt-1">You have no pending assignments.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}