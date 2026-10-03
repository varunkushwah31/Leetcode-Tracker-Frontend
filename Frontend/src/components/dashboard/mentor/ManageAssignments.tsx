import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import {
    TrashIcon as Trash2,
    ArrowSquareOutIcon as ExternalLink,
    CalendarBlankIcon as Calendar,
    SpinnerIcon as Loader2,
    CheckCircleIcon as CheckCircle2,
    ClockIcon,
} from '@phosphor-icons/react';
import { ClassroomService } from '@/services/endpoints';
import { ErrorBanner } from '../../ui/ErrorBanner';
import type { AssignmentDTO } from '@/types';

interface ManageAssignmentsProps {
    readonly classroomId: string;
    readonly mentorId: string;
    readonly assignments?: AssignmentDTO[];
    readonly onRefresh: () => void;
}

export function ManageAssignments({ classroomId, mentorId, assignments = [], onRefresh }: Readonly<ManageAssignmentsProps>) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Deadline extension state
    const [editingAssignment, setEditingAssignment] = useState<AssignmentDTO | null>(null);
    const [editDeadlineValue, setEditDeadlineValue] = useState<string>('');
    const [isSavingDeadline, setIsSavingDeadline] = useState(false);
    const [editDeadlineError, setEditDeadlineError] = useState<string | null>(null);

    const toDateTimeLocal = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const handleOpenEditDeadline = (assignment: AssignmentDTO) => {
        setEditingAssignment(assignment);
        setEditDeadlineError(null);
        // Default to current deadline, or now + 3 days if missing
        const initialTs = assignment.endTimestamp && assignment.endTimestamp > 0
            ? assignment.endTimestamp
            : Math.floor(Date.now() / 1000) + 3 * 86400;
        setEditDeadlineValue(toDateTimeLocal(initialTs));
    };

    const handleQuickExtend = (days: number) => {
        const baseDate = editingAssignment?.endTimestamp && editingAssignment.endTimestamp > Math.floor(Date.now() / 1000)
            ? new Date(editingAssignment.endTimestamp * 1000)
            : new Date();
        const newDate = new Date(baseDate.getTime() + days * 86400 * 1000);
        newDate.setHours(23, 59, 0, 0);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setEditDeadlineValue(`${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`);
    };

    const handleSaveDeadline = async () => {
        if (!editingAssignment) return;
        setEditDeadlineError(null);

        const newDate = new Date(editDeadlineValue);
        const newEndTimestamp = Math.floor(newDate.getTime() / 1000);

        if (isNaN(newEndTimestamp) || newEndTimestamp <= 0) {
            setEditDeadlineError('Please select a valid deadline date and time.');
            return;
        }

        setIsSavingDeadline(true);
        try {
            await ClassroomService.updateAssignmentDeadline(classroomId, editingAssignment.id, mentorId, newEndTimestamp);
            setEditingAssignment(null);
            onRefresh();
        } catch (err: unknown) {
            setEditDeadlineError(err instanceof Error ? err.message : 'Failed to update assignment deadline.');
        } finally {
            setIsSavingDeadline(false);
        }
    };

    const handleDelete = async (assignmentId: string) => {
        setError(null);
        setIsDeleting(assignmentId);
        try {
            await ClassroomService.deleteAssignment(classroomId, assignmentId, mentorId);
            onRefresh(); // Refresh dashboard to show updated list
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete assignment');
        } finally {
            setIsDeleting(null);
        }
    };

    const formatDate = (timestamp: number) => {
        if (!timestamp) return 'No deadline';
        return new Date(timestamp * 1000).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card className="shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800/60 bg-white dark:bg-[#111111]/85 backdrop-blur-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-transparent border-b border-zinc-200/80 dark:border-zinc-800/60 pb-5">
                <CardTitle className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight">Manage Assignments</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Review active assignments, extend deadlines, and manage questions.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">

                <ErrorBanner message={error} className="mb-6" />

                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50/80 dark:bg-[#1a1a1a]/40 border border-zinc-200/80 dark:border-zinc-800/50 hover:bg-zinc-100/90 dark:hover:bg-[#1a1a1a]/80 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                        {assignment.problemNumber
                                            ? `Problem #${assignment.problemNumber}: ${assignment.title || assignment.titleSlug}`
                                            : (assignment.title ? `${assignment.title} (${assignment.titleSlug})` : assignment.titleSlug)}
                                    </h4>
                                    <Badge
                                        variant="outline"
                                        className={
                                            assignment.platform === 'CODEFORCES'
                                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px] uppercase font-bold'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-[#ffa116] border-amber-500/20 text-[10px] uppercase font-bold'
                                        }
                                    >
                                        {assignment.platform || 'LEETCODE'}
                                    </Badge>
                                    <Badge variant="outline" className="bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/20 text-[10px] uppercase">Active</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-400 dark:text-zinc-500" /> Due: {formatDate(assignment.endTimestamp)}</span>
                                    <a href={assignment.questionLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#5b4fff] hover:text-[#4a3fdf] dark:hover:text-[#b4afff] transition-colors">
                                        View on {assignment.platform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'} <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleOpenEditDeadline(assignment)}
                                    variant="outline"
                                    className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl text-xs font-semibold"
                                >
                                    <ClockIcon className="w-4 h-4 mr-1.5 text-[#5b4fff] dark:text-[#968fff]" />
                                    Extend Deadline
                                </Button>

                                <Button
                                    onClick={() => handleDelete(assignment.id)}
                                    disabled={isDeleting === assignment.id}
                                    variant="outline"
                                    className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl text-xs font-semibold"
                                >
                                    {isDeleting === assignment.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}

                    {assignments.length === 0 && (
                        <div className="text-center py-12">
                            <CheckCircle2 className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-300 tracking-tight">No Active Assignments</h3>
                            <p className="text-zinc-500 text-sm">Assign a question to this class to see it here.</p>
                        </div>
                    )}
                </div>

                {/* Deadline Extension Dialog */}
                <Dialog open={editingAssignment !== null} onOpenChange={(open) => { if (!open) setEditingAssignment(null); }}>
                    <DialogContent className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111]/95 backdrop-blur-2xl rounded-2xl max-w-md text-zinc-900 dark:text-white">
                        <DialogHeader>
                            <DialogTitle className="text-zinc-900 dark:text-white text-xl font-bold flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-[#5b4fff] dark:text-[#968fff]" />
                                Extend Assignment Deadline
                            </DialogTitle>
                        </DialogHeader>

                        <ErrorBanner message={editDeadlineError} />

                        {editingAssignment && (
                            <div className="space-y-4 py-2">
                                <div className="bg-zinc-100 dark:bg-[#1a1a1a] p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <p className="text-xs uppercase font-bold text-zinc-500 tracking-wider mb-1">Assignment</p>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                                        {editingAssignment.problemNumber
                                            ? `Problem #${editingAssignment.problemNumber}: ${editingAssignment.title || editingAssignment.titleSlug}`
                                            : (editingAssignment.title || editingAssignment.titleSlug)}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Current Due Date: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{formatDate(editingAssignment.endTimestamp)}</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase font-semibold">New Deadline Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={editDeadlineValue}
                                        onChange={(e) => setEditDeadlineValue(e.target.value)}
                                        className="bg-zinc-100 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:border-[#5b4fff]"
                                    />
                                </div>

                                {/* Quick Extension Buttons */}
                                <div className="space-y-1.5">
                                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Quick Extension</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { label: '+1 Day', days: 1 },
                                            { label: '+3 Days', days: 3 },
                                            { label: '+1 Week', days: 7 },
                                            { label: '+2 Weeks', days: 14 },
                                        ].map((preset) => (
                                            <Button
                                                key={preset.label}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleQuickExtend(preset.days)}
                                                className="bg-zinc-100 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-xs"
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="mt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setEditingAssignment(null)}
                                className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveDeadline}
                                disabled={isSavingDeadline}
                                className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl font-medium"
                            >
                                {isSavingDeadline ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save New Deadline'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}