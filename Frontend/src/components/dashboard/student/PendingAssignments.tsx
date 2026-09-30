import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { BookOpenIcon, ArrowsClockwiseIcon as RefreshCw, CalendarBlankIcon as Calendar, ArrowSquareOutIcon as ExternalLink, CheckCircleIcon as CheckCircle2, CheckIcon, SpinnerIcon as Loader2, WarningCircleIcon as AlertCircle, LinkSimpleIcon as Link2 } from '@phosphor-icons/react';
import { StudentService } from '@/services/endpoints';
import type { AssignmentDTO } from '@/types';

const getDaysUntilDue = (dueTimestamp: number) => {
    const diffDays = Math.ceil((new Date(dueTimestamp * 1000).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Overdue', color: 'text-rose-500' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-amber-500' };
    return { text: `${diffDays} days left`, color: 'text-zinc-400' };
};

interface PendingAssignmentsProps {
    assignments: { classroomId: string; className: string; assignment: AssignmentDTO }[];
    isSyncing: boolean;
    onSync: () => void;
    selectedClassroomId: string | null;
    onClearFilter: () => void;
    onValidationSuccess?: () => void;
}

export function PendingAssignments({
    assignments,
    isSyncing,
    onSync,
    selectedClassroomId,
    onClearFilter,
    onValidationSuccess,
}: Readonly<PendingAssignmentsProps>) {
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleOpenSubmit = (assignmentId: string) => {
        if (activeAssignmentId === assignmentId) {
            setActiveAssignmentId(null);
            setSubmissionUrl('');
            setValidationError(null);
        } else {
            setActiveAssignmentId(assignmentId);
            setSubmissionUrl('');
            setValidationError(null);
            setSuccessMessage(null);
        }
    };

    const handleValidateSubmission = async (classroomId: string, assignmentId: string) => {
        if (!submissionUrl.trim()) {
            setValidationError('Please enter your LeetCode submission URL.');
            return;
        }

        setIsValidating(true);
        setValidationError(null);
        setSuccessMessage(null);

        try {
            await StudentService.validateSubmission(classroomId, assignmentId, submissionUrl.trim());
            setSuccessMessage('Submission validated successfully!');
            setActiveAssignmentId(null);
            setSubmissionUrl('');
            if (onValidationSuccess) {
                onValidationSuccess();
            } else {
                onSync();
            }
        } catch (err: unknown) {
            setValidationError(err instanceof Error ? err.message : 'Validation failed. Please verify your submission link.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-transparent border-b border-zinc-800/60 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg text-white tracking-tight">
                        <BookOpenIcon className="w-5 h-5 text-[#968fff]" /> Pending Assignments
                    </CardTitle>
                    <CardDescription className="mt-1 text-zinc-400">
                        {selectedClassroomId ? 'Filtered by selected classroom' : 'Assigned by your mentors'}
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    {selectedClassroomId && (
                        <Button onClick={onClearFilter} variant="ghost" className="text-zinc-400 hover:text-white">
                            Clear Filter
                        </Button>
                    )}
                    <Button
                        onClick={onSync}
                        disabled={isSyncing}
                        variant="outline"
                        className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 text-[#968fff] ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Auto-Sync'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {successMessage && (
                    <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckIcon className="w-4 h-4 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}
                <div className="divide-y divide-zinc-800/50">
                    {assignments.map((item) => {
                        const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
                        const isExpanded = activeAssignmentId === item.assignment.id;

                        return (
                            <div key={`${item.classroomId}-${item.assignment.id}`} className="p-6 hover:bg-zinc-800/30 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div>
                                        <Badge
                                            variant="outline"
                                            className="bg-[#1a1a1a] text-zinc-400 border-zinc-700 mb-2 uppercase tracking-wider text-[10px] font-bold"
                                        >
                                            {item.className}
                                        </Badge>
                                        <h4 className="text-lg font-bold text-white tracking-tight">
                                            {item.assignment.titleSlug}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-2 text-sm">
                                            <Calendar className="w-4 h-4 text-zinc-400" />
                                            <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="bg-transparent border border-zinc-700 hover:bg-zinc-800 text-[14px] text-white"
                                        >
                                            <a href={item.assignment.questionLink} target="_blank" rel="noopener noreferrer">
                                                Solve <ExternalLink className="w-4 h-4 ml-2" />
                                            </a>
                                        </Button>
                                        <Button
                                            onClick={() => handleOpenSubmit(item.assignment.id)}
                                            className={`text-[14px] font-medium transition-colors ${
                                                isExpanded
                                                    ? 'bg-zinc-700 text-white hover:bg-zinc-600'
                                                    : 'bg-[#5b4fff] text-white hover:bg-[#4a3ecc]'
                                            }`}
                                        >
                                            <Link2 className="w-4 h-4 mr-1.5" />
                                            {isExpanded ? 'Cancel' : 'Submit'}
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-xs text-zinc-400">
                                            Paste your accepted LeetCode submission URL to verify:
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Input
                                                placeholder="https://leetcode.com/problems/.../submissions/..."
                                                value={submissionUrl}
                                                onChange={(e) => {
                                                    setSubmissionUrl(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="bg-[#1a1a1a] border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:ring-[#5b4fff] text-sm"
                                            />
                                            <Button
                                                onClick={() => handleValidateSubmission(item.classroomId, item.assignment.id)}
                                                disabled={isValidating}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 font-medium"
                                            >
                                                {isValidating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="w-4 h-4 mr-2" /> Verify
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {validationError && (
                                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{validationError}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {assignments.length === 0 && (
                        <div className="p-12 text-center text-zinc-400">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-white tracking-tight">All Caught Up!</h3>
                            <p className="text-sm mt-1">You have no pending assignments.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}