import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { UserPlusIcon, ClipboardTextIcon as ClipboardList, MapTrifoldIcon as Map, PlusIcon, TrashIcon as Trash2, CloudArrowUpIcon as UploadCloud, SpinnerIcon as Loader2, WarningIcon as AlertTriangle } from '@phosphor-icons/react';
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
                return {
                    platform: p,
                    title: title?.trim() || undefined,
                    titleSlug: parseProblemInput(titleSlug, p),
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

    const inputClasses = "bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] rounded-xl transition-all h-10";
    const dialogContentClasses = "bg-[#111111] border-zinc-800 text-white sm:rounded-2xl";

    return (
        <div className="flex flex-wrap gap-3">
            {/* 1. ADD STUDENT DIALOG */}
            <Dialog open={addStudentOpen} onOpenChange={(open) => { setAddStudentOpen(open); if(!open) { setAddStudentError(null); setBulkUploadError(null); } }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 rounded-xl transition-colors">
                        <UserPlusIcon className="w-4 h-4 mr-2" />Add Student
                    </Button>
                </DialogTrigger>
                <DialogContent className={dialogContentClasses}>
                    <DialogHeader><DialogTitle className="text-white text-xl font-bold">Add Students</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">

                        <div className="space-y-2 p-4 bg-[#1a1b2e]/40 rounded-xl border border-zinc-800">
                            <Label className="text-[#968fff] font-bold">1. Add Single Student</Label>

                            <ErrorBanner message={addStudentError} className="mb-2" />

                            <div className="flex gap-2">
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
                                    className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl w-20"
                                >
                                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3 p-4 bg-[#1a1b2e]/40 rounded-xl border border-zinc-800">
                            <Label className="text-emerald-400 font-bold">2. Bulk Import (CSV)</Label>

                            <ErrorBanner message={bulkUploadError} className="mb-2" />

                            <p className="text-xs text-zinc-400">Upload a .csv file with student identifiers (LeetCode usernames or Codeforces handles).</p>
                            <div className="flex gap-2">
                                <Input type="file" accept=".csv" onChange={(e) => { setUploadFile(e.target.files ? e.target.files[0] : null); if(bulkUploadError) setBulkUploadError(null); }} className={`cursor-pointer file:bg-emerald-500/10 file:text-emerald-400 file:border-0 file:rounded-md file:px-2 file:py-1 ${inputClasses}`} />
                                <Button onClick={handleBulkUpload} disabled={!uploadFile || isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />} Import
                                </Button>
                            </div>
                            {uploadFailures.length > 0 && (
                                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
                                    <span className="font-bold">Failed to add:</span>
                                    <ul className="list-disc pl-5 mt-1">{uploadFailures.map((f) => <li key={`fail-${f}`}>{f}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 2. ASSIGN QUESTION DIALOG */}
            <Dialog open={assignQuestionOpen} onOpenChange={(open) => { setAssignQuestionOpen(open); if(!open) setAssignQuestionError(null); }}>
                <DialogTrigger asChild>
                    <Button className="bg-[#222] text-white hover:bg-[#333] border border-transparent rounded-xl transition-colors">
                        <ClipboardList className="w-4 h-4 mr-2 text-[#968fff]" />Assign Question
                    </Button>
                </DialogTrigger>
                <DialogContent className={dialogContentClasses}>
                    <DialogHeader><DialogTitle className="text-white text-xl font-bold">Assign Question</DialogTitle></DialogHeader>

                    <ErrorBanner message={assignQuestionError} />

                    <div className="space-y-4 py-3">
                        {/* Platform Selector */}
                        <div className="space-y-1.5">
                            <Label className="text-zinc-300 text-xs uppercase font-semibold">Platform</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAssignmentData({ ...assignmentData, platform: 'LEETCODE' })}
                                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        assignmentData.platform === 'LEETCODE'
                                            ? 'bg-[#ffa116]/15 border-[#ffa116] text-[#ffa116] shadow-md shadow-[#ffa116]/10'
                                            : 'bg-[#1a1a1a] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                                >
                                    <span>LeetCode</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAssignmentData({ ...assignmentData, platform: 'CODEFORCES' })}
                                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                        assignmentData.platform === 'CODEFORCES'
                                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-400 shadow-md shadow-cyan-500/10'
                                            : 'bg-[#1a1a1a] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                                >
                                    <span>Codeforces</span>
                                </button>
                            </div>
                        </div>

                        {/* Problem URL or Slug/ID */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-zinc-300 text-xs uppercase font-semibold">
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
                                    <div className="flex items-center gap-2 pt-1 text-xs text-zinc-400">
                                        <span className="font-semibold text-zinc-500">Extracted:</span>
                                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
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
                            <Label className="text-zinc-300 text-xs uppercase font-semibold">
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
                                <Label className="text-zinc-300 text-xs uppercase font-semibold">Assignment Deadline</Label>
                                <span className="text-[11px] text-zinc-500">Pick any custom date & time</span>
                            </div>
                            <Input
                                type="datetime-local"
                                value={assignmentData.deadline}
                                min={getDefaultDeadline(0)}
                                onChange={(e) => setAssignmentData({ ...assignmentData, deadline: e.target.value })}
                                className={`${inputClasses} [color-scheme:dark]`}
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
                                        className="text-[11px] bg-zinc-800/80 hover:bg-[#5b4fff]/20 text-zinc-300 hover:text-[#b4afff] px-2 py-0.5 rounded-md border border-zinc-700/60 transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 rounded-xl" onClick={() => setAssignQuestionOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignQuestion} className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl">Assign</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. ASSIGN PATH DIALOG */}
            <Dialog open={assignPathOpen} onOpenChange={(open) => { setAssignPathOpen(open); if(!open) setAssignPathError(null); }}>
                <DialogTrigger asChild><Button className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white border border-transparent rounded-xl shadow-lg shadow-[#5b4fff]/20 transition-all hover:-translate-y-0.5"><Map className="w-4 h-4 mr-2" /> Assign Path</Button></DialogTrigger>
                <DialogContent className={dialogContentClasses}>
                    <DialogHeader><DialogTitle className="text-white text-xl font-bold">Assign Learning Path</DialogTitle></DialogHeader>

                    <ErrorBanner message={assignPathError} />

                    <div className="space-y-4 py-4">
                        {learningPaths.length === 0 ? (
                            <div className="text-center p-6 bg-[#1a1b2e]/30 rounded-xl border border-dashed border-zinc-700">
                                <p className="text-sm text-zinc-400 mb-4">You haven't built any roadmaps yet.</p>
                                <Button onClick={openCreateFromAssign} className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl">
                                    <PlusIcon className="w-4 h-4 mr-2" /> Create Your First Path
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Select an existing Path</Label>
                                    <Select value={selectedPathId} onValueChange={(v) => { setSelectedPathId(v); if(assignPathError) setAssignPathError(null); }}>
                                        <SelectTrigger className={inputClasses}><SelectValue placeholder="Choose a roadmap..." /></SelectTrigger>
                                        <SelectContent className="bg-[#1a1b2e] border-zinc-800 text-white rounded-xl">
                                            {learningPaths.map(path => <SelectItem key={path.id} value={path.id || ''} className="focus:bg-[#5b4fff]/20 focus:text-white">{path.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#111111] px-2 text-zinc-500 font-medium tracking-widest">Or</span></div>
                                </div>
                                <Button variant="outline" className="w-full border-[#5b4fff]/30 text-[#968fff] hover:bg-[#5b4fff]/10 bg-transparent rounded-xl h-12" onClick={openCreateFromAssign}>
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
                <DialogContent className={`max-w-2xl ${dialogContentClasses}`}>
                    <DialogHeader><DialogTitle className="text-white text-xl font-bold">Build a Learning Path</DialogTitle></DialogHeader>

                    <ErrorBanner message={createPathError} />

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input className={inputClasses} value={newPath.title} onChange={e => { setNewPath({...newPath, title: e.target.value}); if(createPathError) setCreatePathError(null); }} /></div>
                            <div className="space-y-2"><Label className="text-zinc-300">Description</Label><Input className={inputClasses} value={newPath.description} onChange={e => setNewPath({...newPath, description: e.target.value})} /></div>
                        </div>
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-zinc-300">Questions</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 rounded-lg h-8"
                                    onClick={() => setPathQuestions(prev => [...prev, { tempId: `question-new-${Date.now()}-${prev.length}`, platform: 'LEETCODE', title: '', titleSlug: '', daysToComplete: 3 }])}
                                >
                                    <PlusIcon className="w-3 h-3 mr-1" /> Add
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {pathQuestions.map((q, idx) => (
                                    <div key={q.tempId} className="bg-[#1a1b2e]/40 p-3 rounded-xl border border-zinc-800/60 space-y-2">
                                        <div className="flex items-center gap-2">
                                            {/* Platform Selector */}
                                            <div className="flex rounded-lg overflow-hidden border border-zinc-800 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newQs = [...pathQuestions];
                                                        newQs[idx].platform = 'LEETCODE';
                                                        setPathQuestions(newQs);
                                                    }}
                                                    className={`px-2.5 py-1.5 transition-all text-xs font-semibold cursor-pointer ${
                                                        (q.platform ?? 'LEETCODE') === 'LEETCODE'
                                                            ? 'bg-[#ffa116]/20 text-[#ffa116]'
                                                            : 'bg-[#141522] text-zinc-500 hover:text-zinc-300'
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
                                                    className={`px-2.5 py-1.5 transition-all text-xs font-semibold cursor-pointer ${
                                                        q.platform === 'CODEFORCES'
                                                            ? 'bg-cyan-500/20 text-cyan-400'
                                                            : 'bg-[#141522] text-zinc-500 hover:text-zinc-300'
                                                    }`}
                                                >
                                                    CF
                                                </button>
                                            </div>
                                            <div className="flex-1">
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
                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Days"
                                                    className={inputClasses}
                                                    value={q.daysToComplete}
                                                    onChange={e => {
                                                        const newQs = [...pathQuestions];
                                                        newQs[idx].daysToComplete = Number.parseInt(e.target.value) || 1;
                                                        setPathQuestions(newQs);
                                                    }}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                                onClick={() => setPathQuestions(prev => prev.filter(item => item.tempId !== q.tempId))}
                                                disabled={pathQuestions.length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="pl-1">
                                            <Input
                                                placeholder="Optional Title (e.g. Watermelon or Two Sum)"
                                                className={`h-8 text-xs ${inputClasses}`}
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
                    <DialogFooter><Button onClick={handleCreatePath} disabled={!newPath.title || !pathQuestions[0].titleSlug} className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white disabled:opacity-50 rounded-xl">Save Path</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 5. DELETE CLASSROOM DIALOG */}
            <Dialog open={deleteClassOpen} onOpenChange={(open) => { setDeleteClassOpen(open); if(!open) setDeleteClassError(null); }}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" />Delete Class
                    </Button>
                </DialogTrigger>
                <DialogContent className={dialogContentClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-400 flex items-center text-xl font-bold">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            Delete Classroom
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={deleteClassError} />

                    <div className="py-4">
                        <p className="text-zinc-300">
                            Are you sure you want to delete <strong className="text-white">{selectedClassroom.className}</strong>?
                        </p>
                        <p className="text-sm text-zinc-500 mt-2">
                            This action cannot be undone. All tracking for this specific class will be removed from your dashboard.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-zinc-800 rounded-xl" onClick={() => setDeleteClassOpen(false)} disabled={isDeleting}>
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