import { useEffect, useState } from 'react';
import { Loader2, Terminal, LogOut, Activity } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { StudentService } from '../services/endpoints';
import type { StudentExtendedDTO, AssignmentDTO } from '@/types';

import { ProfileStats } from '../components/dashboard/student/ProfileStats';
import { ActivityHeatmap } from '../components/dashboard/student/ActivityHeatmap';
import { PendingAssignments } from '../components/dashboard/student/PendingAssignments';
import { ClassroomList } from '../components/dashboard/student/ClassroomList';
import { BadgesList } from '../components/dashboard/student/BadgesList';
import { StudentRightSidebar } from '../components/dashboard/student/StudentRightSidebar';
import { ThemeToggle } from"@/components/ui/ThemeToggle.tsx";
import {useClassroomWebSocket} from"@/hooks/useClassroomWebSocket.ts";

export function StudentDashboard() {
 const { logout, user } = useAuth();
 const [dashboardData, setDashboardData] = useState<StudentExtendedDTO | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isSyncing, setIsSyncing] = useState(false);
 const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

 const fetchDashboard = async () => {
 try {
 const response = await StudentService.getDashboard();
 setDashboardData(response.data);
 } catch (err) { console.error('Failed to load dashboard', err); }
 finally { setIsLoading(false); }
 };

 // When a ping is received, it calls fetchDashboardData to silently update the UI.
 useClassroomWebSocket(selectedClassroomId, () => {
 console.log("Auto-refreshing Student Dashboard...");
 fetchDashboard();
 });

 useEffect(() => { void fetchDashboard(); }, []);

 const handleSync = async () => {
 if (!dashboardData?.leetcodeUsername) return;
 setIsSyncing(true);
 try {
 const response = await StudentService.syncProfile(dashboardData.leetcodeUsername);
 setDashboardData(response.data);
 } catch (err) { alert("Failed to sync with LeetCode."); }
 finally { setIsSyncing(false); }
 };

 const isAssignmentCompleted = (assignment: AssignmentDTO) => {
 if (dashboardData?.manuallyCompletedAssignments?.includes(assignment.id)) return true;
 return !!dashboardData?.recentSubmissions?.some(sub =>
 sub.titleSlug === assignment.titleSlug &&
 sub.timestamp >= assignment.startTimestamp &&
 sub.timestamp <= assignment.endTimestamp
 );
 };

 if (isLoading) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-[#09090e]">
 <div className="flex flex-col items-center space-y-4 relative z-10">
 <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]"/>
 <p className="font-medium text-zinc-400">Decrypting LeetCode stats...</p>
 </div>
 </div>
 );
 }

 const easyCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
 const medCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
 const hardCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
 const totalSolved = (easyCount + medCount + hardCount) || 1;
 const rating = Math.round(dashboardData?.currentContestRating || 0);

 const pendingAssignments: { classroomId: string, className: string, assignment: AssignmentDTO }[] = [];
 dashboardData?.classrooms?.forEach(cls => {
 if (selectedClassroomId && cls.id !== selectedClassroomId) return;
 cls.assignments?.forEach(assignment => {
 if (!isAssignmentCompleted(assignment)) {
 pendingAssignments.push({ classroomId: cls.id!, className: cls.className, assignment });
 }
 });
 });

 return (
 <div className="min-h-screen bg-[#060608] text-white selection:bg-[#5b4fff] selection:text-white pb-12 relative overflow-hidden font-sans">
 
 {/* Dynamic Background Textures & Glows */}
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none fixed"></div>
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none fixed" style={{ background: 'radial-gradient(ellipse at top, #5b4fff 0%, transparent 70%)' }}></div>
 <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-[0.07] pointer-events-none fixed" style={{ background: 'radial-gradient(circle at bottom right, #10b981 0%, transparent 70%)' }}></div>

 <header className="bg-[#0a0a0a]/70 backdrop-blur-3xl border-b border-zinc-800/40 sticky top-0 z-50 shadow-[0_4px_30px_rgb(0,0,0,0.5)]">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg"><Terminal className="w-5 h-5 text-white"strokeWidth={2.5} /></div>
 <span className="text-xl font-bold text-white tracking-tight">LeetTracker</span>
 </div>
 <div className="flex items-center gap-4 relative z-10">
 <Button variant="outline"className="hidden sm:flex bg-transparent border border-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all"onClick={handleSync} disabled={isSyncing}>
 {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-500"/> : <Activity className="w-4 h-4 mr-2 text-[#968fff]"/>}
 <span>Sync Profile</span>
 </Button>

 <div className="w-px h-6 bg-zinc-800 hidden sm:block mx-1"/>
 <div className="flex items-center gap-3">
 <Avatar className="border border-zinc-800 shadow-sm w-9 h-9">
 <AvatarImage src={dashboardData?.avatarUrl} />
 <AvatarFallback className="bg-[#1a1b2e] text-[#968fff] font-bold text-xs">{user?.name?.substring(0, 2) || 'ST'}</AvatarFallback>
 </Avatar>
 <div className="text-right hidden sm:block">
 <p className="text-sm font-bold text-white tracking-tight">{dashboardData?.name || user?.name}</p>
 <p className="text-xs font-medium text-zinc-400">@{dashboardData?.leetcodeUsername || 'student'}</p>
 </div>
 </div>
 <Button variant="ghost"size="icon"onClick={logout} className="hover:bg-rose-500/10 hover:text-rose-400 text-zinc-500 transition-colors rounded-xl">
 <LogOut className="w-4 h-4"/>
 </Button>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
 <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
 <ProfileStats data={dashboardData} totalSolved={totalSolved} rating={rating} />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
 <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
 <ActivityHeatmap progressHistory={dashboardData?.progressHistory} consistencyStreak={dashboardData?.consistencyStreak} />
 <PendingAssignments assignments={pendingAssignments} isSyncing={isSyncing} onSync={handleSync} selectedClassroomId={selectedClassroomId} onClearFilter={() => setSelectedClassroomId(null)} />
 <ClassroomList classrooms={dashboardData?.classrooms} selectedClassroomId={selectedClassroomId} onSelectClassroom={setSelectedClassroomId} />
 </div>

 <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
 <StudentRightSidebar data={dashboardData} totalSolved={totalSolved} />
 <BadgesList badges={dashboardData?.badges} />
 </div>
 </div>
 </main>
 </div>
 );
}