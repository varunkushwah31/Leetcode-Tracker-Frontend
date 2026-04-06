import { useEffect, useState } from 'react';
import { 
    Target, BookOpen, LogOut, Code2, AlertCircle, 
    Medal, Clock, CheckCircle2, Link as LinkIcon, RefreshCw, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudentService } from '../services/endpoints';
import type { StudentSummaryDTO, AssignmentDTO } from '../types';

const formatLeetcodeDate = (timestamp: number | string | any): string => {
    if (!timestamp) return 'Unknown Date';
    if (typeof timestamp === 'number') return new Date(timestamp * 1000).toLocaleDateString();
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    return 'Invalid Date';
};

const generateHeatmapDays = (progressHistory: any[]) => {
    const days = [];
    const today = new Date();
    const progressMap: Record<string, number> = {};
    
    progressHistory?.forEach(record => {
        const dateStr = typeof record.date === 'object' ? record.date.$date : record.date;
        const localDate = new Date(dateStr).toISOString().split('T')[0];
        progressMap[localDate] = record.questionSolved;
    });

    for (let i = 83; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        days.push({ date: dateKey, count: progressMap[dateKey] || 0 });
    }
    return days;
};

const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2) return 'bg-green-300';
    if (count <= 5) return 'bg-green-400';
    if (count <= 8) return 'bg-green-500';
    return 'bg-green-600';
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [dashboardData, setDashboardData] = useState<StudentSummaryDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState('');

    const fetchDashboard = async () => {
        try {
            const response = await StudentService.getDashboard();
            setDashboardData(response.data);
        } catch (err) {
            setError('Failed to load dashboard data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // --- THE NEW AUTO-SYNC LOGIC ---
    const handleAutoSync = async () => {
        if (!dashboardData?.leetcodeUsername) return;
        setIsSyncing(true);
        try {
            // Tell the backend to pull fresh data from LeetCode
            const response = await StudentService.syncProfile(dashboardData.leetcodeUsername);
            
            // Instantly update the dashboard with the fresh data!
            setDashboardData(response.data);
        } catch (err) {
            alert("Failed to sync with LeetCode. Please try again later.");
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-Completion logic based on backend arrays
    const isAssignmentCompleted = (assignment: AssignmentDTO) => {
        if (dashboardData?.manuallyCompletedAssignments?.includes(assignment.id)) return true;
        
        const autoCompleted = dashboardData?.recentSubmissions?.some(sub => 
            sub.titleSlug === assignment.titleSlug &&
            sub.timestamp >= assignment.startTimestamp && 
            sub.timestamp <= assignment.endTimestamp
        );
        return !!autoCompleted;
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <p className="font-medium text-slate-500">Decrypting LeetCode stats...</p>
                </div>
            </div>
        );
    }

    const totalSolved = dashboardData?.problemStats?.find(s => s.difficulty === 'All')?.count || dashboardData?.totalSolved || 0;
    const rating = Math.round(dashboardData?.currentContestRating || dashboardData?.contestRating || 0);
    const heatmapDays = generateHeatmapDays(dashboardData?.progressHistory || []);

    const pendingAssignments: { classroomId: string, className: string, assignment: AssignmentDTO }[] = [];
    dashboardData?.classrooms?.forEach(cls => {
        cls.assignments?.forEach(assignment => {
            if (!isAssignmentCompleted(assignment)) {
                pendingAssignments.push({ classroomId: cls.id, className: cls.className, assignment });
            }
        });
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <nav className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Code2 className="h-8 w-8 text-blue-600" />
                        <span className="text-xl font-bold text-slate-900">LeetTracker</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <span className="text-sm font-medium text-slate-600">
                            Hello, {dashboardData?.name || user?.name}
                        </span>
                        <button
                            onClick={logout}
                            className="flex items-center space-x-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto mt-8 max-w-7xl px-6">
                {error && (
                    <div className="mb-6 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {dashboardData?.avatarUrl ? (
                                <img src={dashboardData.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full border-2 border-slate-200 object-cover shadow-sm"/>
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-slate-200">
                                    <span className="text-2xl font-bold text-blue-600">{dashboardData?.name?.charAt(0)}</span>
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">{dashboardData?.name}</h1>
                                <a 
                                    href={`https://leetcode.com/${dashboardData?.leetcodeUsername}`} 
                                    target="_blank" rel="noreferrer"
                                    className="mt-1 flex items-center text-blue-600 hover:underline"
                                >
                                    @{dashboardData?.leetcodeUsername}
                                </a>
                            </div>
                        </div>
                        <div className="text-right flex gap-8">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Solved</p>
                                <p className="text-2xl font-bold text-slate-900">{totalSolved}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Contest Rating</p>
                                <p className="text-2xl font-bold text-slate-900">{rating}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Target className="h-5 w-5 text-green-500" /> Daily Activity (Last 12 Weeks)
                            </h2>
                            <div className="flex overflow-x-auto pb-2">
                                <div className="grid grid-flow-col gap-1.5" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                                    {heatmapDays.map((day, idx) => (
                                        <div 
                                            key={idx}
                                            title={`${day.date}: ${day.count} submissions`}
                                            className={`h-4 w-4 rounded-sm cursor-help transition-all hover:ring-2 hover:ring-slate-400 ${getHeatmapColor(day.count)}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            {/* THE NEW AUTO-SYNC HEADER */}
                            <div className="p-6 border-b border-slate-100 bg-blue-50/30 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-blue-600" /> Pending Assignments
                                    <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2.5 rounded-full text-xs font-bold">
                                        {pendingAssignments.length} Due
                                    </span>
                                </h2>
                                <button 
                                    onClick={handleAutoSync}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <RefreshCw className="h-4 w-4 text-blue-600" />}
                                    Auto-Sync LeetCode
                                </button>
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {pendingAssignments.map((item, idx) => (
                                    <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.className}</span>
                                            <h3 className="text-lg font-bold text-slate-900 mt-1">{item.assignment.titleSlug}</h3>
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <Clock className="h-3.5 w-3.5" /> Due: {formatLeetcodeDate(item.assignment.endTimestamp)}
                                            </p>
                                        </div>
                                        <a 
                                            href={item.assignment.questionLink} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Solve on LeetCode <LinkIcon className="h-3.5 w-3.5" />
                                        </a>
                                    </div>
                                ))}

                                {pendingAssignments.length === 0 && (
                                    <div className="p-12 text-center text-slate-500">
                                        <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
                                        <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
                                        <p>You have no pending assignments right now.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="space-y-8">
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" /> Recent Submissions
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-100 overflow-y-auto">
                                {dashboardData?.recentSubmissions?.map((sub, idx) => (
                                    <a 
                                        key={idx} 
                                        href={sub.questionLink}
                                        target="_blank" rel="noreferrer"
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="font-medium text-slate-700 truncate max-w-45">{sub.title}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">
                                            {formatLeetcodeDate(sub.timestamp)}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Medal className="h-5 w-5 text-yellow-500" /> Earned Badges
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {dashboardData?.badges?.slice(0, 6).map((badge, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center group">
                                        <div className="relative h-14 w-14 transition-transform group-hover:scale-110">
                                            <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt={badge.title} className="object-contain" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}