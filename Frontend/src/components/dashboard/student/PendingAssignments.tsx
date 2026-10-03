import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import {
    CalendarBlankIcon as Calendar,
    ArrowSquareOutIcon as ExternalLink,
    CheckCircleIcon as CheckIcon,
    SpinnerIcon as Loader2,
    WarningCircleIcon as AlertCircle,
    ArrowsClockwiseIcon as RefreshCw,
    LinkSimpleIcon as Link2,
    BookOpenIcon,
    LightningIcon,
} from '@phosphor-icons/react';
import { StudentService } from '@/services/endpoints';
import type { AssignmentDTO } from '@/types';

interface PendingAssignmentsProps {
    assignments: { classroomId: string; className: string; assignment: AssignmentDTO }[];
    onSync: () => void;
    isSyncing: boolean;
    selectedClassroomId?: string | null;
    onClearFilter?: () => void;
    onValidationSuccess?: () => void;
}

export function PendingAssignments({
    assignments,
    onSync,
    isSyncing,
    selectedClassroomId,
    onClearFilter,
    onValidationSuccess,
}: Readonly<PendingAssignmentsProps>) {
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isAutoValidating, setIsAutoValidating] = useState<string | null>(null);
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

    const handleAutoValidate = async (classroomId: string, assignmentId: string) => {
        setIsAutoValidating(assignmentId);
        setValidationError(null);
        setSuccessMessage(null);

        try {
            await StudentService.autoValidateSubmission(classroomId, assignmentId);
            setSuccessMessage('Assignment verified and completed automatically!');
            setActiveAssignmentId(null);
            if (onValidationSuccess) {
                onValidationSuccess();
            } else {
                onSync();
            }
        } catch (err: unknown) {
            setValidationError(
                err instanceof Error
                    ? err.message
                    : 'Auto-validation could not find an accepted submission. If you recently solved it, click Sync or paste your submission URL.'
            );
        } finally {
            setIsAutoValidating(null);
        }
    };

    const handleValidateSubmission = async (classroomId: string, assignmentId: string) => {
        const cleanUrl = submissionUrl.trim();
        if (!cleanUrl) {
            setValidationError('Please paste your full submission URL or click Auto-Verify.');
            return;
        }

        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            setValidationError('Please paste the complete submission URL starting with https:// instead of just a submission ID.');
            return;
        }

        setIsValidating(true);
        setValidationError(null);
        setSuccessMessage(null);

        try {
            await StudentService.validateSubmission(classroomId, assignmentId, cleanUrl);
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

    const getDaysUntilDue = (timestamp: number) => {
        if (!timestamp) return { text: 'No deadline', color: 'text-zinc-500' };
        const now = Math.floor(Date.now() / 1000);
        const diff = timestamp - now;
        const days = Math.ceil(diff / 86400);

        if (days < 0) return { text: 'Overdue', color: 'text-rose-600 dark:text-rose-400 font-bold' };
        if (days === 0) return { text: 'Due today', color: 'text-amber-600 dark:text-amber-400 font-bold' };
        if (days === 1) return { text: 'Due tomorrow', color: 'text-amber-600 dark:text-amber-400' };
        return { text: `${days} days left`, color: 'text-zinc-600 dark:text-zinc-400' };
    };

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="bg-transparent border-b border-zinc-200/80 dark:border-zinc-800/60 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white tracking-tight">
                        <BookOpenIcon className="w-5 h-5 text-[#5b4fff] dark:text-[#968fff]" /> Pending Assignments
                    </CardTitle>
                    <CardDescription className="mt-1 text-zinc-500 dark:text-zinc-400">
                        {selectedClassroomId ? 'Filtered by selected classroom' : 'Assigned by your mentors on LeetCode & Codeforces'}
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    {selectedClassroomId && (
                        <Button onClick={onClearFilter} variant="ghost" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                            Clear Filter
                        </Button>
                    )}
                    <Button
                        onClick={onSync}
                        disabled={isSyncing}
                        variant="outline"
                        className="bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" /> Sync Stats
                            </>
                        )}
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
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                    {assignments.map((item) => {
                        const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
                        const isExpanded = activeAssignmentId === item.assignment.id;
                        const isCf = item.assignment.platform === 'CODEFORCES';
                        const isAutoValidatingThis = isAutoValidating === item.assignment.id;

                        return (
                            <div key={`${item.classroomId}-${item.assignment.id}`} className="p-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="outline"
                                                className="bg-zinc-100 dark:bg-[#1a1a1a] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 uppercase tracking-wider text-[10px] font-bold"
                                            >
                                                {item.className}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    isCf
                                                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px] uppercase font-bold'
                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] uppercase font-bold'
                                                }
                                            >
                                                {item.assignment.platform || 'LEETCODE'}
                                            </Badge>
                                        </div>
                                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                            {item.assignment.problemNumber
                                                ? `Problem #${item.assignment.problemNumber}: ${item.assignment.title || item.assignment.titleSlug}`
                                                : (item.assignment.title ? `${item.assignment.title} (${item.assignment.titleSlug})` : item.assignment.titleSlug)}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-2 text-sm">
                                            <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                            <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="bg-transparent border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[14px] text-zinc-800 dark:text-white group interactive-press cursor-pointer"
                                        >
                                            <a href={item.assignment.questionLink} target="_blank" rel="noopener noreferrer">
                                                Solve <ExternalLink className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </a>
                                        </Button>

                                        {/* Auto-Verify Button */}
                                        <Button
                                            onClick={() => handleAutoValidate(item.classroomId, item.assignment.id)}
                                            disabled={isAutoValidatingThis || isValidating}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-medium shadow-xs hover:shadow-md hover:shadow-emerald-500/20 interactive-press cursor-pointer"
                                        >
                                            {isAutoValidatingThis ? (
                                                 <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                            ) : (
                                                <LightningIcon className="w-4 h-4 mr-1.5" weight="fill" />
                                            )}
                                            Auto-Verify
                                        </Button>

                                        <Button
                                            onClick={() => handleOpenSubmit(item.assignment.id)}
                                            variant="outline"
                                            className={`text-[14px] font-medium transition-colors border interactive-press cursor-pointer ${
                                                isExpanded
                                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700'
                                                    : 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            <Link2 className="w-4 h-4 mr-1.5" />
                                            {isExpanded ? 'Cancel' : 'Submit Link'}
                                        </Button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {isCf
                                                ? 'Paste your full Codeforces submission URL (e.g. https://codeforces.com/contest/4/submission/12345678):'
                                                : 'Paste your full accepted LeetCode submission URL (e.g. https://leetcode.com/problems/two-sum/submissions/123456789/):'}
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Input
                                                placeholder={
                                                    isCf
                                                        ? 'https://codeforces.com/contest/4/submission/12345678'
                                                        : 'https://leetcode.com/problems/two-sum/submissions/123456789/'
                                                }
                                                value={submissionUrl}
                                                onChange={(e) => {
                                                    setSubmissionUrl(e.target.value);
                                                    setValidationError(null);
                                                }}
                                                className="bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-[#5b4fff] text-sm"
                                            />
                                            <Button
                                                onClick={() => handleValidateSubmission(item.classroomId, item.assignment.id)}
                                                disabled={isValidating}
                                                className="bg-[#5b4fff] hover:bg-[#4a3ecc] text-white shrink-0 font-medium interactive-press cursor-pointer shadow-xs hover:shadow-md hover:shadow-indigo-500/20"
                                            >
                                                {isValidating ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="w-4 h-4 mr-2" /> Verify Link
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        {validationError && (
                                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
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
                        <div className="p-12 text-center text-zinc-500">
                            <CheckIcon className="w-12 h-12 mx-auto text-emerald-500/50 mb-3" />
                            <h5 className="text-zinc-900 dark:text-white font-semibold">All Caught Up!</h5>
                            <p className="text-sm mt-1 text-zinc-500 dark:text-zinc-400">You have no pending assignments on LeetCode or Codeforces.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}