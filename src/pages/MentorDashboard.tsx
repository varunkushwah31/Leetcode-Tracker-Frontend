import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { LogOut, Plus, UserPlus, ClipboardList, Trophy, Flame, BookOpen, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import { MentorService, ClassroomService } from '../services/endpoints';
import axios from 'axios';
import type { ClassroomDashboardDTO, StudentSummaryDTO } from '../types';

export function MentorDashboard() {
  const { user, logout } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomDashboardDTO[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sortBy, setSortBy] = useState('solved');
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [assignQuestionOpen, setAssignQuestionOpen] = useState(false);
  
  const [newClassName, setNewClassName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [assignmentData, setAssignmentData] = useState({ titleSlug: '', deadline: '3' });

  const fetchDashboardData = async () => {
    if (!user?.id) return; 
    setIsLoading(true);
    try {
        const profileRes = await MentorService.getProfile(user.id);
        const classroomIds = profileRes.data.classroomIds || [];
        const dashboardPromises = classroomIds.map((id: string) => ClassroomService.getDashboard(id, sortBy));
        const dashboardResponses = await Promise.all(dashboardPromises);
        const fetchedClassrooms = dashboardResponses.map(res => res.data);
        setClassrooms(fetchedClassrooms);
        
        if (selectedClassroom) {
            const updated = fetchedClassrooms.find(c => c.classroomId === selectedClassroom.classroomId);
            setSelectedClassroom(updated || fetchedClassrooms[0] || null);
        } else if (fetchedClassrooms.length > 0) {
            setSelectedClassroom(fetchedClassrooms[0]);
        }
    } catch (err) {
        console.log('====================================');
        console.log(err);
        console.log('====================================');
        setError('Failed to load mentor dashboard.');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => { 
      fetchDashboardData(); 
  }, [sortBy, user?.id]);

  const handleCreateClass = async () => {
    if (!user?.id) return;
    try {
        await ClassroomService.createClassroom(user.id, newClassName);
        setCreateClassOpen(false); setNewClassName(''); fetchDashboardData();
    } catch (err) {
        console.log(err);
        alert("Failed to create class."); 
    }
  };

  const handleAddStudent = async () => {
    if (!selectedClassroom) return;
    try {
        await ClassroomService.addStudent(selectedClassroom.classroomId, newStudentUsername);
        setAddStudentOpen(false); setNewStudentUsername(''); fetchDashboardData();
    } catch (err) { alert(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to add student'); }
  };

  const handleAssignQuestion = async () => {
    if (!selectedClassroom) return;
    const startTimestamp = Math.floor(Date.now() / 1000);
    const endTimestamp = startTimestamp + (parseInt(assignmentData.deadline) * 86400);
    try {
        await ClassroomService.assignQuestion(selectedClassroom.classroomId, assignmentData.titleSlug, startTimestamp, endTimestamp);
        setAssignQuestionOpen(false); setAssignmentData({ titleSlug: '', deadline: '3' }); fetchDashboardData();
    } catch (err) { 
        console.log(err);
        alert("Failed to assign question."); 
    }
  };

  if (isLoading && classrooms.length === 0) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#2563eb] p-2 rounded-lg"><Trophy className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-semibold text-slate-900">LeetTracker</span>
          </div>
          
          <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
            <DialogTrigger asChild><Button className="w-full"><Plus className="w-4 h-4 mr-2" />Create New Class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Classroom</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Classroom Name</Label>
                  <Input placeholder="e.g., Data Structures 101" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setCreateClassOpen(false)}>Cancel</Button><Button onClick={handleCreateClass}>Create Classroom</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">Your Classrooms</p>
            {classrooms.map((classroom) => (
              <button
                key={classroom.classroomId}
                onClick={() => setSelectedClassroom(classroom)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedClassroom?.classroomId === classroom.classroomId ? 'bg-[#2563eb] text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{classroom.className}</p>
                    <p className={`text-sm ${selectedClassroom?.classroomId === classroom.classroomId ? 'text-blue-100' : 'text-slate-500'}`}>
                      {classroom.enrolledStudents?.length || 0} Students
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ml-2 ${selectedClassroom?.classroomId === classroom.classroomId ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{user?.name?.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">Mentor</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {selectedClassroom ? (
          <div className="max-w-7xl mx-auto p-8">
            
            {error && (
                <div className="mb-6 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedClassroom.className}</h1>
                <div className="flex items-center gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{selectedClassroom.enrolledStudents?.length || 0} enrolled students</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                  <DialogTrigger asChild><Button variant="outline"><UserPlus className="w-4 h-4 mr-2" />Add Student</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>LeetCode Username</Label>
                        <Input placeholder="student_username" value={newStudentUsername} onChange={(e) => setNewStudentUsername(e.target.value)} />
                        <p className="text-xs text-slate-500">The student must be registered on LeetTracker</p>
                      </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button><Button onClick={handleAddStudent}>Add Student</Button></DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={assignQuestionOpen} onOpenChange={setAssignQuestionOpen}>
                  <DialogTrigger asChild><Button><ClipboardList className="w-4 h-4 mr-2" />Assign Question</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Assign Question</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>LeetCode Problem Slug</Label>
                        <Input placeholder="e.g., two-sum" value={assignmentData.titleSlug} onChange={(e) => setAssignmentData({ ...assignmentData, titleSlug: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Deadline</Label>
                        <Select value={assignmentData.deadline} onValueChange={(value) => setAssignmentData({ ...assignmentData, deadline: value })}>
                          <SelectTrigger><SelectValue placeholder="Select deadline" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">1 Week</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setAssignQuestionOpen(false)}>Cancel</Button><Button onClick={handleAssignQuestion}>Assign to All</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="mb-6 shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Student Leaderboard</CardTitle>
                    <CardDescription>Track and compare student progress</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 font-medium">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48 bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solved">Total Solved</SelectItem>
                        <SelectItem value="consistency">Daily Streak</SelectItem>
                        <SelectItem value="pending">Most Pending</SelectItem>
                        <SelectItem value="rating">Contest Rating</SelectItem>
                        <SelectItem value="name">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="text-center py-3 px-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Streak</th>
                        <th className="text-center py-3 px-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Solved</th>
                        <th className="text-center py-3 px-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-slate-500 uppercase tracking-wider">Assignments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClassroom.enrolledStudents?.map((student: StudentSummaryDTO, index: number) => (
                        <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border border-slate-200">
                                <AvatarImage src={student.avatarUrl} />
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">{student.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500 font-medium">@{student.leetcodeUsername}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Flame className={`w-4 h-4 ${(student.consistencyStreak ?? 0) > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
                              <span className={`font-bold ${(student.consistencyStreak ?? 0) > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                                {student.consistencyStreak || 0}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-bold text-slate-800">{student.totalSolved || 0}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-bold text-slate-800">{Math.round(student.currentContestRating || 0).toLocaleString()}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col items-end gap-1.5">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                {student.completedAssignments || 0} Done
                              </Badge>
                              {(student.pendingAssignments ?? 0) > 0 && (
                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                  {student.pendingAssignments} Pending
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!selectedClassroom.enrolledStudents || selectedClassroom.enrolledStudents.length === 0) && (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500">
                                No students in this classroom yet. Click "Add Student" to get started.
                            </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No Classroom Selected</h2>
              <p className="text-slate-600 mb-6">Select a classroom from the sidebar to view student progress, or create a new classroom to get started.</p>
              <Button onClick={() => setCreateClassOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Your First Classroom</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}