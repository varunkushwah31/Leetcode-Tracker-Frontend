import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
    SignOutIcon as LogOut,
    PlusIcon,
    TerminalIcon,
    BookOpenIcon,
    SpinnerIcon as Loader2,
    ShieldWarningIcon as ShieldAlert,
    ArrowsClockwiseIcon as RefreshCw,
    ListIcon as MenuIcon,
    XIcon,
    CaretRightIcon,
    LifebuoyIcon,
    HouseIcon,
    UsersIcon,
} from '@phosphor-icons/react';
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
import { ManageAssignments } from '../components/dashboard/mentor/ManageAssignments';
import { AdminOverview } from "@/pages/AdminOverview.tsx";
import { useClassroomWebSocket } from "@/hooks/useClassroomWebSocket.ts";
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';

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

function EmptyClassroomState({
    classrooms,
    onSelectClassroom,
    onCreateClass,
    onOpenSidebar,
}: Readonly<{
    classrooms: ClassroomDashboardDTO[];
    onSelectClassroom: (classroom: ClassroomDashboardDTO) => void;
    onCreateClass: () => void;
    onOpenSidebar: () => void;
}>) {
    const hasClassrooms = classrooms.length > 0;

    return (
        <div className="h-full flex items-center justify-center p-4 sm:p-8 my-auto">
            <div className="text-center max-w-xl w-full relative z-10 bg-[#111111]/85 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-zinc-800/60 shadow-[0_8px_40px_rgb(0,0,0,0.5)]">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1b2e] rounded-2xl mb-6 shadow-lg border border-[#5b4fff]/20">
                    <BookOpenIcon className="w-8 h-8 text-[#968fff]" weight="bold" />
                </div>
                <h2 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight mb-3">
                    {hasClassrooms ? 'Select a Classroom' : 'No Classroom Selected'}
                </h2>
                <p className="text-zinc-400 text-sm sm:text-[15px] mb-6 max-w-md mx-auto leading-relaxed">
                    {hasClassrooms
                        ? 'Select one of your existing cohorts below to monitor submissions, or create a brand new classroom.'
                        : 'Select a classroom from the sidebar, or create a new one to start tracking progress.'}
                </p>

                {hasClassrooms ? (
                    <div className="space-y-4 mb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                            {classrooms.map((c) => (
                                <button
                                    key={c.classroomId}
                                    onClick={() => onSelectClassroom(c)}
                                    className="p-4 bg-[#16161a] hover:bg-[#1f2038] border border-zinc-800 hover:border-[#5b4fff]/50 rounded-2xl text-left transition-all duration-200 group flex flex-col justify-between hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-white group-hover:text-[#968fff] transition-colors truncate">
                                            {c.className}
                                        </span>
                                        <CaretRightIcon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                        <UsersIcon className="w-3.5 h-3.5 text-[#5b4fff]" />
                                        <span>{c.enrolledStudents?.length || 0} students</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                onClick={onCreateClass}
                                className="flex-1 h-11 bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-[14px] font-medium rounded-xl transition-all shadow-lg shadow-[#5b4fff]/20 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" weight="bold" />Create New Classroom
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onOpenSidebar}
                                className="lg:hidden h-11 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl"
                            >
                                <MenuIcon className="w-4 h-4 mr-2" />Browse Sidebar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        onClick={onCreateClass}
                        className="w-full h-12 bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-[15px] font-medium rounded-xl transition-all shadow-lg shadow-[#5b4fff]/20 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" weight="bold" />Create Your First Classroom
                    </Button>
                )}
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
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

    if (isLoading && classrooms.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#09090e]">
                <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
            </div>
        );
    }

    const renderSidebarContent = (isMobile = false) => (
        <div className="relative z-10 flex flex-col h-full w-full">
            <div className="p-6 border-b border-zinc-900">
                <div className="flex items-center justify-between mb-6">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <TerminalIcon className="w-5 h-5 text-white" weight="bold" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">MentorSync</span>
                    </Link>
                    {isMobile && (
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(false)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            aria-label="Close menu"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <Dialog open={createClassOpen} onOpenChange={(open) => { setCreateClassOpen(open); if(!open) setCreateClassError(null); }}>
                    <DialogTrigger asChild>
                        <Button className="w-full bg-transparent border border-zinc-800 text-white hover:bg-[#5b4fff] hover:border-transparent rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm">
                            <PlusIcon className="w-4 h-4 mr-2" weight="bold" />Create New Class
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
                            <div className="space-y-1.5">
                                <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Classroom Name</Label>
                                <Input
                                    className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4"
                                    placeholder="e.g., Data Structures 101"
                                    value={newClassName}
                                    onChange={(e) => { setNewClassName(e.target.value); if(createClassError) setCreateClassError(null); }}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" className="bg-transparent border border-zinc-700 text-white hover:bg-zinc-800 hover:text-white rounded-xl" onClick={() => setCreateClassOpen(false)}>Cancel</Button>
                            <Button className="bg-[#5b4fff] hover:bg-[#4a3fdf] text-white rounded-xl" onClick={handleCreateClass} disabled={!newClassName}>Create Classroom</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2 mb-3">Your Classrooms</p>
                    {classrooms.map((c) => (
                        <button
                            key={c.classroomId}
                            onClick={() => {
                                setSelectedClassroom(c);
                                setShowAdminOverview(false);
                                setError(null);
                                if (isMobile) setMobileSidebarOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex justify-between items-center group ${
                                selectedClassroom?.classroomId === c.classroomId && !showAdminOverview
                                    ? 'bg-[#1a1b2e] border border-[#5b4fff]/40 text-white font-medium shadow-[0_0_15px_rgba(91,79,255,0.15)] ring-1 ring-[#5b4fff]/30'
                                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white border border-transparent'
                            }`}
                        >
                            <span className="truncate group-hover:translate-x-0.5 transition-transform">{c.className}</span>
                            <Badge className={`border-transparent transition-colors ${selectedClassroom?.classroomId === c.classroomId && !showAdminOverview ? 'bg-[#5b4fff] text-white' : 'bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200'}`}>
                                {c.enrolledStudents?.length || 0}
                            </Badge>
                        </button>
                    ))}
                    {classrooms.length === 0 && (
                        <div className="px-3 py-6 text-center text-xs text-zinc-500 leading-relaxed">
                            No classrooms yet.<br />Click "+ Create New Class" above.
                        </div>
                    )}
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

                <Link
                    to="/contact"
                    className="w-full flex items-center px-3 py-2 text-xs rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors border border-transparent"
                    onClick={() => { if (isMobile) setMobileSidebarOpen(false); }}
                >
                    <LifebuoyIcon className="w-4 h-4 mr-2 text-zinc-500" /> Help & Support
                </Link>

                {user?.role === 'SUPER_ADMIN' && (
                    <button
                        onClick={() => {
                            setShowAdminOverview(true);
                            setSelectedClassroom(null);
                            setError(null);
                            if (isMobile) setMobileSidebarOpen(false);
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
    );

    return (
        <div className="h-screen bg-[#09090e] text-white flex overflow-hidden selection:bg-[#5b4fff] selection:text-white">
            {/* Mobile Drawer Backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Drawer */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#09090e] border-r border-zinc-900 flex flex-col transition-transform duration-300 lg:hidden ${
                mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
                {renderSidebarContent(true)}
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 relative bg-[#09090e] border-r border-zinc-900 flex-col z-20 shrink-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
                {renderSidebarContent(false)}
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-[#0a0a0a] flex flex-col">
                <div className="inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-40 pointer-events-none fixed"></div>
                
                {/* Luminous Multi-Layer Ambient Glow */}
                <AmbientGlow />

                {/* Top Navigation Header */}
                <header className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/60 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Mobile Sidebar Hamburger */}
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(true)}
                            aria-label="Open sidebar menu"
                            className="lg:hidden p-2 rounded-xl bg-[#111111] border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            <MenuIcon className="w-5 h-5" weight="bold" />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm">
                            <Link to="/" className="text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:flex items-center gap-1 font-medium">
                                <HouseIcon className="w-4 h-4" />
                                <span>Home</span>
                            </Link>
                            <span className="text-zinc-600 hidden sm:inline">/</span>
                            <span className="text-zinc-400 font-medium">Classrooms</span>
                            {selectedClassroom && !showAdminOverview && (
                                <>
                                    <span className="text-zinc-600">/</span>
                                    <span className="text-white font-semibold tracking-tight truncate max-w-40 sm:max-w-xs">
                                        {selectedClassroom.className}
                                    </span>
                                </>
                            )}
                            {showAdminOverview && (
                                <>
                                    <span className="text-zinc-600">/</span>
                                    <span className="text-[#968fff] font-semibold tracking-tight">Admin Overview</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Header Navigation Items */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {classrooms.length > 1 && !showAdminOverview && (
                            <div className="hidden md:block">
                                <select
                                    aria-label="Switch classroom"
                                    value={selectedClassroom?.classroomId || ''}
                                    onChange={(e) => {
                                        const target = classrooms.find(c => c.classroomId === e.target.value);
                                        if (target) {
                                            setSelectedClassroom(target);
                                            setShowAdminOverview(false);
                                            setError(null);
                                        }
                                    }}
                                    className="bg-[#1a1b2e] border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-[#5b4fff] focus:outline-none transition-colors cursor-pointer"
                                >
                                    <option value="" disabled>Switch Classroom...</option>
                                    {classrooms.map(c => (
                                        <option key={c.classroomId} value={c.classroomId}>
                                            {c.className} ({c.enrolledStudents?.length || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <Link
                            to="/contact"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-[#111111]/80 hover:bg-zinc-800/80 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                        >
                            <LifebuoyIcon className="w-3.5 h-3.5" />
                            Support
                        </Link>

                        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                            <Avatar className="w-8 h-8 border border-zinc-800">
                                <AvatarFallback className="bg-[#1a1b2e] text-[#968fff] text-xs font-bold">
                                    {user?.name?.substring(0, 2).toUpperCase() || 'ME'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>

                <div className="relative z-10 flex-1 flex flex-col">
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
                            return (
                                <EmptyClassroomState
                                    classrooms={classrooms}
                                    onSelectClassroom={(c) => {
                                        setSelectedClassroom(c);
                                        setError(null);
                                    }}
                                    onCreateClass={() => setCreateClassOpen(true)}
                                    onOpenSidebar={() => setMobileSidebarOpen(true)}
                                />
                            );
                        }

                        return (
                            <div className="max-w-7xl mx-auto p-6 lg:p-10 min-h-full w-full">
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