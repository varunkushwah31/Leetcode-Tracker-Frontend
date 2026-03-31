import { useEffect, useState } from 'react';
import { 
    Target, BookOpen, LogOut, Code2, AlertCircle, 
    Medal, Clock, CheckCircle2, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { StudentService } from '../services/endpoints';
import type { StudentSummaryDTO } from '../types';

// Properly handles LeetCode's Unix timestamps (which are in seconds, not milliseconds)
const formatLeetcodeDate = (timestamp: number | string | any): string => {
    if (!timestamp) return 'Unknown Date';
    
    // If Spring Boot sends it as a flat number (seconds)
    if (typeof timestamp === 'number') {
        // Multiply by 1000 to convert seconds to milliseconds for JS Dates
        return new Date(timestamp * 1000).toLocaleDateString();
    }
    
    // Fallback for strings
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    
    return 'Invalid Date';
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [dashboardData, setDashboardData] = useState<StudentSummaryDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await StudentService.getDashboard();
                setDashboardData(response.data);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.data?.message) {
                    setError(err.response.data.message);
                } else {
                    setError('Failed to load dashboard data.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

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

    // Safely extract stats, prioritizing the arrays
    const totalSolved = dashboardData?.problemStats?.find(s => s.difficulty === 'All')?.count 
                        || dashboardData?.totalSolved || 0;
    
    const rating = Math.round(dashboardData?.currentContestRating || dashboardData?.contestRating || 0);
    
    const easyStats = dashboardData?.problemStats?.find(s => s.difficulty === 'Easy');
    const medStats = dashboardData?.problemStats?.find(s => s.difficulty === 'Medium');
    const hardStats = dashboardData?.problemStats?.find(s => s.difficulty === 'Hard');

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Top Navigation Bar */}
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

                {/* Main Dashboard Layout */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    
                    {/* LEFT COLUMN: Profile & Core Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Profile Header */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{dashboardData?.name}</h1>
                                    <a 
                                        href={`https://leetcode.com/${dashboardData?.leetcodeUsername}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="mt-1 flex items-center text-blue-600 hover:underline"
                                    >
                                        @{dashboardData?.leetcodeUsername}
                                    </a>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-500">Global Rank</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {dashboardData?.rank ? `#${parseInt(dashboardData.rank).toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">Total Solved</p>
                                <p className="mt-2 text-4xl font-bold text-slate-900">{totalSolved}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">Contest Rating</p>
                                <p className="mt-2 text-4xl font-bold text-slate-900">{rating}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">Classrooms</p>
                                <p className="mt-2 text-4xl font-bold text-slate-900">
                                    {dashboardData?.classrooms?.length || 0}
                                </p>
                            </div>
                        </div>

                        {/* Problem Difficulty Breakdown */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Target className="h-5 w-5 text-blue-600" /> Solved Breakdown
                            </h2>
                            <div className="space-y-4">
                                {/* Easy */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-green-600">Easy</span>
                                        <span className="text-slate-600 font-medium">{easyStats?.count || 0} <span className="text-slate-400 font-normal">/ Beats {easyStats?.beatsPercentage || 0}%</span></span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(((easyStats?.count || 0) / Math.max(totalSolved, 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                {/* Medium */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-yellow-500">Medium</span>
                                        <span className="text-slate-600 font-medium">{medStats?.count || 0} <span className="text-slate-400 font-normal">/ Beats {medStats?.beatsPercentage || 0}%</span></span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${Math.min(((medStats?.count || 0) / Math.max(totalSolved, 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                                {/* Hard */}
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-red-500">Hard</span>
                                        <span className="text-slate-600 font-medium">{hardStats?.count || 0} <span className="text-slate-400 font-normal">/ Beats {hardStats?.beatsPercentage || 0}%</span></span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(((hardStats?.count || 0) / Math.max(totalSolved, 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Submissions */}
                        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" /> Recent Submissions
                                </h2>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {dashboardData?.recentSubmissions?.map((sub, idx) => (
                                    <a 
                                        key={idx} 
                                        href={sub.questionLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="font-medium text-slate-700">{sub.title}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">
                                            {formatLeetcodeDate(sub.timestamp)}
                                        </span>
                                    </a>
                                ))}
                                {(!dashboardData?.recentSubmissions || dashboardData.recentSubmissions.length === 0) && (
                                    <div className="p-6 text-center text-slate-500">No recent submissions found.</div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Badges & Contests */}
                    <div className="space-y-8">
                        
                        {/* Badges Section */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Medal className="h-5 w-5 text-yellow-500" /> Earned Badges
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {dashboardData?.badges?.map((badge, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center group">
                                        <div className="relative h-16 w-16 transition-transform group-hover:scale-110">
                                            <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt={badge.title} className="object-contain" />
                                        </div>
                                        <span className="mt-2 text-xs font-medium text-slate-600 line-clamp-2 leading-tight">
                                            {badge.title}
                                        </span>
                                    </div>
                                ))}
                                {(!dashboardData?.badges || dashboardData.badges.length === 0) && (
                                    <div className="col-span-3 text-center text-sm text-slate-500 py-4">
                                        No badges earned yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Contests */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" /> Recent Contests
                            </h2>
                            <div className="space-y-4">
                                {dashboardData?.contestHistory?.slice(0, 5).map((contest, idx) => (
                                    <div key={idx} className="border-l-2 border-blue-500 pl-4 py-1">
                                        <p className="font-semibold text-slate-800 text-sm">{contest.title}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                            <span>Rank: {contest.ranking.toLocaleString()}</span>
                                            <span>Solved: {contest.problemsSolved}/{contest.totalProblems}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!dashboardData?.contestHistory || dashboardData.contestHistory.length === 0) && (
                                    <div className="text-center text-sm text-slate-500 py-2">
                                        No contest history available.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Classrooms Section (Full Width Bottom) */}
                <div className="mt-8">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-600" /> My Classrooms
                    </h2>
                    {dashboardData?.classrooms && dashboardData.classrooms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {dashboardData.classrooms.map((classroom) => (
                                <div key={classroom.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="text-xl font-bold text-slate-900">{classroom.className}</h3>
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="text-sm font-medium text-slate-600">
                                            {classroom.assignments?.length || 0} Pending
                                        </span>
                                        <button className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                                            View Assignments &rarr;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
                            <h3 className="mt-4 text-lg font-bold text-slate-900">No Classrooms Yet</h3>
                            <p className="mt-2 text-slate-500">You haven't been enrolled in any classrooms by a mentor.</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}