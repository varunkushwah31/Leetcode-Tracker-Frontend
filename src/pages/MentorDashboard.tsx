import React, { useEffect, useState } from 'react';
import { 
    Users, BookOpen, Plus, Search, LogOut, Code2, 
    AlertCircle, Trophy, X
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MentorService, ClassroomService } from '../services/endpoints';
import type { ClassroomDashboardDTO, StudentSummaryDTO } from '../types';

export default function MentorDashboard() {
    const { user, logout } = useAuth();
    
    // Core Data State
    const [classrooms, setClassrooms] = useState<ClassroomDashboardDTO[]>([]);
    const [selectedClass, setSelectedClass] = useState<ClassroomDashboardDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // UI Action State
    const [sortBy, setSortBy] = useState<'consistency' | 'rating' | 'solved' | 'pending' | 'completed' | 'name'>('solved');
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showAddAssignment, setShowAddAssignment] = useState(false);
    const [showCreateClass, setShowCreateClass] = useState(false);

    // Form State
    const [newStudentUsername, setNewStudentUsername] = useState('');
    const [assignmentSlug, setAssignmentSlug] = useState('');
    const [assignmentDays, setAssignmentDays] = useState('7');
    const [newClassName, setNewClassName] = useState('');

    const fetchDashboardData = async () => {
        if (!user?.id) return; // Note: Ensure your AuthContext saves the user.id!
        setIsLoading(true);
        try {
            // 1. Get the Mentor Profile to find their classroom IDs
            const profileRes = await MentorService.getProfile(user.id);
            const classroomIds = profileRes.data.classroomIds || [];

            // 2. Fetch the Dashboard DTO for EVERY classroom they own
            const dashboardPromises = classroomIds.map((id: string) => 
                ClassroomService.getDashboard(id, sortBy)
            );
            
            const dashboardResponses = await Promise.all(dashboardPromises);
            const fetchedClassrooms = dashboardResponses.map(res => res.data);
            
            setClassrooms(fetchedClassrooms);
            
            // 3. Maintain the selected class, or pick the first one
            if (selectedClass) {
                const updated = fetchedClassrooms.find(c => c.classroomId === selectedClass.classroomId);
                setSelectedClass(updated || fetchedClassrooms[0] || null);
            } else if (fetchedClassrooms.length > 0) {
                setSelectedClass(fetchedClassrooms[0]);
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
            setError('Failed to load mentor dashboard.');
        } finally {
            setIsLoading(false);
        }
    };

    // Refetch data when component mounts OR when the sort option changes
    useEffect(() => {
        fetchDashboardData();
    }, [sortBy, user?.id]);

    // --- Actions ---

    const handleCreateClassroom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.id) return;
        try {
            await ClassroomService.createClassroom(user.id, newClassName);
            setNewClassName('');
            setShowCreateClass(false);
            fetchDashboardData();
        } catch (err) {
            alert(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to create classroom');
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;
        try {
            await ClassroomService.addStudent(selectedClass.classroomId, newStudentUsername);
            setNewStudentUsername('');
            setShowAddStudent(false);
            fetchDashboardData();
        } catch (err) {
            alert(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to add student');
        }
    };

    const handleAssignQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;

        const startTimestamp = Math.floor(Date.now() / 1000);
        const endTimestamp = startTimestamp + (parseInt(assignmentDays) * 86400);
        
        try {
            await ClassroomService.assignQuestion(selectedClass.classroomId, assignmentSlug, startTimestamp, endTimestamp);
            setAssignmentSlug('');
            setShowAddAssignment(false);
            alert("Question Assigned Successfully!");
        } catch (err) {
            alert(axios.isAxiosError(err) ? err.response?.data?.message : 'Failed to assign question');
        }
    };

    if (isLoading && classrooms.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            
            {/* Navbar */}
            <nav className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-10">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Code2 className="h-8 w-8 text-blue-600" />
                        <span className="text-xl font-bold text-slate-900">LeetTracker <span className="text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded-md ml-2">Mentor</span></span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <span className="text-sm font-medium text-slate-600">Hello, {user?.name}</span>
                        <button onClick={logout} className="flex items-center space-x-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-600">
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-1 mx-auto w-full max-w-7xl flex overflow-hidden pt-8 px-6 gap-8 pb-12">
                
                {/* LEFT SIDEBAR: Classrooms List */}
                <div className="w-80 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600" /> My Classes
                        </h2>
                        <button onClick={() => setShowCreateClass(true)} className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 shadow-sm text-slate-600" title="Create New Class">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {classrooms.map(cls => (
                            <button
                                key={cls.classroomId}
                                onClick={() => setSelectedClass(cls)}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    selectedClass?.classroomId === cls.classroomId 
                                    ? 'bg-blue-600 border-blue-600 shadow-md ring-4 ring-blue-100' 
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                                <h3 className={`font-bold ${selectedClass?.classroomId === cls.classroomId ? 'text-white' : 'text-slate-900'}`}>
                                    {cls.className}
                                </h3>
                                <p className={`text-sm mt-1 flex items-center gap-1 ${selectedClass?.classroomId === cls.classroomId ? 'text-blue-100' : 'text-slate-500'}`}>
                                    <Users className="h-4 w-4" /> {cls.students?.length || 0} Students
                                </p>
                            </button>
                        ))}
                        {classrooms.length === 0 && (
                            <div className="text-center p-6 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                                You don't manage any classes yet. Click the + icon to create one.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN: Classroom Details */}
                <div className="flex-1 flex flex-col min-w-0">
                    {error && (
                        <div className="mb-6 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                            <AlertCircle className="h-5 w-5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {selectedClass ? (
                        <div className="space-y-6">
                            
                            {/* Class Header & Quick Actions */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">{selectedClass.className}</h1>
                                    <p className="text-slate-500 mt-1 flex items-center gap-4">
                                        <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {selectedClass.students?.length || 0} Enrolled</span>
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowAddStudent(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                                    >
                                        <Plus className="h-4 w-4" /> Add Student
                                    </button>
                                    <button 
                                        onClick={() => setShowAddAssignment(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-sm"
                                    >
                                        <Code2 className="h-4 w-4" /> Assign Question
                                    </button>
                                </div>
                            </div>

                            {/* Filters & Leaderboard */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-yellow-500" /> Class Leaderboard
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                            <Search className="h-4 w-4"/> Sort by:
                                        </span>
                                        {/* Triggering Server-Side Sorting on change! */}
                                        <select 
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as 'consistency' | 'rating' | 'solved' | 'pending' | 'completed' | 'name')}
                                            className="bg-white border border-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 font-medium"
                                        >
                                            <option value="solved">Total Solved</option>
                                            <option value="consistency">Daily Streak</option>
                                            <option value="pending">Most Pending</option>
                                            <option value="completed">Most Completed</option>
                                            <option value="rating">Contest Rating</option>
                                            <option value="name">Alphabetical (A-Z)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-slate-600">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4">Student</th>
                                                <th className="px-6 py-4 text-center">Streak</th>
                                                <th className="px-6 py-4 text-center">Total Solved</th>
                                                <th className="px-6 py-4 text-center">Rating</th>
                                                <th className="px-6 py-4 text-right">Assignments</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedClass.students?.map((student: StudentSummaryDTO, index: number) => (
                                                <tr key={student.id || index} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">{student.name}</div>
                                                            <div className="text-xs text-slate-500 font-normal">@{student.leetcodeUsername}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-semibold text-orange-500">
                                                        {(student.consistencyStreak ?? 0) > 0 ? `🔥 ${student.consistencyStreak}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-semibold text-slate-800">
                                                        {student.totalSolved || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-semibold text-slate-800">
                                                        {Math.round(student.currentContestRating || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {student.completedAssignments || 0} Done
                                                            </span>
                                                            {(student.pendingAssignments ?? 0) > 0 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    {student.pendingAssignments} Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!selectedClass.students || selectedClass.students.length === 0) && (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                        No students in this classroom yet. Click "Add Student" to start.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500">
                            <BookOpen className="h-16 w-16 mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-900">No Classroom Selected</h3>
                            <p className="mt-2">Select a classroom from the left sidebar to view students and assignments.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODALS --- */}

            {/* Create Class Modal */}
            {showCreateClass && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Create New Class</h3>
                            <button onClick={() => setShowCreateClass(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
                        </div>
                        <form onSubmit={handleCreateClassroom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Classroom Name</label>
                                <input 
                                    type="text" required value={newClassName} onChange={e => setNewClassName(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="e.g. Data Structures 101"
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-500">
                                Create Classroom
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Student Modal */}
            {showAddStudent && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Add Student</h3>
                            <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
                        </div>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Student's LeetCode Username</label>
                                <input 
                                    type="text" required value={newStudentUsername} onChange={e => setNewStudentUsername(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="johndoe_lc"
                                />
                                <p className="text-xs text-slate-500 mt-2">The student must have already registered an account on this platform.</p>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-500">
                                Add to Classroom
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Question Modal */}
            {showAddAssignment && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Assign LeetCode Question</h3>
                            <button onClick={() => setShowAddAssignment(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
                        </div>
                        <form onSubmit={handleAssignQuestion} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Question Title Slug</label>
                                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                                    <span className="bg-slate-50 text-slate-500 px-3 py-2.5 text-sm border-r border-slate-300">leetcode.com/problems/</span>
                                    <input 
                                        type="text" required value={assignmentSlug} onChange={e => setAssignmentSlug(e.target.value)}
                                        className="w-full p-2.5 outline-none text-sm"
                                        placeholder="two-sum"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
                                <select 
                                    value={assignmentDays} onChange={e => setAssignmentDays(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="1">1 Day</option>
                                    <option value="3">3 Days</option>
                                    <option value="7">1 Week</option>
                                    <option value="14">2 Weeks</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-500 mt-2">
                                Dispatch to {selectedClass?.students?.length || 0} Students
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}