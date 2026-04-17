import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { LogOut, Plus, Terminal, BookOpen, Loader2, AlertCircle, ShieldAlert, Badge } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import { MentorService, ClassroomService, PathService } from '../services/endpoints';
import type { ClassroomDashboardDTO, LearningPath, ClassroomAnalyticsDTO } from '@/types';


import { MentorActions } from '../components/dashboard/mentor/MentorActions';
import { LeaderboardTable } from '../components/dashboard/mentor/LeaderboardTable';
import { ClassroomAnalytics } from '../components/dashboard/mentor/ClassroomAnalytics';
import { StudentDetailsView } from '@/components/dashboard/mentor/StudentDetailsView';
import { ThemeToggle } from "@/components/ui/ThemeToggle.tsx";
import {AdminOverview} from "@/pages/AdminOverview.tsx";

export function MentorDashboard() {
    const { user, logout } = useAuth();

    // Data States
    const [classrooms, setClassrooms] = useState<ClassroomDashboardDTO[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDashboardDTO | null>(null);
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [analyticsData, setAnalyticsData] = useState<ClassroomAnalyticsDTO | null>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('solved');
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [createClassOpen, setCreateClassOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [viewingStudentUsername, setViewingStudentUsername] = useState<string | null>(null);
    const [showAdminOverview, setShowAdminOverview] = useState(false); // Admin Toggle

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
                if (updated) {
                    const analyticsRes = await ClassroomService.getAnalytics(updated.classroomId);
                    setAnalyticsData(analyticsRes.data);
                }
            } else if (fetchedClassrooms.length > 0) {
                setSelectedClassroom(fetchedClassrooms[0]);
                const analyticsRes = await ClassroomService.getAnalytics(fetchedClassrooms[0].classroomId);
                setAnalyticsData(analyticsRes.data);
            }
        } catch (err) {
            console.log(err);
            setError('Failed to load mentor dashboard.');
        } finally { setIsLoading(false); }
    };

    useEffect(() => { void fetchDashboardData(); }, [sortBy, user?.id]);

    useEffect(() => {
        if (selectedClassroom?.classroomId) {
            ClassroomService.getAnalytics(selectedClassroom.classroomId)
                .then(res => setAnalyticsData(res.data))
                .catch(err => console.error("Failed to load analytics", err));
        }
    }, [selectedClassroom?.classroomId]);

    const handleCreateClass = async () => {
        if (!user?.id) return;
        try {
            await ClassroomService.createClassroom(user.id, newClassName);
            setCreateClassOpen(false); setNewClassName(''); await fetchDashboardData();
        } catch { alert("Failed to create class."); }
    };

    const handleExportCSV = async () => {
        if (!selectedClassroom) return;
        try {
            const response = await ClassroomService.exportClassroom(selectedClassroom.classroomId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${selectedClassroom.className.replace(/\s+/g, '_')}_Leaderboard.csv`);
            document.body.appendChild(link); link.click(); link.remove();
        } catch { alert("Failed to export CSV."); }
    };

    if (isLoading && classrooms.length === 0) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B]"><Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-500" /></div>;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] flex transition-colors duration-200">
            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-10 transition-colors duration-200">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-[#2563eb] p-2 rounded-lg"><Terminal className="w-5 h-5 text-white" /></div>
                        <span className="text-xl font-semibold text-zinc-900 dark:text-white">LeetTracker</span>
                    </div>

                    <Dialog open={createClassOpen} onOpenChange={setCreateClassOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-transparent"><Plus className="w-4 h-4 mr-2" />Create New Class</Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <DialogHeader><DialogTitle className="dark:text-white">Create New Classroom</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2"><Label className="dark:text-zinc-300">Classroom Name</Label><Input className="dark:bg-zinc-950 dark:border-zinc-800" placeholder="e.g., Data Structures 101" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} /></div>
                            </div>
                            <DialogFooter><Button variant="outline" className="dark:bg-zinc-900 dark:border-zinc-700" onClick={() => setCreateClassOpen(false)}>Cancel</Button><Button onClick={handleCreateClass}>Create Classroom</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider px-2 mb-3">Your Classrooms</p>
                        {classrooms.map((c) => (
                            <button key={c.classroomId}
                                    onClick={() => {
                                        setSelectedClassroom(c);
                                        setShowAdminOverview(false); // Close admin view if opening a class
                                    }}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex justify-between items-center ${
                                        selectedClassroom?.classroomId === c.classroomId && !showAdminOverview
                                            ? 'bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white font-medium'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                                    }`}>
                                <span className="truncate">{c.className}</span>
                                <Badge className={`border-transparent ${selectedClassroom?.classroomId === c.classroomId && !showAdminOverview ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'}`}>
                                    {c.enrolledStudents?.length || 0}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="border border-zinc-200 dark:border-zinc-700">
                                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold">{user?.name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Mentor</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>

                    {user?.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => {
                                setShowAdminOverview(true);
                                setSelectedClassroom(null); // Clear selected class to focus on admin view
                            }}
                            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${showAdminOverview ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}
                        >
                            <ShieldAlert className="w-4 h-4 mr-2" /> Admin Overview
                        </button>
                    )}


                    <button onClick={logout} className="w-full flex items-center px-3 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                {/* FIXED: The rendering logic correctly displays AdminOverview when true */}
                {showAdminOverview ? (
                    <AdminOverview onBack={() => {
                        setShowAdminOverview(false);
                        if (classrooms.length > 0) setSelectedClassroom(classrooms[0]);
                    }} />
                ) : selectedClassroom ? (
                    <div className="max-w-7xl mx-auto p-4 lg:p-8">
                        {error && <div className="mb-6 flex items-center space-x-3 rounded-lg border border-red-200 dark:border-rose-900/50 bg-red-50 dark:bg-rose-500/10 p-4 text-red-700 dark:text-rose-400"><AlertCircle className="h-5 w-5 shrink-0" /><p className="font-medium">{error}</p></div>}

                        <div className="mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{selectedClassroom.className}</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1"><BookOpen className="w-4 h-4 mr-1" /> {selectedClassroom.enrolledStudents?.length || 0} enrolled students</p>
                            </div>
                            <MentorActions mentorId={user!.id!} selectedClassroom={selectedClassroom} learningPaths={learningPaths} onRefresh={fetchDashboardData} />
                        </div>

                        <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg w-max mb-6 border border-zinc-200 dark:border-zinc-800">
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'leaderboard' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm dark:border dark:border-zinc-700/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                                onClick={() => setActiveTab('leaderboard')}
                            >
                                Class Leaderboard
                            </button>
                            <button
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm dark:border dark:border-zinc-700/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                                onClick={() => setActiveTab('analytics')}
                            >
                                Weakness & Analytics
                            </button>
                        </div>

                        {activeTab === 'leaderboard' ? (
                            <LeaderboardTable students={selectedClassroom.enrolledStudents} sortBy={sortBy} onSortChange={setSortBy} onExportCSV={handleExportCSV} onStudentClick={(username) => setViewingStudentUsername(username)} />
                        ) : (
                            <ClassroomAnalytics data={analyticsData} />
                        )}

                        {viewingStudentUsername && (
                            <StudentDetailsView username={viewingStudentUsername} onBack={() => setViewingStudentUsername(null)} />
                        )}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full mb-4 border border-zinc-200 dark:border-zinc-700/50"><BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-500" /></div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No Classroom Selected</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Select a classroom from the sidebar, or create a new one.</p>
                            <Button onClick={() => setCreateClassOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" />Create Your First Classroom</Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}