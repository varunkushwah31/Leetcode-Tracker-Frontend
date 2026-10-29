import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    SpinnerIcon as Loader2,
    SignOutIcon as LogOut,
    PulseIcon as Activity,
    DownloadSimpleIcon as Download,
    KeyIcon,
    CodeIcon,
    UsersIcon as Users,
    SquaresFourIcon as SquaresFour,
    FireIcon as Flame,
    GraduationCapIcon as GraduationCap,
    ChartBarIcon as ChartBar,
    TrophyIcon as Trophy
} from '@phosphor-icons/react';
import { SocialHubView, type SocialTabType } from '../components/social/SocialHubView';
import { QuickSocialWidget } from '../components/social/QuickSocialWidget';
import { SHOW_PVP_DUELS } from '../config/socialFeatureFlags';
import { BrandLogo } from '../components/common/BrandLogo';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { StudentService, SocialService } from '../services/endpoints';
import type { StudentExtendedDTO, AssignmentDTO } from '@/types';

import { ProfileStats } from '../components/dashboard/student/ProfileStats';
import { DailyChallengeCard } from '../components/dashboard/student/DailyChallengeCard';
import { UpcomingContestsCard } from '../components/dashboard/student/UpcomingContestsCard';
import { ActivityHeatmap } from '../components/dashboard/student/ActivityHeatmap';
import { PendingAssignments } from '../components/dashboard/student/PendingAssignments';
import { ClassroomList } from '../components/dashboard/student/ClassroomList';
import { AcademicSummaryCard } from '../components/dashboard/student/AcademicSummaryCard';
import { ClassroomGuidanceCard } from '../components/dashboard/student/ClassroomGuidanceCard';
import { ContestRatingsSection } from '../components/dashboard/student/ContestRatingsSection';
import { BadgesList } from '../components/dashboard/student/BadgesList';
import { DifficultyBreakdownCard } from '../components/dashboard/student/DifficultyBreakdownCard';
import { RecentActivityCard } from '../components/dashboard/student/RecentActivityCard';
import { UnifiedContestHistory } from '../components/dashboard/student/UnifiedContestHistory';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useClassroomWebSocket } from "@/hooks/useClassroomWebSocket.ts";
import { useKeyboardScroll } from '../hooks/useKeyboardScroll';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { DottedBackground } from '../components/ui/DottedBackground';
import { ErrorBoundary } from '../components/ErrorBoundary';

type DashboardViewFilter = 'all' | 'daily' | 'academic' | 'practice' | 'contests';

export function StudentDashboard() {
    const { logout, user } = useAuth();
    useKeyboardScroll();
    const [dashboardData, setDashboardData] = useState<StudentExtendedDTO | null>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
    const [mainTab, setMainTab] = useState<'overview' | 'social'>('overview');
    const [socialInitialTab, setSocialInitialTab] = useState<SocialTabType>('friends');
    const [activeFilter, setActiveFilter] = useState<DashboardViewFilter>('all');

    // --- Specific Error States ---
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

    // Auto-refresh on WS ping
    useClassroomWebSocket(selectedClassroomId, () => {
        console.log("Auto-refreshing Student Dashboard...");
        void fetchDashboard();
    });

    useEffect(() => {
        void SocialService.pingPresence().catch(() => {});
        
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadAndAutofetch = async () => {
            await fetchDashboard();
            try {
                setIsSyncing(true);
                const syncRes = await StudentService.syncProfile();
                if (isMounted && syncRes.data) {
                    setDashboardData(syncRes.data);
                }
            } catch (err: unknown) {
                console.warn('Background profile auto-fetch notice:', err);
            } finally {
                if (isMounted) {
                    setIsSyncing(false);
                }
            }
        };
        void loadAndAutofetch();
        return () => { isMounted = false; };
    }, [fetchDashboard]);

    const handleSync = async () => {
        setSyncError(null);
        setIsSyncing(true);

        try {
            const response = await StudentService.syncProfile();
            setDashboardData(response.data);
        } catch (err: unknown) {
            setSyncError(getErrorMessage(err, 'Failed to sync profiles.'));
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportReport = async () => {
        setIsExporting(true);
        try {
            const response = await StudentService.exportMyReport();
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const username = dashboardData?.leetcodeUsername || dashboardData?.codeforcesHandle || 'my';
            link.setAttribute('download', `${username}_Performance_Report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            setPageError(getErrorMessage(err, 'Failed to export performance report.'));
        } finally {
            setIsExporting(false);
        }
    };

    const isAssignmentCompleted = (assignment: AssignmentDTO) => {
        if (dashboardData?.manuallyCompletedAssignments?.includes(assignment.id)) return true;
        const normTarget = assignment.titleSlug ? assignment.titleSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
        return !!dashboardData?.recentSubmissions?.some(sub => {
            const platformMatches = !assignment.platform || !sub.platform || assignment.platform === sub.platform;
            const normSub = sub.titleSlug ? sub.titleSlug.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : '';
            return platformMatches && normSub === normTarget;
        });
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f1f3f7] dark:bg-[#0a0a0a] relative overflow-hidden">
                <DottedBackground />
                <div className="flex flex-col items-center space-y-4 relative z-10">
                    <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                    <p className="font-medium text-zinc-600 dark:text-zinc-400">Loading your stats...</p>
                </div>
            </div>
        );
    }

    const easyCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = dashboardData?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = dashboardData?.totalSolved ?? (easyCount + medCount + hardCount);
    const rating = Math.round(dashboardData?.currentContestRating || 0);

    const allAssignmentsList: {
        classroomId: string;
        className: string;
        assignment: AssignmentDTO;
        isCompleted: boolean;
    }[] = [];

    dashboardData?.classrooms?.forEach(cls => {
        cls.assignments?.forEach(assignment => {
            allAssignmentsList.push({
                classroomId: cls.id!,
                className: cls.className,
                assignment,
                isCompleted: isAssignmentCompleted(assignment),
            });
        });
    });

    const totalAssignmentsCount = allAssignmentsList.length;
    const completedAssignmentsCount = allAssignmentsList.filter(a => a.isCompleted).length;
    const pendingAssignmentsCount = totalAssignmentsCount - completedAssignmentsCount;

    return (
        <div className="min-h-screen flex flex-col bg-[#f1f3f7] dark:bg-[#0a0a0a] transition-colors duration-200 relative">
            <DottedBackground />
            <div className="hidden dark:block">
                <AmbientGlow />
            </div>

            <header className="bg-white/90 dark:bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-200/90 dark:border-zinc-800 sticky top-0 z-20 shadow-xs transition-colors duration-200">
                <div className="max-w-360 mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <BrandLogo size="responsive" />

                        {/* Top-level Navigation Switcher */}
                        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 ml-2 border border-zinc-200/60 dark:border-zinc-700/60">
                            <button
                                type="button"
                                onClick={() => setMainTab('overview')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    mainTab === 'overview'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold border border-zinc-200/60 dark:border-zinc-700/60'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => setMainTab('social')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    mainTab === 'social'
                                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold border border-zinc-200/60 dark:border-zinc-700/60'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                }`}
                            >
                                <Users className={`w-3.5 h-3.5 ${mainTab === 'social' ? 'text-[#5b4fff]' : ''}`} /> {SHOW_PVP_DUELS ? 'Social Hub & PVP' : 'Social Hub'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-4">
                        {/* Mobile Quick Action Buttons */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="sm:hidden border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer h-8.5 w-8.5"
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Sync Profile"
                            aria-label="Sync Profile"
                        >
                            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-[#5b4fff]" /> : <Activity className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" />}
                        </Button>

                        {/* Desktop Action Buttons */}
                        <Button variant="outline" className="hidden sm:flex border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer text-xs font-semibold h-10 px-3.5" onClick={handleExportReport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-zinc-500" /> : <Download className="w-4 h-4 mr-1.5 text-[#5b4fff] dark:text-[#968fff]" />}
                            <span>Export Report (CSV)</span>
                        </Button>

                        <Button variant="outline" className="hidden sm:flex border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl cursor-pointer text-xs font-semibold h-10 px-3.5" onClick={handleSync} disabled={isSyncing}>
                            {isSyncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-zinc-500" /> : <Activity className="w-4 h-4 mr-1.5 text-zinc-500 dark:text-zinc-400" />}
                            <span>Sync Profile</span>
                        </Button>

                        <Link to="/contact" className="hidden md:inline-flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-[#5b4fff] transition-colors">
                            Help
                        </Link>

                        <ThemeToggle className="h-8.5 w-8.5 sm:h-9 sm:w-9" />

                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border border-zinc-200 dark:border-zinc-700">
                                <AvatarImage src={dashboardData?.avatarUrl} />
                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm">{user?.name?.substring(0, 2) || 'ST'}</AvatarFallback>
                            </Avatar>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">{dashboardData?.name || user?.name}</p>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">@{dashboardData?.leetcodeUsername || dashboardData?.codeforcesHandle || 'student'}</p>
                            </div>
                        </div>
                        <ChangePasswordModal
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8.5 w-8.5 sm:h-9 sm:w-9 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                    title="Change Password"
                                    aria-label="Change Password"
                                >
                                    <KeyIcon className="w-4 h-4" />
                                </Button>
                            }
                        />
                        <Button variant="ghost" size="icon" onClick={logout} className="h-8.5 w-8.5 sm:h-9 sm:w-9 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400" title="Sign Out" aria-label="Sign Out">
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main
                tabIndex={0}
                aria-label="Student dashboard content"
                className="relative z-10 max-w-360 mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full focus:outline-none"
            >
                <ErrorBanner message={pageError} className="mb-6" />
                <ErrorBanner message={syncError} className="mb-6" />

                {/* Onboarding Banner for students registering via OAuth without handles */}
                {dashboardData && !dashboardData.leetcodeUsername && !dashboardData.codeforcesHandle && (
                    <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-indigo-50/90 dark:bg-[#5b4fff]/10 border border-indigo-200/80 dark:border-[#5b4fff]/20 text-zinc-900 dark:text-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] shrink-0 mt-0.5 sm:mt-0">
                                <CodeIcon className="w-5 h-5" weight="bold" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Welcome! Connect your coding profiles</h3>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                                    Link your LeetCode or Codeforces account in your profile below to start syncing solved problems, contest ratings, and classroom assignments.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile View Switcher */}
                <div className="flex md:hidden items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 mb-6">
                    <button
                        type="button"
                        onClick={() => setMainTab('overview')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            mainTab === 'overview'
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold border border-zinc-200/60 dark:border-zinc-700/60'
                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setMainTab('social')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            mainTab === 'social'
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs font-bold border border-zinc-200/60 dark:border-zinc-700/60'
                                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Users className={`w-3.5 h-3.5 ${mainTab === 'social' ? 'text-[#5b4fff]' : ''}`} /> {SHOW_PVP_DUELS ? 'Social Hub & PVP' : 'Social Hub'}
                    </button>
                </div>

                {mainTab === 'social' ? (
                    <SocialHubView initialTab={socialInitialTab} />
                ) : (
                    <div className="space-y-8">
                        {/* Profile Identity & Core Metrics */}
                        <ProfileStats
                            data={dashboardData}
                            totalSolved={totalSolved}
                            rating={rating}
                            onProfileUpdated={fetchDashboard}
                        />

                        {/* Modular Focus Filters for Enhanced Scalability */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto custom-scrollbar shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                        activeFilter === 'all'
                                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold border border-emerald-500/30'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <SquaresFour className="w-3.5 h-3.5 text-zinc-400" /> All Overview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('daily')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                        activeFilter === 'daily'
                                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold border border-emerald-500/30'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Daily Focus
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('academic')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                        activeFilter === 'academic'
                                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold border border-emerald-500/30'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Academic & Classrooms
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('practice')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                        activeFilter === 'practice'
                                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold border border-emerald-500/30'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <ChartBar className="w-3.5 h-3.5 text-emerald-500" /> Practice Analytics
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveFilter('contests')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                        activeFilter === 'contests'
                                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold border border-emerald-500/30'
                                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Contest Arena
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                <span>Live Sync Active</span>
                            </div>
                        </div>

                        {/* When Academic & Classrooms is active: Dedicated Balanced Workspace */}
                        {activeFilter === 'academic' ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {/* 1. Panoramic Academic Overview Hero */}
                                <ErrorBoundary fallback={null}>
                                    <AcademicSummaryCard
                                        classrooms={dashboardData?.classrooms}
                                        totalAssignments={totalAssignmentsCount}
                                        completedCount={completedAssignmentsCount}
                                        pendingCount={pendingAssignmentsCount}
                                        streak={dashboardData?.consistencyStreak || 0}
                                    />
                                </ErrorBoundary>

                                {/* 2. Balanced 2-Column Academic Workspace: Classrooms (Left) & Assignments (Right) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* Left Column: Enrolled Classrooms & Guidance (4 cols) */}
                                    <div className="lg:col-span-4 space-y-6">
                                        <ErrorBoundary fallback={null}>
                                            <ClassroomList
                                                classrooms={dashboardData?.classrooms}
                                                selectedClassroomId={selectedClassroomId}
                                                onSelectClassroom={setSelectedClassroomId}
                                                isAssignmentCompleted={isAssignmentCompleted}
                                            />
                                        </ErrorBoundary>

                                        <ErrorBoundary fallback={null}>
                                            <ClassroomGuidanceCard onSync={handleSync} isSyncing={isSyncing} />
                                        </ErrorBoundary>
                                    </div>

                                    {/* Right Column: Classroom Assignments (8 cols) */}
                                    <div className="lg:col-span-8 space-y-6">
                                        <ErrorBoundary fallback={null}>
                                            <PendingAssignments
                                                assignments={allAssignmentsList}
                                                isSyncing={isSyncing}
                                                onSync={handleSync}
                                                selectedClassroomId={selectedClassroomId}
                                                onClearFilter={() => setSelectedClassroomId(null)}
                                                onValidationSuccess={fetchDashboard}
                                                classrooms={dashboardData?.classrooms}
                                                onSelectClassroom={setSelectedClassroomId}
                                            />
                                        </ErrorBoundary>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* --- Standard Continuous Two-Column Bento Layout for Other Views --- */
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Primary Column (Left - 60-65% width) */}
                                <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                                    {/* 1. Problem of the Day */}
                                    {(activeFilter === 'all' || activeFilter === 'daily') && (
                                        <ErrorBoundary fallback={null}>
                                            <DailyChallengeCard
                                                classroomId={selectedClassroomId}
                                                recentSubmissions={dashboardData?.recentSubmissions}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* 2. Consistency & Activity Heatmap */}
                                    {(activeFilter === 'all' || activeFilter === 'daily' || activeFilter === 'practice') && (
                                        <ErrorBoundary fallback={null}>
                                            <ActivityHeatmap
                                                progressHistory={dashboardData?.progressHistory}
                                                consistencyStreak={dashboardData?.consistencyStreak}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* 3. Contest Arena Center: Rating Progression Graphs */}
                                    {(activeFilter === 'all' || activeFilter === 'contests') && (
                                        <ErrorBoundary fallback={null}>
                                            <ContestRatingsSection
                                                contestHistory={dashboardData?.contestHistory}
                                                currentContestRating={dashboardData?.currentContestRating}
                                                globalRanking={dashboardData?.rank}
                                                codeforcesContestHistory={dashboardData?.codeforcesContestHistory}
                                                codeforcesRating={dashboardData?.codeforcesRating}
                                                codeforcesMaxRating={dashboardData?.codeforcesMaxRating}
                                                codeforcesRank={dashboardData?.codeforcesRank}
                                                codeforcesMaxRank={dashboardData?.codeforcesMaxRank}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* 4. Unified Contest History */}
                                    {(activeFilter === 'all' || activeFilter === 'contests') && (
                                        <ErrorBoundary fallback={null}>
                                            <UnifiedContestHistory className="defer-offscreen"
                                                contestHistory={dashboardData?.contestHistory}
                                                codeforcesContestHistory={dashboardData?.codeforcesContestHistory}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* 5. Academic Focus: Assignments in All Overview */}
                                    {activeFilter === 'all' && (
                                        <ErrorBoundary fallback={null}>
                                            <PendingAssignments
                                                assignments={allAssignmentsList}
                                                isSyncing={isSyncing}
                                                onSync={handleSync}
                                                selectedClassroomId={selectedClassroomId}
                                                onClearFilter={() => setSelectedClassroomId(null)}
                                                onValidationSuccess={fetchDashboard}
                                                classrooms={dashboardData?.classrooms}
                                                onSelectClassroom={setSelectedClassroomId}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* If in Practice Filter, show recent submissions in the main column */}
                                    {activeFilter === 'practice' && (
                                        <ErrorBoundary fallback={null}>
                                            <RecentActivityCard data={dashboardData} />
                                        </ErrorBoundary>
                                    )}
                                </div>

                                {/* Companion Sidebar Column (Right - 35-40% width) */}
                                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                                    {/* 1. Quick Social Hub & 1v1 PvP Live Status */}
                                    {(activeFilter === 'all' || activeFilter === 'daily' || activeFilter === 'contests') && (
                                        <ErrorBoundary fallback={null}>
                                            <QuickSocialWidget
                                                onOpenSocialHub={(tab) => {
                                                    if (tab) setSocialInitialTab(tab);
                                                    setMainTab('social');
                                                }}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* 2. My Classrooms in All Overview */}
                                    {activeFilter === 'all' && (
                                        <ErrorBoundary fallback={null}>
                                            <ClassroomList
                                                classrooms={dashboardData?.classrooms}
                                                selectedClassroomId={selectedClassroomId}
                                                onSelectClassroom={setSelectedClassroomId}
                                                isAssignmentCompleted={isAssignmentCompleted}
                                            />
                                        </ErrorBoundary>
                                    )}

                                    {/* 3. Difficulty Breakdown Progress */}
                                    {(activeFilter === 'all' || activeFilter === 'daily' || activeFilter === 'practice') && (
                                        <ErrorBoundary fallback={null}>
                                            <DifficultyBreakdownCard data={dashboardData} totalSolved={totalSolved} />
                                        </ErrorBoundary>
                                    )}

                                    {/* 4. Upcoming Contests Schedule */}
                                    {(activeFilter === 'all' || activeFilter === 'contests') && (
                                        <ErrorBoundary fallback={null}>
                                            <div className="defer-offscreen"><UpcomingContestsCard /></div>
                                        </ErrorBoundary>
                                    )}

                                    {/* 5. Recent Submissions Feed */}
                                    {(activeFilter === 'all' || activeFilter === 'daily') && (
                                        <ErrorBoundary fallback={null}>
                                            <RecentActivityCard data={dashboardData} />
                                        </ErrorBoundary>
                                    )}

                                    {/* 6. Earned Badges Showcase */}
                                    {(activeFilter === 'all' || activeFilter === 'practice') && (
                                        <ErrorBoundary fallback={null}>
                                            <div className="defer-offscreen"><BadgesList badges={dashboardData?.badges} /></div>
                                        </ErrorBoundary>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer with Contact Us */}
            <footer className="max-w-360 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex justify-center">
                <a href="/contact" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-[#5b4fff] transition-colors">
                    Need Help? Contact Us
                </a>
            </footer>
        </div>
    );
}
