import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SpinnerIcon as Loader2, TerminalIcon, SignOutIcon as LogOut, PulseIcon as Activity } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { StudentService } from '../services/endpoints';
import type { StudentExtendedDTO, AssignmentDTO } from '@/types';

import { ProfileStats } from '../components/dashboard/student/ProfileStats';
import { ActivityHeatmap } from '../components/dashboard/student/ActivityHeatmap';
import { PendingAssignments } from '../components/dashboard/student/PendingAssignments';
import { ClassroomList } from '../components/dashboard/student/ClassroomList';
import { BadgesList } from '../components/dashboard/student/BadgesList';
import { StudentRightSidebar } from '../components/dashboard/student/StudentRightSidebar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useClassroomWebSocket } from "@/hooks/useClassroomWebSocket.ts";
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';

export function StudentDashboard() {
    const { logout, user } = useAuth();
    const [dashboardData, setDashboardData] = useState<StudentExtendedDTO | null>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);

    // --- NEW: Specific Error States ---
    const [pageError, setPageError] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const getErrorMessage = (err: unknown, fallback: string) =>
        err instanceof Error && err.message ? err.message : fallback;

    const fetchDashboard = useCallback(async () => {
        setPageError(null);
        try {
            const response = await StudentService.getDashboard();
            setDashboardData(response.data);
        } catch (err: unknown) {
            setPageError(getErrorMessage(err, 'Failed to load dashboard.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // When a ping is received, it calls fetchDashboardData to silently update the UI.
    useClassroomWebSocket(selectedClassroomId, () => {
        console.log("Auto-refreshing Student Dashboard...");
        void fetchDashboard();
    });

    useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);

    const handleSync = async () => {
        if (!dashboardData?.leetcodeUsername) return;

        setSyncError(null);
        setIsSyncing(true);

        try {
            const response = await StudentService.syncProfile(dashboardData.leetcodeUsername);
            setDashboardData(response.data);
        } catch (err: unknown) {
            setSyncError(getErrorMessage(err, 'Failed to sync with LeetCode.'));
        } finally {
            setIsSyncing(false);
        }
    };

    const isAssignmentCompleted = (assignment: AssignmentDTO) => {
        if (dashboardData?.manuallyCompletedAssignments?.includes(assignment.id)) return true;
        const normTarget = assignment.titleSlug ? assignment.titleSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
        return !!dashboardData?.recentSubmissions?.some(sub => {
            const platformMatches = !assignment.platform || !sub.platform || assignment.platform === sub.platform;
            const normSub = sub.titleSlug ? sub.titleSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
            return platformMatches &&
                normSub === normTarget &&
                sub.timestamp >= assignment.startTimestamp &&
                sub.timestamp <= assignment.endTimestamp;
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B]">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-500" />
                    <p className="font-medium text-zinc-500 dark:text-zinc-400">Decrypting LeetCode stats...</p>
                </div>
            </div>
        );
    }

    const easyCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = dashboardData?.totalSolved ?? (easyCount + medCount + hardCount);
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
        <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#09090B] transition-colors duration-200 relative">
            <div className="hidden dark:block">
                <AmbientGlow />
            </div>

            <header className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-sm transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                                <TerminalIcon className="w-5 h-5 text-white" weight="bold" />
                            </div>
                            <span className="text-xl font-bold text-zinc-900 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">MentorSync</span>
                        </Link>
                        <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                            Student
                        </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Button variant="outline" className="hidden sm:flex border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl" onClick={handleSync} disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-500" /> : <Activity className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" />}
                            <span>Sync Profile</span>
                        </Button>

                        <Link to="/contact" className="hidden md:inline-flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-[#5b4fff] transition-colors">
                            Help
                        </Link>

                        <ThemeToggle />

                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />
                        <div className="flex items-center gap-3">
                            <Avatar className="border border-zinc-200 dark:border-zinc-700">
                                <AvatarImage src={dashboardData?.avatarUrl} />
                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">{user?.name?.substring(0, 2) || 'ST'}</AvatarFallback>
                            </Avatar>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">{dashboardData?.name || user?.name}</p>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">@{dashboardData?.leetcodeUsername || 'student'}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-red-50 dark:hover:bg-rose-500/10 hover:text-red-600 dark:hover:text-rose-400 text-zinc-500 dark:text-zinc-400">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

                {/* 5. Render any global errors (like an initial 500 error, or a failed sync) */}
                <ErrorBanner message={pageError} className="mb-6" />
                <ErrorBanner message={syncError} className="mb-6" />

                <ProfileStats data={dashboardData} totalSolved={totalSolved} rating={rating} onProfileUpdated={fetchDashboard} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ActivityHeatmap progressHistory={dashboardData?.progressHistory} />
                        <PendingAssignments
                            assignments={pendingAssignments}
                            isSyncing={isSyncing}
                            onSync={handleSync}
                            selectedClassroomId={selectedClassroomId}
                            onClearFilter={() => setSelectedClassroomId(null)}
                            onValidationSuccess={fetchDashboard}
                        />
                        <ClassroomList classrooms={dashboardData?.classrooms} selectedClassroomId={selectedClassroomId} onSelectClassroom={setSelectedClassroomId} />
                    </div>

                    <div className="space-y-8">
                        <StudentRightSidebar data={dashboardData} totalSolved={totalSolved} />
                        <BadgesList badges={dashboardData?.badges} />
                    </div>
                </div>
            </main>

            {/* Footer with Contact Us */}
            <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex justify-center">
                <a href="/contact" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-[#5b4fff] transition-colors">
                    Need Help? Contact Us
                </a>
            </footer>
        </div>
    );
}