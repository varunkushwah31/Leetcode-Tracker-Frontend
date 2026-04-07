import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { UserPlus, ClipboardList, Map, Plus, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { ClassroomService, PathService } from '../../../services/endpoints';
import type { ClassroomDashboardDTO, LearningPath, PathQuestion } from '../../../types';
import axios from 'axios';

interface MentorActionsProps {
    mentorId: string;
    selectedClassroom: ClassroomDashboardDTO;
    learningPaths: LearningPath[];
    onRefresh: () => void;
}

export function MentorActions({ mentorId, selectedClassroom, learningPaths, onRefresh }: MentorActionsProps) {
    const [addStudentOpen, setAddStudentOpen] = useState(false);
    const [assignQuestionOpen, setAssignQuestionOpen] = useState(false);
    const [assignPathOpen, setAssignPathOpen] = useState(false);
    const [createPathOpen, setCreatePathOpen] = useState(false);

    // Form States
    const [newStudentUsername, setNewStudentUsername] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadFailures, setUploadFailures] = useState<string[]>([]);
    
    const [assignmentData, setAssignmentData] = useState({ titleSlug: '', deadline: '3' });
    const [selectedPathId, setSelectedPathId] = useState<string>('');
    const [newPath, setNewPath] = useState({ title: '', description: '' });
    const [pathQuestions, setPathQuestions] = useState<PathQuestion[]>([{ titleSlug: '', daysToComplete: 3 }]);

    // Handlers
    const handleAddStudent = async () => {
        try {
            await ClassroomService.addStudent(selectedClassroom.classroomId, newStudentUsername);
            setAddStudentOpen(false); setNewStudentUsername(''); onRefresh();
        } catch (err) { alert(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to add student'); }
    };

    const handleBulkUpload = async () => {
        if (!uploadFile) return;
        setIsUploading(true); setUploadFailures([]);
        try {
            const response = await ClassroomService.bulkAddStudents(selectedClassroom.classroomId, uploadFile);
            if (response.data?.length > 0) setUploadFailures(response.data);
            else { setAddStudentOpen(false); setUploadFile(null); }
            onRefresh();
        } catch (err) { 
            console.log(err);
            alert("Failed to upload CSV."); 
        }
        finally { 
            setIsUploading(false); }
    };

    const handleAssignQuestion = async () => {
        const start = Math.floor(Date.now() / 1000);
        const end = start + (parseInt(assignmentData.deadline) * 86400);
        try {
            await ClassroomService.assignQuestion(selectedClassroom.classroomId, assignmentData.titleSlug, start, end);
            setAssignQuestionOpen(false); setAssignmentData({ titleSlug: '', deadline: '3' }); onRefresh();
        } catch (err) { 
            console.log(err);
            alert("Failed to assign question."); 
        }
    };

    const handleCreatePath = async () => {
        try {
            await PathService.createPath({ mentorId, title: newPath.title, description: newPath.description, questions: pathQuestions });
            setCreatePathOpen(false); setNewPath({ title: '', description: '' }); setPathQuestions([{ titleSlug: '', daysToComplete: 3 }]); onRefresh();
        } catch (err) { 
            console.log(err);
            alert("Failed to create Learning Path."); 
        }
    };

    const handleAssignPath = async () => {
        try {
            await PathService.assignPath(selectedPathId, selectedClassroom.classroomId);
            setAssignPathOpen(false); setSelectedPathId(''); onRefresh();
        } catch (err) { 
            console.log(err);
            alert("Failed to assign Learning Path."); 
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {/* 1. ADD STUDENT DIALOG */}
            <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild><Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Add Student</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Students</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <Label className="text-blue-700 font-bold">1. Add Single Student</Label>
                            <div className="flex gap-2">
                                <Input placeholder="LeetCode Username" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
                                <Button onClick={handleAddStudent} disabled={!newStudentUsername}>Add</Button>
                            </div>
                        </div>
                        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <Label className="text-emerald-700 font-bold">2. Bulk Import (CSV)</Label>
                            <p className="text-xs text-slate-500">Upload a .csv file with LeetCode usernames.</p>
                            <div className="flex gap-2">
                                <Input type="file" accept=".csv" onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)} className="cursor-pointer file:bg-emerald-50 file:text-emerald-700 file:border-0" />
                                <Button onClick={handleBulkUpload} disabled={!uploadFile || isUploading} className="bg-emerald-600 hover:bg-emerald-700">
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />} Import
                                </Button>
                            </div>
                            {uploadFailures.length > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                                    <span className="font-bold">Failed to add:</span>
                                    <ul className="list-disc pl-5 mt-1">{uploadFailures.map((f, i) => <li key={i}>{f}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 2. ASSIGN QUESTION DIALOG */}
            <Dialog open={assignQuestionOpen} onOpenChange={setAssignQuestionOpen}>
                <DialogTrigger asChild><Button><ClipboardList className="w-4 h-4 mr-2" />Assign Question</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Question</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2"><Label>Problem Slug</Label><Input placeholder="two-sum" value={assignmentData.titleSlug} onChange={(e) => setAssignmentData({ ...assignmentData, titleSlug: e.target.value })} /></div>
                        <div className="space-y-2">
                            <Label>Deadline</Label>
                            <Select value={assignmentData.deadline} onValueChange={(v) => setAssignmentData({ ...assignmentData, deadline: v })}>
                                <SelectTrigger><SelectValue placeholder="Select deadline" /></SelectTrigger>
                                <SelectContent><SelectItem value="1">1 Day</SelectItem><SelectItem value="3">3 Days</SelectItem><SelectItem value="7">1 Week</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setAssignQuestionOpen(false)}>Cancel</Button><Button onClick={handleAssignQuestion}>Assign</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. ASSIGN PATH DIALOG */}
            <Dialog open={assignPathOpen} onOpenChange={setAssignPathOpen}>
                <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Map className="w-4 h-4 mr-2" /> Assign Path</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Learning Path</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        {learningPaths.length === 0 ? (
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500 mb-3">No Learning Paths found.</p>
                                <Button variant="outline" onClick={() => { setAssignPathOpen(false); setCreatePathOpen(true); }}>Create a Path First</Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select a Path</Label>
                                <Select value={selectedPathId} onValueChange={setSelectedPathId}>
                                    <SelectTrigger><SelectValue placeholder="Choose a roadmap..." /></SelectTrigger>
                                    <SelectContent>
                                        {learningPaths.map(path => <SelectItem key={path.id} value={path.id || ''}>{path.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter><Button onClick={handleAssignPath} disabled={!selectedPathId}>Assign to All</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 4. CREATE PATH DIALOG */}
            <Dialog open={createPathOpen} onOpenChange={setCreatePathOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Build a Learning Path</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Title</Label><Input value={newPath.title} onChange={e => setNewPath({...newPath, title: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Description</Label><Input value={newPath.description} onChange={e => setNewPath({...newPath, description: e.target.value})} /></div>
                        </div>
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-2">
                                <Label>Questions</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setPathQuestions([...pathQuestions, { titleSlug: '', daysToComplete: 3 }])}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                            </div>
                            <div className="space-y-3">
                                {pathQuestions.map((q, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex-1"><Label className="text-xs">Slug</Label><Input value={q.titleSlug} onChange={e => { const newQs = [...pathQuestions]; newQs[idx].titleSlug = e.target.value; setPathQuestions(newQs); }} /></div>
                                        <div className="w-32"><Label className="text-xs">Days</Label><Input type="number" value={q.daysToComplete} onChange={e => { const newQs = [...pathQuestions]; newQs[idx].daysToComplete = parseInt(e.target.value) || 1; setPathQuestions(newQs); }} /></div>
                                        <Button variant="ghost" size="icon" className="mt-5 text-red-500 hover:bg-red-50" onClick={() => setPathQuestions(pathQuestions.filter((_, i) => i !== idx))} disabled={pathQuestions.length === 1}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreatePath} disabled={!newPath.title || !pathQuestions[0].titleSlug}>Save Path</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}