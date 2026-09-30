import { useEffect, useState, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { SignOutIcon as LogOut, PlusIcon, TerminalIcon, BookOpenIcon, SpinnerIcon as Loader2, ShieldWarningIcon as ShieldAlert, ArrowsClockwiseIcon as RefreshCw } from '@phosphor-icons/react';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../hooks/useAuth';
import { MentorService, ClassroomService, PathService, StudentService } from '../services/endpoints';
import type { ClassroomDashboardDTO, LearningPath, ClassroomAnalyticsDTO } from '@/types';

import { MentorActions } from '../components/dashboard/mentor/MentorActions';
import { LeaderboardTable } from '../components/dashboard/mentor/LeaderboardTable';
import { ClassroomAnalytics } from '../components/dashboard/mentor/ClassroomAnalytics';
import { StudentDetailsView } from '@/components/dashboard/mentor/StudentDetailsView';
import { ManageAssignments } from '../components/dashboard/mentor/ManageAssignments'; // <-- 1. Import the new component
import { AdminOverview } from "@/pages/AdminOverview.tsx";
import { useClassroomWebSocket } from "@/hooks/useClassroomWebSocket.ts";
import { ErrorBanner } from '../components/ui/ErrorBanner';

async function syncStudentsInBatches(students: { leetcodeUsername: string }[], batchSize = 3): Promise<void> {
    for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        await Promise.allSettled(
            batch.map(student => StudentService.syncProfile(student.leetcodeUsername))
        );
        if (i + batchSize < students.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

interface ClassroomTabContentProps {
    readonly activeTab: string;
    readonly selectedClassroom: ClassroomDashboardDTO;
    readonly sortBy: string;
    readonly onSortChange: (value: string) => void;
    readonly onExportCSV: () => void;
    readonly onStudentClick: (username: string) => void;
    readonly analyticsData: ClassroomAnalyticsDTO | null;
    readonly mentorId: string;
    readonly onRefresh: () => void;
}

function ClassroomTabContent({
    activeTab,
    selectedClassroom,
    sortBy,
    onSortChange,
    onExportCSV,
    onStudentClick,
    analyticsData,
    mentorId,
    onRefresh,
}: Readonly<ClassroomTabContentProps>) {
    if (activeTab === 'leaderboard') {
        return (
            <LeaderboardTable
                students={selectedClassroom.enrolledStudents}
                sortBy={sortBy}
                onSortChange={onSortChange}
                onExportCSV={onExportCSV}
                onStudentClick={onStudentClick}
                classroomId={selectedClassroom.classroomId}
            />
        );
    }
    if (activeTab === 'analytics') {
        return <ClassroomAnalytics data={analyticsData} />;
    }
    return (
        <ManageAssignments
            classroomId={selectedClassroom.classroomId}
            mentorId={mentorId}
            assignments={selectedClassroom.assignments || []}
            onRefresh={onRefresh}
        />
    );
}

function EmptyClassroomState({ onCreateClass }: Readonly<{ onCreateClass: () => void }>) {
    return (
        <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md relative z-10 bg-[#111111]/85 backdrop-blur-2xl p-10 rounded-3xl border border-zinc-800/60 shadow-[0_8px_40px_rgb(0,0,0,0.5)]">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1b2e] rounded-2xl mb-6 shadow-lg">
                    <BookOpenIcon className="w-8 h-8 text-[#968fff]" />
                </div>
                <h2 className="text-[28px] font-bold text-white tracking-tight mb-3">No Classroom Selected</h2>
                <p className="text-zinc-400 text-[15px] mb-8">
                    Select a classroom from the sidebar, or create a new one to start tracking progress.
                </p>
                <Button
                    onClick={onCreateClass}
                    className="w-full h-12 bg-transparent border border-zinc-700 text-white text-[15px] font-medium hover:bg-zinc-800 rounded-xl transition-all duration-200 flex items-center justify-center hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 active:translate-y-0"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />Create Your First Classroom
                </Button>
            </div>
        </div>
    );
}

export function MentorDashboard() {
    const { user, logout } = useAuth();

    // Data States
    const [classrooms, setClassrooms] = useState<ClassroomDashboardDTO[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDashboardDTO | null>(null);
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [analyticsData, setAnalyticsData] = useState<ClassroomAnalyticsDTO | null>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('solved');
    const [activeTab, setActiveTab] = useState('leaderboard');
    const [createClassOpen, setCreateClassOpen] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [viewingStudentUsername, setViewingStudentUsername] = useState<string | null>(null);
    const [showAdminOverview, setShowAdminOverview] = useState(false);

    // Specific Error State for the Dialog
    const [createClassError, setCreateClassError] = useState<string | null>(null);

    const [isClassroomSyncing, setIsClassroomSyncing] = useState(false);

    const getErrorMessage = (err: unknown, fallback: string) =>
        err instanceof Error && err.message ? err.message : fallback;

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        setError(null);
        try {
            const [profileRes, pathsRes] = await Promise.all([
                MentorService.getProfile(user.id),
                PathService.getMentorPaths(user.id)
            ]);
            setLearningPaths(pathsRes.data);

            const classroomIds = profileRes.data.classroomIds || [];

            const dashboardResponses = await Promise.all(
                classroomIds.map((id: string) => ClassroomService.getDashboard(id, sortBy))
            );

            const fetchedClassrooms = dashboardResponses.map(res => res.data);
            setClassrooms([...fetchedClassrooms]);

            setSelectedClassroom(prev => {
                if (prev) {
                    const updated = fetchedClassrooms.find(c => c.classroomId === prev.classroomId);
                    return updated || fetchedClassrooms[0] || null;
                }
                return fetchedClassrooms[0] || null;
            });
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to load mentor dashboard.'));
        } finally {
            setIsLoading(false);
        }
    }, [sortBy, user?.id]);

    useClassroomWebSocket(selectedClassroom?.classroomId, () => {
        void fetchDashboardData();
    });

    useEffect(() => { void fetchDashboardData(); }, [fetchDashboardData]);

    useEffect(() => {
        if (selectedClassroom?.classroomId) {
            void ClassroomService.getAnalytics(selectedClassroom.classroomId)
                .then(res => setAnalyticsData(res.data))
                .catch(() => { /* analytics load is best-effort */ });
        }
    }, [selectedClassroom?.classroomId]);

    const handleCreateClass = async () => {
        if (!user?.id) return;
        setCreateClassError(null);
        try {
            await ClassroomService.createClassroom(user.id, newClassName);
            setCreateClassOpen(false);
            setNewClassName('');
            await fetchDashboardData();
        } catch (err: unknown) {
            setCreateClassError(getErrorMessage(err, 'Failed to create classroom.'));
        }
    };

    const handleExportCSV = async () => {
        if (!selectedClassroom) return;
        setError(null);
        try {
            const response = await ClassroomService.exportClassroom(selectedClassroom.classroomId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', `${selectedClassroom.className.replace(/\s+/g, '_')}_Leaderboard.csv`);
            document.body.appendChild(link); link.click(); link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to export classroom.'));
        }
    };

    const handleSyncClassroom = async () => {
        if (!selectedClassroom?.enrolledStudents || selectedClassroom.enrolledStudents.length === 0) {
            setError("No students in this classroom to sync.");
            return;
        }

        setError(null);
        setIsClassroomSyncing(true);
        try {
            await syncStudentsInBatches(selectedClassroom.enrolledStudents);
            await fetchDashboardData();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to sync classroom.'));
        } finally {
            setIsClassroomSyncing(false);
        }
    };


    if (isLoading && classrooms.length === 0) return <div className="flex h-screen items-center justify-center bg-[#09090e]"><Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" /></div>;

    return (
        <div className="h-screen bg-[#09090e] text-white flex overflow-hidden selection:bg-[#5b4fff] selection:text-white">
            {/* Sidebar */}
            <aside className="w-72 relative bg-[#09090e] border-r border-zinc-900 flex flex-col z-20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col h-full w-full">
                    <div className="p-6 border-b border-zinc-900">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg">
                                <TerminalIcon className="w-5 h-5 text-white" weight="bold" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">MentorSync</span>
                        </div>

                        <Dialog open={createClassOpen} onOpenChange={(open) => { setCreateClassOpen(open); if(!open) setCreateClassError(null); }}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-transparent border border-zinc-800 text-white hover:bg-[#5b4fff] hover:border-transparent rounded-xl transition-all duration-200">
                                    <PlusIcon className="w-4 h-4 mr-2" />Create New Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#111111] border-zinc-800 text-white sm:rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-white text-xl font-bold">Create New Classroom</DialogTitle>
                                    <DialogDescription className="text-zinc-400 text-sm">
                                        Enter the name of the new classroom to start managing students and assignments.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Error Banner for Class Creation */}
                                <ErrorBanner message={createClassError} />

                                <div className="space-y-4 py-2">
                                    <div className="space-y-1.5"><Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Classroom Name</Label><Input className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4" placeholder="e.g., Data Structures 101" value={newClassName} onChange={(e) => { setNewClassName(e.target.value); if(createClassError) setCreateClassError(null); }} /></div>
                                </div>
                                <DialogFooter><Button variant="outline" className="bg-transparent border border-zinc-700 text-white hover:bg-zinc-800 hover:text-white rounded-xl" onClick={() => setCreateClassOpen(false)}>Cancel</Button><Button className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl" onClick={handleCreateClass} disabled={!newClassName}>Create Classroom</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-2">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-3">Your Classrooms</p>
                            {classrooms.map((c) => (
                                <button key={c.classroomId}
                                        onClick={() => {
                                            setSelectedClassroom(c);
                                            setShowAdminOverview(false);
                                            setError(null); // Clear global errors on navigation
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex justify-between items-center ${
                                            selectedClassroom?.classroomId === c.classroomId && !showAdminOverview
                                                ? 'bg-[#1a1b2e] border border-[#5b4fff]/30 text-white font-medium shadow-[0_0_15px_rgba(91,79,255,0.1)]'
                                                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white border border-transparent'
                                        }`}>
                                    <span className="truncate">{c.className}</span>
                                    <Badge className={`border-transparent ${selectedClassroom?.classroomId === c.classroomId && !showAdminOverview ? 'bg-[#5b4fff] text-white' : 'bg-zinc-800/80 text-zinc-400'}`}>
                                        {c.enrolledStudents?.length || 0}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t border-zinc-900 space-y-2 bg-[#09090e]/80 backdrop-blur-md">
                        <div className="flex items-center gap-3 px-3 py-2 mb-2">
                            <Avatar className="border border-zinc-800 w-9 h-9">
                                <AvatarFallback className="bg-[#1a1b2e] text-[#968fff] font-bold">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                <p className="text-xs text-zinc-500">Mentor</p>
                            </div>
                        </div>

                        {user?.role === 'SUPER_ADMIN' && (
                            <button
                                onClick={() => {
                                    setShowAdminOverview(true);
                                    setSelectedClassroom(null);
                                    setError(null);
                                }}
                                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-xl transition-all ${showAdminOverview ? 'bg-[#5b4fff]/10 text-[#968fff] border border-[#5b4fff]/20 font-medium' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'}`}
                            >
                                <ShieldAlert className="w-4 h-4 mr-2" /> Admin Overview
                            </button>
                        )}

                        <button onClick={logout} aria-label="Sign out" className="w-full flex items-center px-3 py-2.5 text-sm rounded-xl hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/20">
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-[#0a0a0a]">
                <div className="inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 pointer-events-none fixed"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-[#5b4fff] opacity-[0.05] blur-[120px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 h-full">
                    {(() => {
                        if (showAdminOverview) {
                            return (
                                <AdminOverview onBack={() => {
                                    setShowAdminOverview(false);
                                    if (classrooms.length > 0) setSelectedClassroom(classrooms[0]);
                                }} />
                            );
                        }

                        if (!selectedClassroom) {
                            return <EmptyClassroomState onCreateClass={() => setCreateClassOpen(true)} />;
                        }

                        return (
                            <div className="max-w-7xl mx-auto p-6 lg:p-10 min-h-full">
                                {/* Main Dashboard Error Banner */}
                                <ErrorBanner message={error} />

                                <div className="mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">{selectedClassroom.className}</h1>
                                        <p className="text-[15px] text-zinc-400 flex items-center gap-1.5"><BookOpenIcon className="w-4 h-4 text-[#5b4fff]" /> {selectedClassroom.enrolledStudents?.length || 0} enrolled students</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleSyncClassroom}
                                            disabled={isClassroomSyncing}
                                            variant="outline"
                                            aria-label="Sync classroom data"
                                            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800 rounded-xl"
                                        >
                                            {isClassroomSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2 text-zinc-400" />}
                                            {isClassroomSyncing ? 'Syncing Class...' : 'Sync Class Data'}
                                        </Button>

                                        <MentorActions mentorId={user!.id!} selectedClassroom={selectedClassroom} learningPaths={learningPaths} onRefresh={fetchDashboardData} />
                                    </div>
                                </div>

                                <div className="flex bg-[#111111]/85 backdrop-blur-2xl p-1.5 rounded-xl w-max mb-8 border border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                                    <button
                                        className={`px-5 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200 ${activeTab === 'leaderboard' ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50' : 'text-zinc-500 hover:text-white'}`}
                                        onClick={() => setActiveTab('leaderboard')}
                                    >
                                        Class Leaderboard
                                    </button>
                                    <button
                                        className={`px-5 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200 ${activeTab === 'analytics' ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50' : 'text-zinc-500 hover:text-white'}`}
                                        onClick={() => setActiveTab('analytics')}
                                    >
                                        Weakness & Analytics
                                    </button>
                                    <button
                                        className={`px-5 py-2.5 text-[14px] font-medium rounded-lg transition-all duration-200 ${activeTab === 'assignments' ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50' : 'text-zinc-500 hover:text-white'}`}
                                        onClick={() => setActiveTab('assignments')}
                                    >
                                        Manage Assignments
                                    </button>
                                </div>

                                <ClassroomTabContent
                                    activeTab={activeTab}
                                    selectedClassroom={selectedClassroom}
                                    sortBy={sortBy}
                                    onSortChange={setSortBy}
                                    onExportCSV={handleExportCSV}
                                    onStudentClick={(username) => setViewingStudentUsername(username)}
                                    analyticsData={analyticsData}
                                    mentorId={user!.id!}
                                    onRefresh={fetchDashboardData}
                                />

                                {viewingStudentUsername && (
                                    <StudentDetailsView username={viewingStudentUsername} onBack={() => setViewingStudentUsername(null)} />
                                )}
                            </div>
                        );
                    })()}
                </div>
            </main>
        </div>
    );
}