import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { LogOut, Plus, Trophy, BookOpen, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import { MentorService, ClassroomService, PathService } from '../services/endpoints';
import type { ClassroomDashboardDTO, LearningPath } from '../types';

// The Extracted Components
import { MentorActions } from '../components/dashboard/mentor/MentorActions';
import { LeaderboardTable } from '../components/dashboard/mentor/LeaderboardTable';

export function MentorDashboard() {
  const { user, logout } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomDashboardDTO[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDashboardDTO | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sortBy, setSortBy] = useState('solved');
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const fetchDashboardData = async () => {
    if (!user?.id) return; 
    setIsLoading(true);
    try {
        const [profileRes, pathsRes] = await Promise.all([
            MentorService.getProfile(user.id),
            PathService.getMentorPaths(user.id)
        ]);
        setLearningPaths(pathsRes.data);

        const classroomIds = profileRes.data.classroomIds || [];
        const dashboardResponses = await Promise.all(classroomIds.map((id: string) => ClassroomService.getDashboard(id, sortBy)));
        const fetchedClassrooms = dashboardResponses.map(res => res.data);
        setClassrooms(fetchedClassrooms);
        
        if (selectedClassroom) {
            const updated = fetchedClassrooms.find(c => c.classroomId === selectedClassroom.classroomId);
            setSelectedClassroom(updated || fetchedClassrooms[0] || null);
        } else if (fetchedClassrooms.length > 0) {
            setSelectedClassroom(fetchedClassrooms[0]);
        }
    } catch (err) { 
      console.log(err);
      setError('Failed to load mentor dashboard.'); 
    } 
    finally { setIsLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDashboardData(); }, [sortBy, user?.id]);

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

  const handleExportCSV = async () => {
      if (!selectedClassroom) return;
      try {
          const response = await ClassroomService.exportClassroom(selectedClassroom.classroomId);
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url; link.setAttribute('download', `${selectedClassroom.className.replace(/\s+/g, '_')}_Leaderboard.csv`);
          document.body.appendChild(link); link.click(); link.remove();
      } catch (err) { 
        console.log(err);
        alert("Failed to export CSV."); 
      }
  };

  if (isLoading && classrooms.length === 0) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar logic remains clean and readable here */}
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
                <div className="space-y-2"><Label>Classroom Name</Label><Input placeholder="e.g., Data Structures 101" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setCreateClassOpen(false)}>Cancel</Button><Button onClick={handleCreateClass}>Create Classroom</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">Your Classrooms</p>
            {classrooms.map((c) => (
              <button key={c.classroomId} onClick={() => setSelectedClassroom(c)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedClassroom?.classroomId === c.classroomId ? 'bg-[#2563eb] text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.className}</p>
                    <p className={`text-sm ${selectedClassroom?.classroomId === c.classroomId ? 'text-blue-100' : 'text-slate-500'}`}>{c.enrolledStudents?.length || 0} Students</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ml-2 ${selectedClassroom?.classroomId === c.classroomId ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <Avatar><AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{user?.name?.substring(0, 2)}</AvatarFallback></Avatar>
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
            {error && <div className="mb-6 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle className="h-5 w-5 shrink-0" /><p className="font-medium">{error}</p></div>}

            <div className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedClassroom.className}</h1>
                <div className="flex items-center gap-2 text-slate-600"><BookOpen className="w-4 h-4" /><span>{selectedClassroom.enrolledStudents?.length || 0} enrolled students</span></div>
              </div>
              
              {/* COMPONENT: Mentor Actions */}
              <MentorActions 
                  mentorId={user!.id!} 
                  selectedClassroom={selectedClassroom} 
                  learningPaths={learningPaths} 
                  onRefresh={fetchDashboardData} 
              />
            </div>

            {/* COMPONENT: Leaderboard Table */}
            <LeaderboardTable 
                students={selectedClassroom.enrolledStudents} 
                sortBy={sortBy} 
                onSortChange={setSortBy} 
                onExportCSV={handleExportCSV} 
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4"><BookOpen className="w-8 h-8 text-slate-400" /></div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No Classroom Selected</h2>
              <p className="text-slate-600 mb-6">Select a classroom from the sidebar, or create a new one.</p>
              <Button onClick={() => setCreateClassOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Your First Classroom</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}