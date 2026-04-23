import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, Users, BookOpen, ArrowLeft, Loader2, UserCheck, AlertTriangle, Trash2, RefreshCw, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { AdminService } from '@/services/endpoints';
import type { SystemOverviewDTO, MentorDTO, ClassroomDashboardDTO } from '@/types';
import axios from 'axios';


export function AdminOverview({ onBack }: { onBack: () => void }) {
    const [data, setData] = useState<SystemOverviewDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Action States
    const [isSyncing, setIsSyncing] = useState(false);
    const [deletingMentor, setDeletingMentor] = useState<MentorDTO | null>(null);
    const [deletingClassroom, setDeletingClassroom] = useState<ClassroomDashboardDTO | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchAdminData = async () => {
        try {
            const response = await AdminService.getOverview();
            setData(response.data);
        } catch (err) {
            console.error(err);
            setError(axios.isAxiosError(err) && err.response?.status === 403
                ? "Access Denied: You must be a SUPER_ADMIN to view this data."
                : "Failed to load system overview.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { void fetchAdminData(); }, []);

    // --- SUPERPOWER HANDLERS ---
    const handleForceSync = async () => {
        setIsSyncing(true);
        try {
            const res = await AdminService.forceSyncAll();
            showToast(res.data.message, 'success'); // Replaced alert()
            await fetchAdminData();
        } catch {
            showToast("Failed to force sync.", 'error'); // Replaced alert()
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteMentor = async () => {
        if (!deletingMentor) return;
        try {
            await AdminService.deleteMentor(deletingMentor.id);
            setDeletingMentor(null);
            showToast(`Successfully deleted mentor ${deletingMentor.name}`, 'success'); // Added Toast
            await fetchAdminData();
        } catch {
            showToast("Failed to delete mentor.", 'error');
        }
    };

    const handleDeleteClassroom = async () => {
        if (!deletingClassroom) return;
        try {
            await AdminService.deleteClassroom(deletingClassroom.classroomId);
            setDeletingClassroom(null);
            showToast(`Successfully deleted classroom ${deletingClassroom.className}`, 'success'); // Added Toast
            await fetchAdminData();
        } catch {
            showToast("Failed to delete classroom.", 'error');
        }
    };


    if (isLoading) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500" /></div>;
    }

    if (error || !data) {
        return (
            <div className="p-8">
                <Button variant="ghost" onClick={onBack} className="mb-6 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="flex flex-col items-center justify-center p-12 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                    <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                    <h2 className="text-xl font-bold text-rose-700 dark:text-rose-400 mb-2">Authorization Error</h2>
                    <p className="text-rose-600 dark:text-rose-300">{error}</p>
                </div>
            </div>
        );
    }

    const dialogClasses = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";

    return (
        <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-300">
            {/* Header & Global Sync Button */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Button variant="ghost" onClick={onBack} className="mb-2 -ml-4 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Return to Mentor View
                    </Button>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-indigo-500" /> System Administration
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Platform-wide overview and statistics.</p>
                </div>

                <Button
                    onClick={handleForceSync}
                    disabled={isSyncing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md border-transparent transition-all hover:shadow-lg"
                >
                    {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {isSyncing ? 'Syncing...' : 'Force Global Sync'}
                </Button>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Users className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Students</p>
                            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{data.totalStudents}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><UserCheck className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Mentors</p>
                            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{data.totalMentors}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><BookOpen className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Classrooms</p>
                            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{data.totalClassrooms}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* All Mentors List */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-zinc-400" /> Platform Mentors
                        </CardTitle>
                        <CardDescription className="dark:text-zinc-400">All registered instructors</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {data.allMentors.map((mentor: MentorDTO) => (
                                    <div key={mentor.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">{mentor.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-zinc-900 dark:text-white">{mentor.name}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{mentor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-transparent">
                                                {mentor.classroomIds?.length || 0} Classes
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingMentor(mentor)}
                                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* All Classrooms List */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-zinc-400" /> Global Classrooms
                        </CardTitle>
                        <CardDescription className="dark:text-zinc-400">All active classes across the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {data.allClassrooms.map((cls: ClassroomDashboardDTO) => (
                                    <div key={cls.classroomId} className="p-4 flex flex-col gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-zinc-900 dark:text-white">{cls.className}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20">
                                                    {cls.enrolledStudents?.length || 0} Students
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletingClassroom(cls)}
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mentor: <span className="text-zinc-700 dark:text-zinc-300">{cls.mentorName}</span></p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* DELETE MENTOR DIALOG */}
            <Dialog open={!!deletingMentor} onOpenChange={() => setDeletingMentor(null)}>
                <DialogContent className={dialogClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Delete Mentor
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Are you sure you want to permanently delete <strong>{deletingMentor?.name}</strong>?
                        </p>
                        <p className="text-sm font-bold text-rose-500 dark:text-rose-400 mt-3">
                            Warning: This will also permanently delete their {deletingMentor?.classroomIds?.length || 0} associated classroom(s).
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300" onClick={() => setDeletingMentor(null)}>Cancel</Button>
                        <Button onClick={handleDeleteMentor} className="bg-rose-600 hover:bg-rose-700 text-white border-transparent">Yes, Delete Everything</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CLASSROOM DIALOG */}
            <Dialog open={!!deletingClassroom} onOpenChange={() => setDeletingClassroom(null)}>
                <DialogContent className={dialogClasses}>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Force Delete Classroom
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            Are you sure you want to permanently delete <strong>{deletingClassroom?.className}</strong>?
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300" onClick={() => setDeletingClassroom(null)}>Cancel</Button>
                        <Button onClick={handleDeleteClassroom} className="bg-rose-600 hover:bg-rose-700 text-white border-transparent">Yes, Delete Classroom</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* NEW: Floating Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
                    toast.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{toast.message}</p>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

        </div>
    );
}