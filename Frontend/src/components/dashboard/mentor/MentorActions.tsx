import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { UserPlus, ClipboardList, Map, Plus, Trash2, UploadCloud, Loader2, AlertTriangle} from 'lucide-react';
import { ClassroomService, PathService } from '@/services/endpoints.ts';
import type { ClassroomDashboardDTO, LearningPath, PathQuestion } from '@/types';
import {ErrorBanner} from "@/components/ui/ErrorBanner.tsx";// <-- 1. Import the Banner

interface MentorActionsProps {
    mentorId: string;
    selectedClassroom: ClassroomDashboardDTO;
    learningPaths: LearningPath[];
    onRefresh: () => void;
}

export function MentorActions({ mentorId, selectedClassroom, learningPaths, onRefresh }: MentorActionsProps) {
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

    const [assignmentData, setAssignmentData] = useState({ titleSlug: '', deadline: '3' });
    const [selectedPathId, setSelectedPathId] = useState<string>('');
    const [newPath, setNewPath] = useState({ title: '', description: '' });
    const [pathQuestions, setPathQuestions] = useState<PathQuestion[]>([{ titleSlug: '', daysToComplete: 3 }]);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- NEW: Error States for all actions ---
    const [addStudentError, setAddStudentError] = useState<string | null>(null);
    const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
    const [assignQuestionError, setAssignQuestionError] = useState<string | null>(null);
    const [assignPathError, setAssignPathError] = useState<string | null>(null);
    const [createPathError, setCreatePathError] = useState<string | null>(null);
    const [deleteClassError, setDeleteClassError] = useState<string | null>(null);

    const [isAdding, setIsAdding] = useState(false);

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
        } catch (err: any) {
            setAddStudentError(err.message); // Magic mapping
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
        } catch (err: any) {
            setBulkUploadError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleAssignQuestion = async () => {
        setAssignQuestionError(null);
        const start = Math.floor(Date.now() / 1000);
        const end = start + (parseInt(assignmentData.deadline) * 86400);

        try {
            await ClassroomService.assignQuestion(selectedClassroom.classroomId, assignmentData.titleSlug, start, end);
            setAssignQuestionOpen(false);
            setAssignmentData({ titleSlug: '', deadline: '3' });
            onRefresh();
        } catch (err: any) {
            setAssignQuestionError(err.message);
        }
    };

    const handleCreatePath = async () => {
        setCreatePathError(null);
        try {
            await PathService.createPath({ mentorId, title: newPath.title, description: newPath.description, questions: pathQuestions });
            setCreatePathOpen(false);
            setNewPath({ title: '', description: '' });
            setPathQuestions([{ titleSlug: '', daysToComplete: 3 }]);
            onRefresh();
        } catch (err: any) {
            setCreatePathError(err.message);
        }
    };

    const handleAssignPath = async () => {
        setAssignPathError(null);
        try {
            await PathService.assignPath(selectedPathId, selectedClassroom.classroomId);
            setAssignPathOpen(false);
            setSelectedPathId('');
            onRefresh();
        } catch (err: any) {
            setAssignPathError(err.message);
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
        } catch (err: any) {
            setDeleteClassError(err.message);
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
                        <UserPlus className="w-4 h-4 mr-2" />Add Student
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
                                    placeholder="LeetCode Username"
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

                            <p className="text-xs text-zinc-400">Upload a .csv file with LeetCode usernames.</p>
                            <div className="flex gap-2">
                                <Input type="file" accept=".csv" onChange={(e) => { setUploadFile(e.target.files ? e.target.files[0] : null); if(bulkUploadError) setBulkUploadError(null); }} className={`cursor-pointer file:bg-emerald-500/10 file:text-emerald-400 file:border-0 file:rounded-md file:px-2 file:py-1 ${inputClasses}`} />
                                <Button onClick={handleBulkUpload} disabled={!uploadFile || isUploading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />} Import
                                </Button>
                            </div>
                            {uploadFailures.length > 0 && (
                                <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-sm text-rose-400">
                                    <span className="font-bold">Failed to add:</span>
                                    <ul className="list-disc pl-5 mt-1">{uploadFailures.map((f, i) => <li key={i}>{f}</li>)}</ul>
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

                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label className="text-zinc-300">Problem Slug</Label><Input placeholder="two-sum" value={assignmentData.titleSlug} onChange={(e) => { setAssignmentData({ ...assignmentData, titleSlug: e.target.value }); if(assignQuestionError) setAssignQuestionError(null); }} className={inputClasses} /></div>
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Deadline</Label>
                            <Select value={assignmentData.deadline} onValueChange={(v) => setAssignmentData({ ...assignmentData, deadline: v })}>
                                <SelectTrigger className={inputClasses}><SelectValue placeholder="Select deadline" /></SelectTrigger>
                                <SelectContent className="bg-[#1a1b2e] border-zinc-800 text-white rounded-xl">
                                    <SelectItem value="1" className="focus:bg-[#5b4fff]/20 focus:text-white">1 Day</SelectItem>
                                    <SelectItem value="3" className="focus:bg-[#5b4fff]/20 focus:text-white">3 Days</SelectItem>
                                    <SelectItem value="7" className="focus:bg-[#5b4fff]/20 focus:text-white">1 Week</SelectItem>
                                </SelectContent>
                            </Select>
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
                                    <Plus className="w-4 h-4 mr-2" /> Create Your First Path
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
                                    <Plus className="w-4 h-4 mr-2" /> Create New Learning Path
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
                                <Button type="button" variant="outline" size="sm" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 rounded-lg h-8" onClick={() => setPathQuestions([...pathQuestions, { titleSlug: '', daysToComplete: 3 }])}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                            </div>
                            <div className="space-y-3">
                                {pathQuestions.map((q, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-[#1a1b2e]/40 p-3 rounded-xl border border-zinc-800/60">
                                        <div className="flex-1"><Label className="text-xs text-zinc-400">Slug</Label><Input className={`mt-1 ${inputClasses}`} value={q.titleSlug} onChange={e => { const newQs = [...pathQuestions]; newQs[idx].titleSlug = e.target.value; setPathQuestions(newQs); }} /></div>
                                        <div className="w-32"><Label className="text-xs text-zinc-400">Days</Label><Input type="number" className={`mt-1 ${inputClasses}`} value={q.daysToComplete} onChange={e => { const newQs = [...pathQuestions]; newQs[idx].daysToComplete = parseInt(e.target.value) || 1; setPathQuestions(newQs); }} /></div>
                                        <Button variant="ghost" size="icon" className="mt-6 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => setPathQuestions(pathQuestions.filter((_, i) => i !== idx))} disabled={pathQuestions.length === 1}><Trash2 className="w-4 h-4" /></Button>
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