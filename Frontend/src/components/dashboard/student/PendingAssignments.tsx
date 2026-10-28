import { useState, useMemo } from 'react';
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
    MagnifyingGlassIcon,
    XCircleIcon as XCircle,
} from '@phosphor-icons/react';
import { StudentService } from '@/services/endpoints';
import type { AssignmentDTO, ClassroomSummaryDTO } from '@/types';

export interface AssignmentItem {
    classroomId: string;
    className: string;
    assignment: AssignmentDTO;
    isCompleted?: boolean;
}

interface PendingAssignmentsProps {
    assignments: AssignmentItem[];
    onSync: () => void;
    isSyncing: boolean;
    selectedClassroomId?: string | null;
    onClearFilter?: () => void;
    onValidationSuccess?: () => void;
    classrooms?: ClassroomSummaryDTO[];
    onSelectClassroom?: (id: string | null) => void;
}

export function PendingAssignments({
    assignments,
    onSync,
    isSyncing,
    selectedClassroomId,
    onClearFilter,
    onValidationSuccess,
    classrooms = [],
    onSelectClassroom,
}: Readonly<PendingAssignmentsProps>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
    const [platformFilter, setPlatformFilter] = useState<'ALL' | 'LEETCODE' | 'CODEFORCES'>('ALL');
    const [displayLimit, setDisplayLimit] = useState(5);

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
                    : 'Auto-validation could not find an accepted submission. If you recently solved it, click Sync Stats or paste your submission URL.'
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

    // Filter assignments
    const filteredAssignments = useMemo(() => {
        return assignments.filter((item) => {
            // Classroom filter
            if (selectedClassroomId && item.classroomId !== selectedClassroomId) {
                return false;
            }

            // Status filter
            if (statusFilter === 'pending' && item.isCompleted) {
                return false;
            }
            if (statusFilter === 'completed' && !item.isCompleted) {
                return false;
            }

            // Platform filter
            if (platformFilter !== 'ALL' && item.assignment.platform !== platformFilter) {
                return false;
            }

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const title = (item.assignment.title || '').toLowerCase();
                const slug = (item.assignment.titleSlug || '').toLowerCase();
                const probNum = (item.assignment.problemNumber || '').toLowerCase();
                const className = (item.className || '').toLowerCase();

                const matchesQuery =
                    title.includes(q) ||
                    slug.includes(q) ||
                    probNum.includes(q) ||
                    className.includes(q);

                if (!matchesQuery) return false;
            }

            return true;
        });
    }, [assignments, selectedClassroomId, statusFilter, platformFilter, searchQuery]);

    // Counts for tabs
    const counts = useMemo(() => {
        const classFiltered = selectedClassroomId
            ? assignments.filter((a) => a.classroomId === selectedClassroomId)
            : assignments;

        const pending = classFiltered.filter((a) => !a.isCompleted).length;
        const completed = classFiltered.filter((a) => a.isCompleted).length;
        const total = classFiltered.length;

        return { pending, completed, total };
    }, [assignments, selectedClassroomId]);

    const activeClassName = useMemo(() => {
        if (!selectedClassroomId) return null;
        const cls = classrooms.find((c) => c.id === selectedClassroomId);
        return cls?.className || assignments.find((a) => a.classroomId === selectedClassroomId)?.className || 'Selected';
    }, [classrooms, assignments, selectedClassroomId]);

    const visibleAssignments = filteredAssignments.slice(0, displayLimit);
    const hasMore = filteredAssignments.length > displayLimit;

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            {/* Header */}
            <CardHeader className="bg-transparent border-b border-zinc-200/80 dark:border-zinc-800/60 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
                        <BookOpenIcon className="w-5 h-5 text-[#5b4fff] dark:text-[#968fff]" /> Classroom Assignments
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                        {activeClassName
                            ? `Filtered to ${activeClassName} (${counts.pending} pending, ${counts.completed} completed)`
                            : 'Problem assignments issued by mentors across your enrolled classrooms'}
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {selectedClassroomId && onClearFilter && (
                        <Button
                            onClick={onClearFilter}
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                            <XCircle className="w-3.5 h-3.5" /> Clear Filter
                        </Button>
                    )}
                    <Button
                        onClick={onSync}
                        disabled={isSyncing}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                        {isSyncing ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Stats
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            {/* Quick Filter Toolbar */}
            <div className="p-4 sm:px-6 bg-zinc-50/50 dark:bg-[#111111]/40 border-b border-zinc-200/60 dark:border-zinc-800/60 space-y-3">
                {/* Classroom Filter Pills if multiple classrooms exist */}
                {classrooms.length > 0 && onSelectClassroom && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                        <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1 shrink-0">
                            Classroom:
                        </span>
                        <button
                            type="button"
                            onClick={() => onSelectClassroom(null)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                !selectedClassroomId
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            All ({assignments.length})
                        </button>
                        {classrooms.map((cls) => {
                            const count = assignments.filter((a) => a.classroomId === cls.id).length;
                            const isSelected = selectedClassroomId === cls.id;
                            return (
                                <button
                                    key={cls.id}
                                    type="button"
                                    onClick={() => onSelectClassroom(isSelected ? null : cls.id!)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-[#5b4fff] text-white shadow-xs'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span>{cls.className}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-inherit font-bold">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Search Bar + Status & Platform Filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <Input
                            placeholder="Search by problem title, number, or topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-8.5 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Status Filter Tabs */}
                        <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                            <button
                                type="button"
                                onClick={() => setStatusFilter('pending')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                                    statusFilter === 'pending'
                                        ? 'bg-white dark:bg-zinc-900 text-[#5b4fff] dark:text-[#968fff] shadow-2xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                Pending ({counts.pending})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('completed')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                                    statusFilter === 'completed'
                                        ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                Completed ({counts.completed})
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatusFilter('all')}
                                className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                                    statusFilter === 'all'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                All ({counts.total})
                            </button>
                        </div>

                        {/* Platform Filters */}
                        <div className="flex items-center p-0.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 text-xs">
                            <button
                                type="button"
                                onClick={() => setPlatformFilter('ALL')}
                                className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                                    platformFilter === 'ALL'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlatformFilter('LEETCODE')}
                                className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                                    platformFilter === 'LEETCODE'
                                        ? 'bg-white dark:bg-zinc-900 text-amber-500 shadow-2xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                LC
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlatformFilter('CODEFORCES')}
                                className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                                    platformFilter === 'CODEFORCES'
                                        ? 'bg-white dark:bg-zinc-900 text-cyan-500 shadow-2xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                CF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content List */}
            <CardContent className="p-0">
                {successMessage && (
                    <div className="m-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-sm animate-in fade-in duration-200">
                        <CheckIcon className="w-4 h-4 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                    {visibleAssignments.map((item) => {
                        const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
                        const isExpanded = activeAssignmentId === item.assignment.id;
                        const isCf = item.assignment.platform === 'CODEFORCES';
                        const isAutoValidatingThis = isAutoValidating === item.assignment.id;
                        const isCompleted = !!item.isCompleted;

                        return (
                            <div
                                key={`${item.classroomId}-${item.assignment.id}`}
                                className="p-4 sm:p-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
                                            {isCompleted && (
                                                <Badge
                                                    variant="outline"
                                                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold flex items-center gap-1"
                                                >
                                                    <CheckIcon className="w-3 h-3" /> Completed
                                                </Badge>
                                            )}
                                        </div>

                                        <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                                            {item.assignment.problemNumber
                                                ? `Problem #${item.assignment.problemNumber}: ${item.assignment.title || item.assignment.titleSlug}`
                                                : (item.assignment.title ? `${item.assignment.title} (${item.assignment.titleSlug})` : item.assignment.titleSlug)}
                                        </h4>

                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                                                <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
                                            </div>
                                            {item.assignment.questionLink && (
                                                <a
                                                    href={item.assignment.questionLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-[#5b4fff] transition-colors"
                                                >
                                                    View on {item.assignment.platform === 'CODEFORCES' ? 'Codeforces' : 'LeetCode'}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="h-8.5 bg-transparent border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-800 dark:text-white group interactive-press cursor-pointer"
                                        >
                                            <a href={item.assignment.questionLink} target="_blank" rel="noopener noreferrer">
                                                Solve <ExternalLink className="w-3.5 h-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                            </a>
                                        </Button>

                                        {!isCompleted ? (
                                            <>
                                                {/* Auto-Verify Button */}
                                                <Button
                                                    onClick={() => handleAutoValidate(item.classroomId, item.assignment.id)}
                                                    disabled={isAutoValidatingThis || isValidating}
                                                    size="sm"
                                                    className="h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs hover:shadow-md hover:shadow-emerald-500/20 interactive-press cursor-pointer"
                                                >
                                                    {isAutoValidatingThis ? (
                                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                                    ) : (
                                                        <LightningIcon className="w-3.5 h-3.5 mr-1.5" weight="fill" />
                                                    )}
                                                    Auto-Verify
                                                </Button>

                                                <Button
                                                    onClick={() => handleOpenSubmit(item.assignment.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className={`h-8.5 text-xs font-medium transition-colors border interactive-press cursor-pointer ${
                                                        isExpanded
                                                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-300 dark:border-zinc-700'
                                                            : 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    <Link2 className="w-3.5 h-3.5 mr-1.5" />
                                                    {isExpanded ? 'Cancel' : 'Submit Link'}
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                <CheckIcon className="w-4 h-4 text-emerald-500" /> Solved & Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Link Verification Expander */}
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
                                                className="bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-[#5b4fff] text-xs h-9"
                                            />
                                            <Button
                                                onClick={() => handleValidateSubmission(item.classroomId, item.assignment.id)}
                                                disabled={isValidating}
                                                size="sm"
                                                className="h-9 bg-[#5b4fff] hover:bg-[#4a3ecc] text-white shrink-0 font-medium interactive-press cursor-pointer shadow-xs hover:shadow-md hover:shadow-indigo-500/20 text-xs px-4"
                                            >
                                                {isValidating ? (
                                                    <>
                                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="w-3.5 h-3.5 mr-1.5" /> Verify Link
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

                    {filteredAssignments.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            <div className="w-10 h-10 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20 flex items-center justify-center mx-auto mb-2.5">
                                <CheckIcon className="w-5 h-5" weight="bold" />
                            </div>
                            <h5 className="text-zinc-900 dark:text-white font-bold text-sm">
                                {statusFilter === 'pending'
                                    ? 'All Caught Up!'
                                    : statusFilter === 'completed'
                                    ? 'No Completed Assignments Yet'
                                    : 'No Assignments Found'}
                            </h5>
                            <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
                                {statusFilter === 'pending'
                                    ? 'You have completed all pending problem sets for this selection.'
                                    : 'Try adjusting your classroom or search filters.'}
                            </p>
                            {statusFilter === 'pending' && counts.completed > 0 && (
                                <div className="mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setStatusFilter('completed')}
                                        className="h-8 text-xs border-[#5b4fff]/30 bg-[#5b4fff]/5 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/15 rounded-xl font-bold cursor-pointer"
                                    >
                                        <CheckIcon className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                                        View {counts.completed} Completed Problem{counts.completed > 1 ? 's' : ''}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Show More / Show Less Pagination Toggle */}
                {filteredAssignments.length > 5 && (
                    <div className="p-3 bg-zinc-50/60 dark:bg-[#111111]/40 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 px-4 sm:px-6">
                        <span>
                            Showing {visibleAssignments.length} of {filteredAssignments.length} assignments
                        </span>
                        <div className="flex items-center gap-2">
                            {hasMore ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDisplayLimit((prev) => prev + 5)}
                                    className="h-7 text-xs text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/10 cursor-pointer"
                                >
                                    Show More ({filteredAssignments.length - displayLimit} remaining)
                                </Button>
                            ) : (
                                displayLimit > 5 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDisplayLimit(5)}
                                        className="h-7 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                                    >
                                        Show Less
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
