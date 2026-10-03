import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { FlameIcon, DownloadSimpleIcon as Download, MagnifyingGlassIcon as Search, BellIcon, SpinnerIcon as Loader2, TableIcon as Table } from '@phosphor-icons/react';
import type { StudentSummaryDTO } from '@/types';
import { ClassroomService, StudentService } from '@/services/endpoints';
import { useState } from 'react';

interface LeaderboardTableProps {
    students: StudentSummaryDTO[];
    sortBy: string;
    onSortChange: (value: string) => void;
    onExportCSV: () => void;
    onStudentClick: (username: string) => void;
    classroomId?: string;
}

function getRankBadgeClass(index: number): string {
    if (index === 0) {
        return 'bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#b4afff] border border-[#5b4fff]/30';
    }
    if (index === 1) {
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700';
    }
    if (index === 2) {
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
    }
    return 'bg-zinc-100 dark:bg-[#222] text-zinc-500 dark:text-zinc-500 border border-transparent';
}

function getNudgeButtonLabel(isCurrentlyNudging: boolean, isNudged: boolean): string {
    if (isCurrentlyNudging) {
        return '...';
    }
    if (isNudged) {
        return 'Nudged';
    }
    return 'Nudge';
}

export function LeaderboardTable({ students, sortBy, onSortChange, onExportCSV, onStudentClick, classroomId }: Readonly<LeaderboardTableProps>) {
    const [searchQuery, setSearchQuery] = useState("");
    const [nudgingStudentId, setNudgingStudentId] = useState<string | null>(null);
    const [nudgedStudents, setNudgedStudents] = useState<Record<string, boolean>>({});
    const [isExportingMatrix, setIsExportingMatrix] = useState(false);
    const [exportingReportStudent, setExportingReportStudent] = useState<string | null>(null);

    const handleExportAssignmentMatrix = async () => {
        if (!classroomId) return;
        setIsExportingMatrix(true);
        try {
            const response = await ClassroomService.exportAssignmentMatrix(classroomId);
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `assignments_matrix_${classroomId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error('Failed to export assignment matrix:', err);
        } finally {
            setIsExportingMatrix(false);
        }
    };

    const handleExportStudentReport = async (e: React.MouseEvent, username: string) => {
        e.stopPropagation();
        if (!username) return;
        setExportingReportStudent(username);
        try {
            const response = await StudentService.exportStudentReport(username);
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${username}_Performance_Report.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error('Failed to export student report:', err);
        } finally {
            setExportingReportStudent(null);
        }
    };

    const handleNudge = async (e: React.MouseEvent, studentId: string) => {
        e.stopPropagation();
        if (!classroomId || nudgingStudentId || nudgedStudents[studentId]) return;
        setNudgingStudentId(studentId);
        try {
            await ClassroomService.nudgeStudent(classroomId, studentId, 'Pending Assignment');
            setNudgedStudents(prev => ({ ...prev, [studentId]: true }));
        } catch {
            // failed gracefully
        } finally {
            setNudgingStudentId(null);
        }
    };

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.leetcodeUsername && s.leetcodeUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.codeforcesHandle && s.codeforcesHandle.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Card className="mb-6 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800/60 bg-white dark:bg-[#111111]/85 backdrop-blur-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-transparent border-b border-zinc-200/80 dark:border-zinc-800/60 pb-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight">Student Leaderboard</CardTitle>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Track and compare student progress</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-zinc-100 dark:bg-[#222] border border-zinc-200 dark:border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#5b4fff] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 w-full sm:w-64 transition-all"
                            />
                        </div>
                        <Button variant="outline" onClick={onExportCSV} className="text-zinc-700 dark:text-white bg-white dark:bg-transparent border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-10 px-3.5 transition-colors cursor-pointer text-xs font-semibold">
                            <Download className="w-4 h-4 mr-1.5 text-zinc-500 dark:text-zinc-400" /> Export Leaderboard
                        </Button>
                        {classroomId && (
                            <Button
                                variant="outline"
                                onClick={handleExportAssignmentMatrix}
                                disabled={isExportingMatrix}
                                className="text-zinc-700 dark:text-white bg-white dark:bg-transparent border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-10 px-3.5 transition-colors cursor-pointer text-xs font-semibold"
                            >
                                {isExportingMatrix ? (
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-[#5b4fff]" />
                                ) : (
                                    <Table className="w-4 h-4 mr-1.5 text-[#5b4fff] dark:text-[#968fff]" />
                                )}
                                Export Matrix
                            </Button>
                        )}
                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={onSortChange}>
                                <SelectTrigger className="w-44 bg-zinc-100 dark:bg-[#222] border border-zinc-200 dark:border-transparent text-zinc-900 dark:text-white h-10 rounded-xl focus:ring-1 focus:ring-[#5b4fff]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1a1b2e] border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl shadow-xl">
                                    <SelectItem value="solved" className="focus:bg-[#5b4fff]/10 dark:focus:bg-[#5b4fff]/20 focus:text-zinc-900 dark:focus:text-white">Total Solved</SelectItem>
                                    <SelectItem value="consistency" className="focus:bg-[#5b4fff]/10 dark:focus:bg-[#5b4fff]/20 focus:text-zinc-900 dark:focus:text-white">Daily Streak</SelectItem>
                                    <SelectItem value="pending" className="focus:bg-[#5b4fff]/10 dark:focus:bg-[#5b4fff]/20 focus:text-zinc-900 dark:focus:text-white">Most Pending</SelectItem>
                                    <SelectItem value="rating" className="focus:bg-[#5b4fff]/10 dark:focus:bg-[#5b4fff]/20 focus:text-zinc-900 dark:focus:text-white">Contest Rating</SelectItem>
                                    <SelectItem value="name" className="focus:bg-[#5b4fff]/10 dark:focus:bg-[#5b4fff]/20 focus:text-zinc-900 dark:focus:text-white">Alphabetical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50/80 dark:bg-[#1a1b2e]/50 border-b border-zinc-200/80 dark:border-zinc-800/60">
                        <tr>
                            <th className="text-left py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                            <th className="text-left py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Student</th>
                            <th className="text-center py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Streak</th>
                            <th className="text-center py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Solved</th>
                            <th className="text-center py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rating</th>
                            <th className="text-right py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assignments</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60">
                        {filteredStudents?.map((student, index) => (
                            <tr key={student.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group" onClick={() => onStudentClick(student.leetcodeUsername || student.codeforcesHandle || student.id || '')}>
                                <td className="py-4 px-6">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm mx-auto ${getRankBadgeClass(index)}`}>
                                        {index + 1}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3.5">
                                        <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-800">
                                            <AvatarImage src={student.avatarUrl} />
                                            <AvatarFallback className="bg-zinc-100 dark:bg-[#1a1b2e] text-[#5b4fff] dark:text-[#968fff] font-bold">{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-zinc-900 dark:text-white group-hover:text-[#5b4fff] dark:group-hover:text-[#b4afff] transition-colors">{student.name}</p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {student.leetcodeUsername && (
                                                    <span className="text-xs text-zinc-500 font-medium tracking-wide">@{student.leetcodeUsername}</span>
                                                )}
                                                {student.codeforcesHandle && (
                                                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-500/20">
                                                        CF: @{student.codeforcesHandle}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <FlameIcon className={`w-4 h-4 ${(student.consistencyStreak ?? 0) > 0 ? 'text-amber-500 animate-flame' : 'text-zinc-300 dark:text-zinc-700'}`} />
                                        <span className={`font-bold ${(student.consistencyStreak ?? 0) > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-600'}`}>{student.consistencyStreak || 0}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-base">{student.totalSolved || 0}</span>
                                    {Boolean(student.codeforcesSolvedCount && student.codeforcesSolvedCount > 0) && (
                                        <div className="text-[10px] text-zinc-500 font-medium">
                                            LC: {student.leetcodeSolvedCount ?? ((student.totalSolved || 0) - (student.codeforcesSolvedCount || 0))} • CF: {student.codeforcesSolvedCount}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <span className="font-bold text-zinc-600 dark:text-zinc-400">{Math.round(student.currentContestRating || 0).toLocaleString()}</span>
                                    {student.codeforcesRating !== undefined && student.codeforcesRating > 0 && (
                                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                            CF: {student.codeforcesRating}
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">{student.completedAssignments || 0} Done</Badge>
                                            {Boolean(student.pendingAssignments && student.pendingAssignments > 0) && (
                                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">{student.pendingAssignments} Pending</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={(e) => handleExportStudentReport(e, student.leetcodeUsername || student.codeforcesHandle || student.id || '')}
                                                disabled={exportingReportStudent === (student.leetcodeUsername || student.codeforcesHandle || student.id)}
                                                title="Download student performance report (CSV)"
                                                className="group/report inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800/80 transition-all cursor-pointer"
                                            >
                                                {exportingReportStudent === (student.leetcodeUsername || student.codeforcesHandle || student.id) ? (
                                                    <Loader2 className="w-2.5 h-2.5 animate-spin text-[#5b4fff]" />
                                                ) : (
                                                    <Download className="w-2.5 h-2.5 text-zinc-500 group-hover/report:text-[#5b4fff]" />
                                                )}
                                                <span>Report CSV</span>
                                            </button>
                                            {(student.pendingAssignments ?? 0) > 0 && classroomId && student.id && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleNudge(e, student.id!)}
                                                    disabled={nudgingStudentId === student.id || Boolean(nudgedStudents[student.id])}
                                                    title="Send reminder email to student"
                                                    className={`group/nudge inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                                                        nudgedStudents[student.id]
                                                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 cursor-default'
                                                            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 cursor-pointer'
                                                    }`}
                                                >
                                                    <BellIcon className="w-2.5 h-2.5 group-hover/nudge:animate-bell-ring" />
                                                    {getNudgeButtonLabel(nudgingStudentId === student.id, Boolean(nudgedStudents[student.id]))}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!filteredStudents || filteredStudents.length === 0) && (
                            <tr><td colSpan={6} className="py-16 text-center text-zinc-500 text-[15px]">No students found matching your criteria.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}