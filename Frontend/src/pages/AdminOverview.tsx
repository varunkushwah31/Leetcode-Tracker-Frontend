import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
    ShieldCheckIcon as ShieldCheck,
    UsersIcon,
    UserPlusIcon,
    BookOpenIcon,
    ArrowLeftIcon,
    SpinnerIcon as Loader2,
    UserCheckIcon,
    WarningIcon as AlertTriangle,
    TrashIcon as Trash2,
    ArrowsClockwiseIcon as RefreshCw,
    CheckCircleIcon as CheckCircle2,
    XIcon,
    WarningCircleIcon as AlertCircle,
    MagnifyingGlassIcon as SearchIcon,
    DatabaseIcon,
    LightningIcon,
    FireIcon,
    CpuIcon,
    HardDrivesIcon,
    CodeIcon,
} from '@phosphor-icons/react';
import { AdminService } from '@/services/endpoints';
import type { SystemOverviewDTO, MentorDTO, ClassroomDashboardDTO, StudentSummaryDTO, CacheStatsResponse } from '@/types';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

interface AdminOverviewProps {
    readonly onBack: () => void;
}

export function AdminOverview({ onBack }: Readonly<AdminOverviewProps>) {
    const [overviewData, setOverviewData] = useState<SystemOverviewDTO | null>(null);
    const [students, setStudents] = useState<StudentSummaryDTO[]>([]);
    const [cacheStats, setCacheStats] = useState<CacheStatsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    // Active Tab
    const [activeTab, setActiveTab] = useState<'overview' | 'mentors' | 'classrooms' | 'students' | 'cache'>('overview');

    // Search queries
    const [mentorSearch, setMentorSearch] = useState('');
    const [classroomSearch, setClassroomSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    // Action states
    const [isSyncingAll, setIsSyncingAll] = useState(false);
    const [syncingStudentId, setSyncingStudentId] = useState<string | null>(null);
    const [clearingCache, setClearingCache] = useState<string | null>(null);

    // Modal dialog states
    const [deletingMentor, setDeletingMentor] = useState<MentorDTO | null>(null);
    const [deletingClassroom, setDeletingClassroom] = useState<ClassroomDashboardDTO | null>(null);
    const [deletingStudent, setDeletingStudent] = useState<StudentSummaryDTO | null>(null);
    const [addMentorOpen, setAddMentorOpen] = useState(false);
    const [clearAllCacheOpen, setClearAllCacheOpen] = useState(false);

    // Add Mentor form
    const [newMentorName, setNewMentorName] = useState('');
    const [newMentorEmail, setNewMentorEmail] = useState('');
    const [newMentorPassword, setNewMentorPassword] = useState('');
    const [isCreatingMentor, setIsCreatingMentor] = useState(false);
    const [addMentorError, setAddMentorError] = useState<string | null>(null);

    // Error states
    const [syncError, setSyncError] = useState<string | null>(null);
    const [deleteMentorError, setDeleteMentorError] = useState<string | null>(null);
    const [deleteClassError, setDeleteClassError] = useState<string | null>(null);
    const [deleteStudentError, setDeleteStudentError] = useState<string | null>(null);

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const getErrMsg = (err: unknown, fallback: string) => {
        if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as { response?: { data?: { message?: string } | string } };
            if (typeof axiosErr.response?.data === 'string') return axiosErr.response.data;
            if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
        }
        return err instanceof Error && err.message ? err.message : fallback;
    };

    const fetchAllData = useCallback(async () => {
        try {
            const [ovRes, stRes, csRes] = await Promise.allSettled([
                AdminService.getOverview(),
                AdminService.getAllStudents(),
                AdminService.getCacheStats()
            ]);

            if (ovRes.status === 'fulfilled') {
                setOverviewData(ovRes.value.data);
            } else {
                throw ovRes.reason;
            }

            if (stRes.status === 'fulfilled') {
                setStudents(stRes.value.data || []);
            }

            if (csRes.status === 'fulfilled') {
                setCacheStats(csRes.value.data);
            }
        } catch (err: unknown) {
            setPageError(getErrMsg(err, 'Failed to load Super Admin command center.'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAllData();
    }, [fetchAllData]);

    // Handlers
    const handleForceSync = async () => {
        setSyncError(null);
        setIsSyncingAll(true);
        try {
            const res = await AdminService.forceSyncAll();
            showToast(res.data?.message || 'Global sync completed successfully.', 'success');
            await fetchAllData();
        } catch (err: unknown) {
            setSyncError(getErrMsg(err, 'Failed to force global sync.'));
        } finally {
            setIsSyncingAll(false);
        }
    };

    const handleCreateMentor = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddMentorError(null);

        if (!newMentorName.trim() || !newMentorEmail.trim() || !newMentorPassword.trim()) {
            setAddMentorError('All fields are required.');
            return;
        }

        if (newMentorPassword.length < 6) {
            setAddMentorError('Password must be at least 6 characters long.');
            return;
        }

        setIsCreatingMentor(true);
        try {
            const res = await AdminService.createMentor({
                name: newMentorName.trim(),
                email: newMentorEmail.trim(),
                password: newMentorPassword.trim(),
            });
            showToast(`Mentor "${res.data.name}" provisioned successfully!`, 'success');
            setAddMentorOpen(false);
            setNewMentorName('');
            setNewMentorEmail('');
            setNewMentorPassword('');
            await fetchAllData();
        } catch (err: unknown) {
            setAddMentorError(getErrMsg(err, 'Failed to create mentor account.'));
        } finally {
            setIsCreatingMentor(false);
        }
    };

    const handleDeleteMentor = async () => {
        if (!deletingMentor) return;
        setDeleteMentorError(null);
        try {
            await AdminService.deleteMentor(deletingMentor.id);
            showToast(`Deleted mentor "${deletingMentor.name}".`, 'success');
            setDeletingMentor(null);
            await fetchAllData();
        } catch (err: unknown) {
            setDeleteMentorError(getErrMsg(err, 'Failed to delete mentor.'));
        }
    };

    const handleDeleteClassroom = async () => {
        if (!deletingClassroom) return;
        setDeleteClassError(null);
        try {
            await AdminService.deleteClassroom(deletingClassroom.classroomId);
            showToast(`Deleted classroom "${deletingClassroom.className}".`, 'success');
            setDeletingClassroom(null);
            await fetchAllData();
        } catch (err: unknown) {
            setDeleteClassError(getErrMsg(err, 'Failed to delete classroom.'));
        }
    };

    const handleSyncStudent = async (student: StudentSummaryDTO) => {
        const studentId = student.id;
        if (!studentId) return;
        setSyncingStudentId(studentId);
        try {
            const res = await AdminService.syncStudent(studentId);
            showToast(res.data?.message || `Synced ${student.name}'s statistics.`, 'success');
            await fetchAllData();
        } catch (err: unknown) {
            showToast(getErrMsg(err, `Failed to sync student ${student.name}.`), 'error');
        } finally {
            setSyncingStudentId(null);
        }
    };

    const handleDeleteStudent = async () => {
        if (!deletingStudent?.id) return;
        setDeleteStudentError(null);
        try {
            await AdminService.deleteStudent(deletingStudent.id);
            showToast(`Deleted student "${deletingStudent.name}".`, 'success');
            setDeletingStudent(null);
            await fetchAllData();
        } catch (err: unknown) {
            setDeleteStudentError(getErrMsg(err, 'Failed to delete student.'));
        }
    };

    const handleClearCache = async (cacheName?: string) => {
        setClearingCache(cacheName || 'all');
        try {
            const res = await AdminService.clearCache(cacheName);
            showToast(res.data?.message || `Cache cleared successfully.`, 'success');
            setClearAllCacheOpen(false);
            const updatedStats = await AdminService.getCacheStats();
            setCacheStats(updatedStats.data);
        } catch (err: unknown) {
            showToast(getErrMsg(err, 'Failed to clear cache.'), 'error');
        } finally {
            setClearingCache(null);
        }
    };

    // Filtered lists
    const filteredMentors = useMemo(() => {
        if (!overviewData?.allMentors) return [];
        const q = mentorSearch.toLowerCase().trim();
        if (!q) return overviewData.allMentors;
        return overviewData.allMentors.filter(m =>
            m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
        );
    }, [overviewData?.allMentors, mentorSearch]);

    const filteredClassrooms = useMemo(() => {
        if (!overviewData?.allClassrooms) return [];
        const q = classroomSearch.toLowerCase().trim();
        if (!q) return overviewData.allClassrooms;
        return overviewData.allClassrooms.filter(c =>
            c.className.toLowerCase().includes(q) || (c.mentorName && c.mentorName.toLowerCase().includes(q))
        );
    }, [overviewData?.allClassrooms, classroomSearch]);

    const filteredStudents = useMemo(() => {
        const q = studentSearch.toLowerCase().trim();
        if (!q) return students;
        return students.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.email && s.email.toLowerCase().includes(q)) ||
            (s.leetcodeUsername && s.leetcodeUsername.toLowerCase().includes(q)) ||
            (s.codeforcesHandle && s.codeforcesHandle.toLowerCase().includes(q))
        );
    }, [students, studentSearch]);

    if (isLoading) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Loading Super Admin Center...</p>
            </div>
        );
    }

    if (pageError || !overviewData) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <Button variant="ghost" onClick={onBack} className="mb-6 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="flex flex-col items-center justify-center p-12 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-center">
                    <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                    <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400 mb-2">Access Denied or System Error</h2>
                    <p className="text-sm text-rose-600 dark:text-rose-300 max-w-md">{pageError}</p>
                </div>
            </div>
        );
    }

    const dialogCardClasses = "bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-2xl";

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 space-y-8">
            {/* Header & Command Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800/80">
                <div>
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="mb-2 -ml-3 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white h-8"
                    >
                        <ArrowLeftIcon className="h-3.5 w-3.5 mr-1.5" /> Return to Mentor View
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] flex items-center justify-center border border-[#5b4fff]/25 shadow-sm">
                            <ShieldCheck className="w-6 h-6" weight="fill" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                    Super Admin Center
                                </h1>
                                <Badge className="bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/30 font-semibold px-2 py-0.5 text-[11px]">
                                    ROOT PRIVILEGES
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Global governance, platform telemetry, faculty management, and Redis cache diagnostics.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Global Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        variant="outline"
                        onClick={() => fetchAllData()}
                        className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-xs font-semibold h-10 px-3.5 rounded-xl text-zinc-700 dark:text-zinc-300"
                    >
                        <RefreshCw className="w-4 h-4 mr-1.5 text-zinc-500" />
                        Refresh
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setClearAllCacheOpen(true)}
                        className="border-amber-200/80 dark:border-amber-500/25 bg-amber-50/50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold h-10 px-3.5 rounded-xl transition-colors"
                    >
                        <DatabaseIcon className="w-4 h-4 mr-1.5 text-amber-600 dark:text-amber-400" />
                        Flush Caches
                    </Button>

                    <Button
                        onClick={handleForceSync}
                        disabled={isSyncingAll}
                        className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-xs font-semibold h-10 px-4 rounded-xl shadow-md shadow-[#5b4fff]/20 transition-all cursor-pointer"
                    >
                        {isSyncingAll ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                Syncing Platform...
                            </>
                        ) : (
                            <>
                                <LightningIcon className="w-4 h-4 mr-1.5" weight="fill" />
                                Force Global Sync
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Error Banner */}
            <ErrorBanner message={syncError} className="mb-4" />

            {/* Key Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white/90 dark:bg-[#111116]/90 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Total Students
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                                {overviewData.totalStudents}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{overviewData.dualPlatformStudents || 0}</span> dual-platform
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/90 dark:bg-[#111116]/90 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Active Mentors
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                                {overviewData.totalMentors}
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                                Across all active faculties
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                            <UserCheckIcon className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/90 dark:bg-[#111116]/90 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Cohorts & Classes
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white mt-1">
                                {overviewData.totalClassrooms}
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{overviewData.totalAssignments || 0}</span> total assignments
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                            <BookOpenIcon className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/90 dark:bg-[#111116]/90 border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl relative overflow-hidden backdrop-blur-md">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                Redis Cache Engine
                            </p>
                            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-1 flex items-center gap-1.5">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${cacheStats?.redisStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                {cacheStats?.redisStatus === 'CONNECTED' ? 'Online' : 'Degraded'}
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 truncate max-w-36">
                                Mem: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cacheStats?.usedMemoryHuman || 'Active'}</span>
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <HardDrivesIcon className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="w-full">
                <TabsList className="bg-zinc-100 dark:bg-[#14141b] p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-full overflow-x-auto flex flex-nowrap">
                    <TabsTrigger
                        value="overview"
                        onClick={() => setActiveTab('overview')}
                        className="rounded-xl text-xs font-semibold px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e28] data-[state=active]:text-[#5b4fff] dark:data-[state=active]:text-[#968fff] data-[state=active]:shadow-xs transition-all cursor-pointer"
                    >
                        Telemetry & Platform
                    </TabsTrigger>
                    <TabsTrigger
                        value="mentors"
                        onClick={() => setActiveTab('mentors')}
                        className="rounded-xl text-xs font-semibold px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e28] data-[state=active]:text-[#5b4fff] dark:data-[state=active]:text-[#968fff] data-[state=active]:shadow-xs transition-all cursor-pointer"
                    >
                        Mentors & Faculty ({overviewData.allMentors?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                        value="classrooms"
                        onClick={() => setActiveTab('classrooms')}
                        className="rounded-xl text-xs font-semibold px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e28] data-[state=active]:text-[#5b4fff] dark:data-[state=active]:text-[#968fff] data-[state=active]:shadow-xs transition-all cursor-pointer"
                    >
                        Classrooms ({overviewData.allClassrooms?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger
                        value="students"
                        onClick={() => setActiveTab('students')}
                        className="rounded-xl text-xs font-semibold px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e28] data-[state=active]:text-[#5b4fff] dark:data-[state=active]:text-[#968fff] data-[state=active]:shadow-xs transition-all cursor-pointer"
                    >
                        Students Directory ({students.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="cache"
                        onClick={() => setActiveTab('cache')}
                        className="rounded-xl text-xs font-semibold px-4 py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e28] data-[state=active]:text-[#5b4fff] dark:data-[state=active]:text-[#968fff] data-[state=active]:shadow-xs transition-all cursor-pointer"
                    >
                        Redis Diagnostics
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: TELEMETRY & PLATFORM OVERVIEW */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Platform Distribution Card */}
                        <Card className="bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <CodeIcon className="w-5 h-5 text-[#5b4fff]" /> Platform Adoption Breakdown
                                </CardTitle>
                                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Multi-platform distribution across student base
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Dual-Platform (LC + CF)
                                        </span>
                                        <span className="text-zinc-900 dark:text-white">
                                            {overviewData.dualPlatformStudents || 0} students
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-2.5 rounded-full"
                                            style={{
                                                width: `${overviewData.totalStudents ? ((overviewData.dualPlatformStudents || 0) / overviewData.totalStudents) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> LeetCode Only
                                        </span>
                                        <span className="text-zinc-900 dark:text-white">
                                            {overviewData.leetcodeOnlyStudents || 0} students
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-amber-500 h-2.5 rounded-full"
                                            style={{
                                                width: `${overviewData.totalStudents ? ((overviewData.leetcodeOnlyStudents || 0) / overviewData.totalStudents) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Codeforces Only
                                        </span>
                                        <span className="text-zinc-900 dark:text-white">
                                            {overviewData.codeforcesOnlyStudents || 0} students
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-2.5 rounded-full"
                                            style={{
                                                width: `${overviewData.totalStudents ? ((overviewData.codeforcesOnlyStudents || 0) / overviewData.totalStudents) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Health Summary */}
                        <Card className="bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <CpuIcon className="w-5 h-5 text-emerald-500" /> Cluster & Cache Telemetry
                                </CardTitle>
                                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Real-time runtime state and active memory allocation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#181820] border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                                    <span className="text-zinc-600 dark:text-zinc-400">Redis Connection</span>
                                    <Badge className={`${cacheStats?.redisStatus === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                        {cacheStats?.redisStatus || 'N/A'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#181820] border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                                    <span className="text-zinc-600 dark:text-zinc-400">Redis Server Version</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">{cacheStats?.redisVersion || '7.x'}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#181820] border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                                    <span className="text-zinc-600 dark:text-zinc-400">Memory Utilization</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">
                                        {cacheStats?.usedMemoryHuman || 'N/A'} (Peak: {cacheStats?.usedMemoryPeakHuman || 'N/A'})
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-[#181820] border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                                    <span className="text-zinc-600 dark:text-zinc-400">Configured Cache Regions</span>
                                    <span className="font-semibold text-[#5b4fff] dark:text-[#968fff]">
                                        {cacheStats?.configuredCaches?.length || 0} caches active
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* TAB 2: MENTORS & FACULTY */}
                <TabsContent value="mentors" className="mt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search mentors by name or email..."
                                value={mentorSearch}
                                onChange={(e) => setMentorSearch(e.target.value)}
                                className="pl-9 bg-white dark:bg-[#14141b] border-zinc-200 dark:border-zinc-800 rounded-xl text-xs h-10"
                            />
                        </div>
                        <Button
                            onClick={() => setAddMentorOpen(true)}
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-xs font-semibold h-10 px-4 rounded-xl shadow-sm"
                        >
                            <UserPlusIcon className="w-4 h-4 mr-1.5" weight="bold" />
                            Add New Mentor
                        </Button>
                    </div>

                    <Card className="bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        <ScrollArea className="h-[460px]">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {filteredMentors.map((mentor) => (
                                    <div key={mentor.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#181820] transition-colors group">
                                        <div className="flex items-center gap-3.5">
                                            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs">
                                                    {mentor.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{mentor.name}</p>
                                                    {mentor.role === 'SUPER_ADMIN' ? (
                                                        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] py-0">
                                                            SUPER ADMIN
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-zinc-500 border-zinc-300 dark:border-zinc-700 text-[10px] py-0">
                                                            MENTOR
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{mentor.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 text-xs">
                                                {mentor.classroomIds?.length || 0} Classrooms
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingMentor(mentor)}
                                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
                                                title="Delete Mentor"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {filteredMentors.length === 0 && (
                                    <div className="p-8 text-center text-xs text-zinc-500">
                                        No mentors matched your search query.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* TAB 3: CLASSROOMS */}
                <TabsContent value="classrooms" className="mt-6 space-y-4">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search classrooms by title or mentor..."
                            value={classroomSearch}
                            onChange={(e) => setClassroomSearch(e.target.value)}
                            className="pl-9 bg-white dark:bg-[#14141b] border-zinc-200 dark:border-zinc-800 rounded-xl text-xs h-10"
                        />
                    </div>

                    <Card className="bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        <ScrollArea className="h-[460px]">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {filteredClassrooms.map((cls) => (
                                    <div key={cls.classroomId} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#181820] transition-colors group">
                                        <div>
                                            <p className="font-bold text-sm text-zinc-900 dark:text-white">{cls.className}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                Instructor: <span className="font-medium text-zinc-700 dark:text-zinc-300">{cls.mentorName || 'Unassigned'}</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 text-xs">
                                                {cls.enrolledStudents?.length || 0} Students
                                            </Badge>
                                            <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 text-xs">
                                                {cls.assignments?.length || 0} Assignments
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingClassroom(cls)}
                                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
                                                title="Force Delete Classroom"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {filteredClassrooms.length === 0 && (
                                    <div className="p-8 text-center text-xs text-zinc-500">
                                        No classrooms found matching search.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* TAB 4: STUDENTS DIRECTORY */}
                <TabsContent value="students" className="mt-6 space-y-4">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search students by name, email, LeetCode or Codeforces..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="pl-9 bg-white dark:bg-[#14141b] border-zinc-200 dark:border-zinc-800 rounded-xl text-xs h-10"
                        />
                    </div>

                    <Card className="bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        <ScrollArea className="h-[460px]">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {filteredStudents.map((student) => (
                                    <div key={student.id || student.leetcodeUsername || student.email} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-[#181820] transition-colors group">
                                        <div className="flex items-center gap-3.5">
                                            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarImage src={student.avatarUrl} />
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs">
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{student.name}</p>
                                                    <span className="text-xs text-zinc-400">({student.email})</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    {student.leetcodeUsername && (
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                                            LC: @{student.leetcodeUsername} ({student.leetcodeSolvedCount || 0} solved)
                                                        </span>
                                                    )}
                                                    {student.codeforcesHandle && (
                                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                                            CF: @{student.codeforcesHandle} ({student.codeforcesRating || 'Unrated'})
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                                        <FireIcon className="w-3.5 h-3.5 text-orange-500" weight="fill" />
                                                        {student.consistencyStreak || 0}d streak
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSyncStudent(student)}
                                                disabled={syncingStudentId === student.id}
                                                className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-8 px-3"
                                                title="Sync student LeetCode & Codeforces data"
                                            >
                                                {syncingStudentId === student.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                                ) : (
                                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                                                )}
                                                Sync
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingStudent(student)}
                                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl h-8 w-8"
                                                title="Delete Student"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {filteredStudents.length === 0 && (
                                    <div className="p-8 text-center text-xs text-zinc-500">
                                        No students found matching search.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </TabsContent>

                {/* TAB 5: REDIS DIAGNOSTICS & CACHE */}
                <TabsContent value="cache" className="mt-6 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <DatabaseIcon className="w-5 h-5 text-indigo-500" /> Redis Cache Management
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Clear stale cache keys or flush entire caching namespaces across the cluster.
                            </p>
                        </div>
                        <Button
                            onClick={() => setClearAllCacheOpen(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-10 px-4 rounded-xl shadow-sm cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Purge All Caches
                        </Button>
                    </div>

                    {/* Cache Namespaces Table */}
                    <Card className="bg-white dark:bg-[#111116] border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white">
                                Cache Namespaces & Key Volume
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {(cacheStats?.configuredCaches || [
                                    'classroom-dashboard',
                                    'classroom-analytics',
                                    'student-progress',
                                    'student-stats',
                                    'student-recent',
                                    'student-profile',
                                    'mentors-all',
                                    'mentor'
                                ]).map((cName) => {
                                    const count = cacheStats?.namespaceKeyCounts?.[`${cName}*`] ??
                                        cacheStats?.namespaceKeyCounts?.[cName] ?? 0;
                                    return (
                                        <div key={cName} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#181820] transition-colors">
                                            <div>
                                                <p className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">{cName}</p>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Spring Cache Region</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 text-xs">
                                                    {count >= 0 ? `${count} estimated keys` : 'Active'}
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={clearingCache === cName}
                                                    onClick={() => handleClearCache(cName)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-8 px-3 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400"
                                                >
                                                    {clearingCache === cName ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                                    ) : (
                                                        <RefreshCw className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                                                    )}
                                                    Evict
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ADD MENTOR DIALOG */}
            <Dialog open={addMentorOpen} onOpenChange={setAddMentorOpen}>
                <DialogContent className={dialogCardClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <UserPlusIcon className="w-5 h-5 text-[#5b4fff]" weight="bold" />
                            Provision New Mentor Account
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                            Create instructor credentials with classroom management capabilities.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateMentor} className="space-y-4 pt-2">
                        <ErrorBanner message={addMentorError} />

                        <div className="space-y-1.5">
                            <Label htmlFor="mentor-name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Full Name
                            </Label>
                            <Input
                                id="mentor-name"
                                value={newMentorName}
                                onChange={(e) => setNewMentorName(e.target.value)}
                                placeholder="Dr. Alan Turing"
                                required
                                className="bg-zinc-50 dark:bg-[#181820] border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="mentor-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Email Address
                            </Label>
                            <Input
                                id="mentor-email"
                                type="email"
                                value={newMentorEmail}
                                onChange={(e) => setNewMentorEmail(e.target.value)}
                                placeholder="turing@university.edu"
                                required
                                className="bg-zinc-50 dark:bg-[#181820] border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="mentor-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Temporary Password
                            </Label>
                            <Input
                                id="mentor-password"
                                type="password"
                                value={newMentorPassword}
                                onChange={(e) => setNewMentorPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                required
                                className="bg-zinc-50 dark:bg-[#181820] border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                            />
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAddMentorOpen(false)}
                                className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-10 px-4"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isCreatingMentor}
                                className="rounded-xl bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-xs font-semibold h-10 px-5"
                            >
                                {isCreatingMentor ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Mentor'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE MENTOR DIALOG */}
            <Dialog open={!!deletingMentor} onOpenChange={(open) => { if (!open) { setDeletingMentor(null); setDeleteMentorError(null); } }}>
                <DialogContent className={dialogCardClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Delete Mentor Account
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={deleteMentorError} />

                    <div className="py-2 text-sm text-zinc-600 dark:text-zinc-300 space-y-2">
                        <p>
                            Are you sure you want to permanently delete mentor <strong>{deletingMentor?.name}</strong> ({deletingMentor?.email})?
                        </p>
                        <p className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
                            Warning: This will cascade-delete their {deletingMentor?.classroomIds?.length || 0} associated classroom(s) and cannot be undone.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-10 px-4" onClick={() => setDeletingMentor(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteMentor} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-10 px-5">
                            Delete Mentor & Classes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CLASSROOM DIALOG */}
            <Dialog open={!!deletingClassroom} onOpenChange={(open) => { if (!open) { setDeletingClassroom(null); setDeleteClassError(null); } }}>
                <DialogContent className={dialogCardClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Force Delete Classroom
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={deleteClassError} />

                    <div className="py-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <p>
                            Are you sure you want to permanently delete cohort <strong>{deletingClassroom?.className}</strong>?
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                            All enrolled students ({deletingClassroom?.enrolledStudents?.length || 0}) will be unenrolled from this class.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-10 px-4" onClick={() => setDeletingClassroom(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteClassroom} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-10 px-5">
                            Delete Classroom
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE STUDENT DIALOG */}
            <Dialog open={!!deletingStudent} onOpenChange={(open) => { if (!open) { setDeletingStudent(null); setDeleteStudentError(null); } }}>
                <DialogContent className={dialogCardClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Delete Student Account
                        </DialogTitle>
                    </DialogHeader>

                    <ErrorBanner message={deleteStudentError} />

                    <div className="py-2 text-sm text-zinc-600 dark:text-zinc-300 space-y-2">
                        <p>
                            Are you sure you want to permanently remove student <strong>{deletingStudent?.name}</strong> ({deletingStudent?.email})?
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            This student will be removed from all enrolled classrooms and their platform tracking history deleted.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-10 px-4" onClick={() => setDeletingStudent(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteStudent} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold h-10 px-5">
                            Delete Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CLEAR ALL CACHES CONFIRMATION DIALOG */}
            <Dialog open={clearAllCacheOpen} onOpenChange={setClearAllCacheOpen}>
                <DialogContent className={dialogCardClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <DatabaseIcon className="w-5 h-5" /> Purge All Distributed Caches
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <p>
                            This will evict all cached dashboards, student stats, analytics, and mentor lists from Redis. Fresh data will be fetched on next request.
                        </p>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-10 px-4" onClick={() => setClearAllCacheOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleClearCache()} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-10 px-5">
                            Confirm Purge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Floating Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${
                    toast.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" weight="fill" /> : <AlertCircle className="w-5 h-5 shrink-0" weight="fill" />}
                    <p className="text-xs font-semibold">{toast.message}</p>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                        aria-label="Dismiss notification"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}