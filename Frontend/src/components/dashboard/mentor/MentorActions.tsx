import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { UserPlusIcon, ClipboardTextIcon as ClipboardList, MapTrifoldIcon as Map, PlusIcon, TrashIcon as Trash2, CloudArrowUpIcon as UploadCloud, SpinnerIcon as Loader2, WarningIcon as AlertTriangle, ClockIcon } from '@phosphor-icons/react';
import { ClassroomService, PathService } from '@/services/endpoints.ts';
import type { ClassroomDashboardDTO, LearningPath, PathQuestion } from '@/types';
import {ErrorBanner} from "@/components/ui/ErrorBanner.tsx";// <-- 1. Import the Banner

interface MentorActionsProps {
    mentorId: string;
    selectedClassroom: ClassroomDashboardDTO;
    learningPaths: LearningPath[];
    onRefresh: () => void;
}

export function MentorActions({ mentorId, selectedClassroom, learningPaths, onRefresh }: Readonly<MentorActionsProps>) {
    // Dialog States
    const [addStudentOpen, setAddStudentOpen] = useState(false);
    const [assignQuestionOpen, setAssignQuestionOpen] = useState(false);
    const [assignPathOpen, setAssignPathOpen] = useState(false);
    const [createPathOpen, setCreatePathOpen] = useState(false);
    const [deleteClassOpen, setDeleteClassOpen] = useState(false);

    // Form States
    const [newStudentUsername, setNewStudentUsername] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFailures, setUploadFailures] = useState<string[]>([]);

    const getDefaultDeadline = (daysAhead: number = 3) => {
        const d = new Date(Date.now() + daysAhead * 86400 * 1000);
        d.setHours(23, 59, 0, 0);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const [assignmentData, setAssignmentData] = useState<{
        platform: 'LEETCODE' | 'CODEFORCES';
        title: string;
        titleSlug: string;
        deadline: string;
    }>({
        platform: 'LEETCODE',
        title: '',
        titleSlug: '',
        deadline: getDefaultDeadline(3),
    });
    const [selectedPathId, setSelectedPathId] = useState<string>('');
    const [newPath, setNewPath] = useState({ title: '', description: '' });
    const [pathQuestions, setPathQuestions] = useState<Array<PathQuestion & { tempId: string }>>([
        { tempId: 'question-initial-1', platform: 'LEETCODE', title: '', titleSlug: '', daysToComplete: 3 }
    ]);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- NEW: Error States for all actions ---
    const [addStudentError, setAddStudentError] = useState<string | null>(null);
    const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
    const [assignQuestionError, setAssignQuestionError] = useState<string | null>(null);
    const [assignPathError, setAssignPathError] = useState<string | null>(null);
    const [createPathError, setCreatePathError] = useState<string | null>(null);
    const [deleteClassError, setDeleteClassError] = useState<string | null>(null);

    const [isAdding, setIsAdding] = useState(false);

    const getErrMsg = (err: unknown, fallback: string) =>
        err instanceof Error && err.message ? err.message : fallback;

    // Handlers
    const handleAddStudent = async () => {
        setAddStudentError(null);
        if (!newStudentUsername) return;

        setIsAdding(true);
        try {
            await ClassroomService.addStudent(selectedClassroom.classroomId, newStudentUsername);
            setNewStudentUsername('');
            setAddStudentOpen(false);
            onRefresh();
        } catch (err: unknown) {
            setAddStudentError(getErrMsg(err, 'Failed to add student.'));
        } finally {
            setIsAdding(false);
        }
    };

    const handleBulkUpload = async () => {
        setBulkUploadError(null);
        if (!uploadFile) return;

        setIsUploading(true);
        setUploadFailures([]);

        try {
            const response = await ClassroomService.bulkAddStudents(selectedClassroom.classroomId, uploadFile);
            if (response.data?.length > 0) setUploadFailures(response.data);
            else { setAddStudentOpen(false); setUploadFile(null); }
            onRefresh();
        } catch (err: unknown) {
            setBulkUploadError(getErrMsg(err, 'Failed to upload students.'));
        } finally {
            setIsUploading(false);
        }
    };

    const parseProblemInput = (input: string, platform: 'LEETCODE' | 'CODEFORCES'): { slug: string; detectedPlatform: 'LEETCODE' | 'CODEFORCES'; problemNumber?: string } => {
        const trimmed = input.trim();
        const cfMatch = trimmed.match(/(?:problemset\/problem|contest|gym)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/i);
        if (cfMatch) {
            const pNum = `${cfMatch[1]}${cfMatch[2].toUpperCase()}`;
            return { slug: pNum, detectedPlatform: 'CODEFORCES', problemNumber: pNum };
        }

        const lcMatch = trimmed.match(/problems\/([a-zA-Z0-9_-]+)/i);
        if (lcMatch) {
            return { slug: lcMatch[1].toLowerCase(), detectedPlatform: 'LEETCODE' };
        }

        if (platform === 'CODEFORCES') {
            const cleanCF = trimmed.replace('/', '').toUpperCase();
            return { slug: cleanCF, detectedPlatform: 'CODEFORCES', problemNumber: cleanCF };
        }

        return { slug: trimmed.toLowerCase(), detectedPlatform: 'LEETCODE' };
    };

    const handleAssignQuestion = async () => {
        setAssignQuestionError(null);
        if (!assignmentData.titleSlug.trim()) {
            setAssignQuestionError('Please enter a problem URL or problem slug/ID.');
            return;
        }

        const parsed = parseProblemInput(assignmentData.titleSlug, assignmentData.platform);
        const effectivePlatform = parsed.detectedPlatform || assignmentData.platform;

        const start = Math.floor(Date.now() / 1000);
        const deadlineDate = new Date(assignmentData.deadline);
        const end = Math.floor(deadlineDate.getTime() / 1000);

        if (isNaN(end) || end <= start) {
            setAssignQuestionError('Please select a valid future deadline date and time.');
            return;
        }

        try {
            await ClassroomService.assignQuestion(selectedClassroom.classroomId, {
                platform: effectivePlatform,
                title: assignmentData.title.trim() || undefined,
                titleSlug: parsed.slug,
                questionLink: assignmentData.titleSlug.trim().startsWith('http') ? assignmentData.titleSlug.trim() : undefined,
                start,
                end,
            });
            setAssignQuestionOpen(false);
            setAssignmentData({
                platform: 'LEETCODE',
                title: '',
                titleSlug: '',
                deadline: getDefaultDeadline(3),
            });
            onRefresh();
        } catch (err: unknown) {
            setAssignQuestionError(getErrMsg(err, 'Failed to assign question.'));
        }
    };

    const handleCreatePath = async () => {
        setCreatePathError(null);
        try {
            const sanitizedQuestions = pathQuestions.map(({ platform, title, titleSlug, daysToComplete }) => {
                const p = platform || 'LEETCODE';
                const parsed = parseProblemInput(titleSlug, p);
                return {
                    platform: parsed.detectedPlatform || p,
                    title: title?.trim() || undefined,
                    titleSlug: parsed.slug,
                    daysToComplete: daysToComplete || 3
                };
            });
            await PathService.createPath({ mentorId, title: newPath.title, description: newPath.description, questions: sanitizedQuestions });
            setCreatePathOpen(false);
            setNewPath({ title: '', description: '' });
            setPathQuestions([{ tempId: `question-reset-${Date.now()}`, platform: 'LEETCODE', title: '', titleSlug: '', daysToComplete: 3 }]);
            onRefresh();
        } catch (err: unknown) {
            setCreatePathError(getErrMsg(err, 'Failed to create learning path.'));
        }
    };

    const handleAssignPath = async () => {
        setAssignPathError(null);
        try {
            await PathService.assignPath(selectedPathId, selectedClassroom.classroomId);
            setAssignPathOpen(false);
            setSelectedPathId('');
            onRefresh();
        } catch (err: unknown) {
            setAssignPathError(getErrMsg(err, 'Failed to assign learning path.'));
        }
    };

    const openCreateFromAssign = () => {
        setAssignPathOpen(false);
        setCreatePathOpen(true);
    };

    const handleDeleteClass = async () => {
        setDeleteClassError(null);
        setIsDeleting(true);
        try {
            await ClassroomService.deleteClassroom(selectedClassroom.classroomId, mentorId);
            setDeleteClassOpen(false);
            onRefresh();
        } catch (err: unknown) {
            setDeleteClassError(getErrMsg(err, 'Failed to delete classroom.'));
        } finally {
            setIsDeleting(false);
        }
    };

    const inputClasses = "bg-zinc-100/90 dark:bg-[#1a1b2e]/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#5b4fff] rounded-xl transition-all h-10";
    const dialogContentClasses = "bg-white dark:bg-[#111111] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white sm:rounded-2xl shadow-2xl";

    return (
        <div className="flex flex-wrap gap-3">
            {/* 1. ADD STUDENT DIALOG */}
            <Dialog open={addStudentOpen} onOpenChange={(open) => { setAddStudentOpen(open); if(!open) { setAddStudentError(null); setBulkUploadError(null); } }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        <UserPlusIcon className="w-4 h-4 mr-2" />Add Student
                    </Button>
                </DialogTrigger>
                <DialogContent className={`sm:max-w-lg ${dialogContentClasses}`}>
                    <DialogHeader>
                        <DialogTitle className="text-zinc-900 dark:text-white text-xl font-bold flex items-center gap-2.5">
                            <UserPlusIcon className="w-5 h-5 text-[#5b4fff]" />
                            Add Students
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">

                        {/* 1. Add Single Student */}
                        <div className="p-4 bg-zinc-50/80 dark:bg-[#161726]/50 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 space-y-2.5">
                            <Label className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-black flex items-center justify-center">1</span>
                                Add Single Student
                            </Label>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Enter a student's LeetCode username or Codeforces handle.
                            </p>

                            <ErrorBanner message={addStudentError} className="mb-2" />

                            <div className="flex gap-2 pt-1">
                                <Input
                                    placeholder="LeetCode username or Codeforces handle"
                                    value={newStudentUsername}
                                    onChange={(e) => {
                                        setNewStudentUsername(e.target.value);
                                        if (addStudentError) setAddStudentError(null);
                                    }}
                                    className={inputClasses}
                                />
                                <Button
                                    onClick={handleAddStudent}
                                    disabled={!newStudentUsername || isAdding}
                                    className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl px-5 font-semibold shrink-0 shadow-sm"
                                >
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                                </Button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#111111] px-3 text-zinc-400 font-semibold tracking-wider">OR</span></div>
                        </div>

                        {/* 2. Bulk Import via CSV */}
                        <div className="p-4 bg-zinc-50/80 dark:bg-[#161726]/50 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-black flex items-center justify-center">2</span>
                                    Bulk Import (CSV)
                                </Label>
                                <span className="text-[11px] font-medium text-zinc-500">.csv format</span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Upload a CSV file containing LeetCode usernames or Codeforces handles in a single column.
                            </p>

                            <ErrorBanner message={bulkUploadError} className="mb-2" />

                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[#5b4fff]/50 dark:hover:border-[#5b4fff]/50 rounded-xl p-4 cursor-pointer bg-white/60 dark:bg-[#12131e]/50 hover:bg-[#5b4fff]/5 transition-all group">
                                <UploadCloud className="w-7 h-7 text-zinc-400 group-hover:text-[#5b4fff] transition-colors mb-1.5" />
                                {uploadFile ? (
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-xs">{uploadFile.name}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{(uploadFile.size / 1024).toFixed(1)} KB • Click to choose a different file</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            <span className="text-[#5b4fff] dark:text-[#968fff] font-bold">Choose CSV file</span> or drag & drop
                                        </p>
                                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Student handles list (.csv)</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        setUploadFile(e.target.files ? e.target.files[0] : null);
                                        if (bulkUploadError) setBulkUploadError(null);
                                    }}
                                />
                            </label>

                            {uploadFile && (
                                <Button
                                    onClick={handleBulkUpload}
                                    disabled={isUploading}
                                    className="w-full bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl h-10 font-semibold shadow-sm"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                                    Import {uploadFile.name}
                                </Button>
                            )}

                            {uploadFailures.length > 0 && (
                                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                                    <span className="font-bold">Failed to add ({uploadFailures.length}):</span>
                                    <ul className="list-disc pl-5 mt-1 max-h-24 overflow-y-auto custom-scrollbar">{uploadFailures.map((f) => <li key={`fail-${f}`}>{f}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 2. ASSIGN QUESTION DIALOG */}
            <Dialog open={assignQuestionOpen} onOpenChange={(open) => { setAssignQuestionOpen(open); if(!open) setAssignQuestionError(null); }}>
                <DialogTrigger asChild>
                    <Button className="bg-white dark:bg-[#222] text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#333] border border-zinc-200 dark:border-transparent rounded-xl transition-colors shadow-sm">
                        <ClipboardList className="w-4 h-4 mr-2 text-[#5b4fff] dark:text-[#968fff]" />Assign Question
                    </Button>
                </DialogTrigger>
                <DialogContent className={`sm:max-w-xl ${dialogContentClasses}`}>
                    <DialogHeader><DialogTitle className="text-zinc-900 dark:text-white text-xl font-bold">Assign Question</DialogTitle></DialogHeader>

                    <ErrorBanner message={assignQuestionError} />

                    <div className="space-y-4 py-3">
                        {/* Platform Selector */}
                        <div className="space-y-1.5">
                            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase font-semibold">Platform</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignmentData({ ...assignmentData, platform: 'LEETCODE' })}
                                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        assignmentData.platform === 'LEETCODE'
                                            ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-[#ffa116] shadow-sm'
                                            : 'bg-zinc-100 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <span>LeetCode</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssignmentData({ ...assignmentData, platform: 'CODEFORCES' })}
                                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        assignmentData.platform === 'CODEFORCES'
                                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-sm'
                                            : 'bg-zinc-100 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    <span>Codeforces</span>
                                </button>
                            </div>
                        </div>

                        {/* Problem URL or Slug/ID */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase font-semibold">
                                    Problem URL
                                </Label>
                                <span className="text-[11px] text-zinc-500">Paste whole URL or ID</span>
                            </div>
                            <Input
                                placeholder={
                                    assignmentData.platform === 'CODEFORCES'
                                        ? 'https://codeforces.com/problemset/problem/4/A or 4A'
                                        : 'https://leetcode.com/problems/two-sum/ or two-sum'
                                }
                                value={assignmentData.titleSlug}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    let newPlatform = assignmentData.platform;

                                    // Auto-detect platform from URL
                                    if (val.toLowerCase().includes('codeforces.com')) {
                                        newPlatform = 'CODEFORCES';
                                    } else if (val.toLowerCase().includes('leetcode.com') || val.toLowerCase().includes('leetcode.cn')) {
                                        newPlatform = 'LEETCODE';
                                    }

                                    setAssignmentData({
                                        ...assignmentData,
                                        titleSlug: val,
                                        platform: newPlatform,
                                    });
                                    if (assignQuestionError) setAssignQuestionError(null);
                                }}
                                className={inputClasses}
                            />
                            {/* Extracted preview badge */}
                            {assignmentData.titleSlug.trim().length > 0 && (() => {
                                const parsed = parseProblemInput(assignmentData.titleSlug, assignmentData.platform);
                                return (
                                    <div className="flex items-center gap-2 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        <span className="font-semibold text-zinc-500">Extracted:</span>
                                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-md font-mono text-[11px] border border-zinc-200 dark:border-zinc-700">
                                            {parsed.detectedPlatform === 'CODEFORCES'
                                                ? `CF Problem #${parsed.problemNumber || parsed.slug}`
                                                : `LeetCode: ${parsed.slug}`}
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Problem Title (Optional) */}
                        <div className="space-y-1.5">
                            <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase font-semibold">
                                Problem Title <span className="text-zinc-500 font-normal lowercase">(optional - auto-fetched from platform)</span>
                            </Label>
                            <Input
                                placeholder={assignmentData.platform === 'CODEFORCES' ? 'Watermelon (or leave empty to auto-fetch)' : 'Two Sum (or leave empty to auto-fetch)'}
                                value={assignmentData.title}
                                onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
                                className={inputClasses}
                            />
                        </div>

                        {/* Deadline Selector */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-zinc-700 dark:text-zinc-300 text-xs uppercase font-semibold">Assignment Deadline</Label>
                                <span className="text-[11px] text-zinc-500">Pick any custom date & time</span>
                            </div>
                            <Input
                                type="datetime-local"
                                value={assignmentData.deadline}
                                min={getDefaultDeadline(0)}
                                onChange={(e) => setAssignmentData({ ...assignmentData, deadline: e.target.value })}
                                className={inputClasses}
                            />
                            {/* Quick Presets */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] text-zinc-500 font-medium mr-1">Quick presets:</span>
                                {[
                                    { label: '+1 Day', days: 1 },
                                    { label: '+2 Days', days: 2 },
                                    { label: '+3 Days', days: 3 },
                                    { label: '+5 Days', days: 5 },
                                    { label: '+1 Week', days: 7 },
                                    { label: '+2 Weeks', days: 14 },
                                    { label: '+1 Month', days: 30 },
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => setAssignmentData({ ...assignmentData, deadline: getDefaultDeadline(preset.days) })}
                                        className="text-[11px] bg-zinc-100 dark:bg-zinc-800/80 hover:bg-[#5b4fff]/10 dark:hover:bg-[#5b4fff]/20 text-zinc-700 dark:text-zinc-300 hover:text-[#5b4fff] dark:hover:text-[#b4afff] px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700/60 transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => setAssignQuestionOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignQuestion} className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl">Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. ASSIGN PATH DIALOG */}
            <Dialog open={assignPathOpen} onOpenChange={(open) => { setAssignPathOpen(open); if(!open) setAssignPathError(null); }}>
                <DialogTrigger asChild><Button className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white border border-transparent rounded-xl shadow-lg shadow-[#5b4fff]/20 transition-all hover:-translate-y-0.5"><Map className="w-4 h-4 mr-2" /> Assign Path</Button></DialogTrigger>
                <DialogContent className={`sm:max-w-lg ${dialogContentClasses}`}>
                    <DialogHeader><DialogTitle className="text-zinc-900 dark:text-white text-xl font-bold">Assign Learning Path</DialogTitle></DialogHeader>

                    <ErrorBanner message={assignPathError} />

                    <div className="space-y-4 py-4">
                        {learningPaths.length === 0 ? (
                            <div className="text-center p-6 bg-zinc-50 dark:bg-[#1a1b2e]/30 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">You haven't built any roadmaps yet.</p>
                                <Button onClick={openCreateFromAssign} className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl">
                                    <PlusIcon className="w-4 h-4 mr-2" /> Create Your First Path
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-700 dark:text-zinc-300">Select an existing Path</Label>
                                    <Select value={selectedPathId} onValueChange={(v) => { setSelectedPathId(v); if(assignPathError) setAssignPathError(null); }}>
                                        <SelectTrigger className={inputClasses}><SelectValue placeholder="Choose a roadmap..." /></SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1a1b2e] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl">
                                            {learningPaths.map(path => <SelectItem key={path.id} value={path.id || ''} className="focus:bg-[#5b4fff]/10 dark:focus:bg-[#5b4fff]/20 focus:text-zinc-900 dark:focus:text-white">{path.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200 dark:border-zinc-800" /></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-[#111111] px-2 text-zinc-500 font-medium tracking-widest">Or</span></div>
                                </div>
                                <Button variant="outline" className="w-full border-[#5b4fff]/30 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/10 bg-transparent rounded-xl h-12" onClick={openCreateFromAssign}>
                                    <PlusIcon className="w-4 h-4 mr-2" /> Create New Learning Path
                                </Button>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAssignPath} disabled={!selectedPathId} className="w-full sm:w-auto bg-[#5b4fff] hover:bg-[#4a3fdf] text-white disabled:opacity-50 rounded-xl">
                            Assign to All Students
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 4. CREATE PATH DIALOG */}
            <Dialog open={createPathOpen} onOpenChange={(open) => { setCreatePathOpen(open); if(!open) setCreatePathError(null); }}>
                <DialogContent className={`sm:max-w-3xl ${dialogContentClasses}`}>
                    <DialogHeader>
                        <DialogTitle className="text-zinc-900 dark:text-white text-xl font-bold flex items-center gap-2.5">
                            <Map className="w-5 h-5 text-[#5b4fff]" /> Build a Learning Path
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={createPathError} />

                    <div className="space-y-5 py-2 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-400">Path Title</Label>
                                <Input
                                    placeholder="e.g. Dynamic Programming Roadmap"
                                    className={inputClasses}
                                    value={newPath.title}
                                    onChange={e => { setNewPath({...newPath, title: e.target.value}); if(createPathError) setCreatePathError(null); }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-400">Description</Label>
                                <Input
                                    placeholder="e.g. Master classic DP patterns from 1D to trees"
                                    className={inputClasses}
                                    value={newPath.description}
                                    onChange={e => setNewPath({...newPath, description: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2.5">
                                <div>
                                    <Label className="text-sm font-bold text-zinc-900 dark:text-white">
                                        Questions in this Path ({pathQuestions.length})
                                    </Label>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Add problem slugs or IDs and specify days allocated per problem
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl h-8.5 font-medium px-3"
                                    onClick={() => setPathQuestions(prev => [...prev, { tempId: `question-new-${Date.now()}-${prev.length}`, platform: 'LEETCODE', title: '', titleSlug: '', daysToComplete: 3 }])}
                                >
                                    <PlusIcon className="w-3.5 h-3.5 mr-1 text-[#5b4fff]" weight="bold" /> Add Question
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {pathQuestions.map((q, idx) => (
                                    <div key={q.tempId} className="bg-zinc-50/80 dark:bg-[#161726]/60 p-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800/80 space-y-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                                            {/* Question Badge */}
                                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                                                Q{idx + 1}
                                            </span>

                                            {/* Platform Selector */}
                                            <div className="flex rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 text-xs shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQs = [...pathQuestions];
                                                        newQs[idx].platform = 'LEETCODE';
                                                        setPathQuestions(newQs);
                                                    }}
                                                    className={`px-3 py-2 transition-all text-xs font-bold cursor-pointer ${
                                                        (q.platform ?? 'LEETCODE') === 'LEETCODE'
                                                            ? 'bg-amber-500/20 text-amber-600 dark:text-[#ffa116]'
                                                            : 'bg-zinc-100 dark:bg-[#1c1d2d] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                                    }`}
                                                >
                                                    LC
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQs = [...pathQuestions];
                                                        newQs[idx].platform = 'CODEFORCES';
                                                        setPathQuestions(newQs);
                                                    }}
                                                    className={`px-3 py-2 transition-all text-xs font-bold cursor-pointer ${
                                                        q.platform === 'CODEFORCES'
                                                            ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                                                            : 'bg-zinc-100 dark:bg-[#1c1d2d] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                                    }`}
                                                >
                                                    CF
                                                </button>
                                            </div>

                                            {/* Identifier Input */}
                                            <div className="flex-1 min-w-[180px]">
                                                <Input
                                                    placeholder={q.platform === 'CODEFORCES' ? 'Problem ID (e.g. 4A or CF link)' : 'Slug (e.g. two-sum or LC link)'}
                                                    className={inputClasses}
                                                    value={q.titleSlug}
                                                    onChange={e => {
                                                        const newQs = [...pathQuestions];
                                                        newQs[idx].titleSlug = e.target.value;
                                                        setPathQuestions(newQs);
                                                    }}
                                                />
                                            </div>

                                            {/* Days with clear badge */}
                                            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#1c1d2d] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 h-10 shrink-0">
                                                <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-10 bg-transparent text-sm font-semibold text-center text-zinc-900 dark:text-white focus:outline-none"
                                                    value={q.daysToComplete}
                                                    onChange={e => {
                                                        const newQs = [...pathQuestions];
                                                        newQs[idx].daysToComplete = Number.parseInt(e.target.value) || 1;
                                                        setPathQuestions(newQs);
                                                    }}
                                                />
                                                <span className="text-xs text-zinc-500 font-medium">days</span>
                                            </div>

                                            {/* Trash button */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 shrink-0 rounded-xl"
                                                onClick={() => setPathQuestions(prev => prev.filter(item => item.tempId !== q.tempId))}
                                                disabled={pathQuestions.length === 1}
                                                title="Remove question"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Optional Title Input */}
                                        <div>
                                            <Input
                                                placeholder="Optional Title (e.g. Watermelon or Two Sum)"
                                                className={`h-9 text-xs ${inputClasses}`}
                                                value={q.title ?? ''}
                                                onChange={e => {
                                                    const newQs = [...pathQuestions];
                                                    newQs[idx].title = e.target.value;
                                                    setPathQuestions(newQs);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            variant="outline"
                            className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                            onClick={() => setCreatePathOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreatePath}
                            disabled={!newPath.title || !pathQuestions[0].titleSlug}
                            className="bg-[#5b4fff] hover:bg-[#4a3ecc] text-white disabled:opacity-50 rounded-xl font-semibold shadow-md shadow-[#5b4fff]/20"
                        >
                            Save Learning Path
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 5. DELETE CLASSROOM DIALOG */}
            <Dialog open={deleteClassOpen} onOpenChange={(open) => { setDeleteClassOpen(open); if(!open) setDeleteClassError(null); }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" />Delete Class
                    </Button>
                </DialogTrigger>
                <DialogContent className={dialogContentClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center text-xl font-bold">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Delete Classroom
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={deleteClassError} />

                    <div className="py-4">
                        <p className="text-zinc-700 dark:text-zinc-300">
                            Are you sure you want to delete <strong className="text-zinc-900 dark:text-white">{selectedClassroom.className}</strong>?
                        </p>
                        <p className="text-sm text-zinc-500 mt-2">
                            This action cannot be undone. All tracking for this specific class will be removed from your dashboard.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => setDeleteClassOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteClass} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Yes, Delete Class
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}