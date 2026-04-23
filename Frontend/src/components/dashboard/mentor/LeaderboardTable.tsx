import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Flame, Download, Search } from 'lucide-react';
import type { StudentSummaryDTO } from '@/types';
import { useState } from 'react';

interface LeaderboardTableProps {
    students: StudentSummaryDTO[];
    sortBy: string;
    onSortChange: (value: string) => void;
    onExportCSV: () => void;
    onStudentClick: (username: string) => void;
}

export function LeaderboardTable({ students, sortBy, onSortChange, onExportCSV, onStudentClick }: LeaderboardTableProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStudents = students?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.leetcodeUsername.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Card className="mb-6 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader className="bg-zinc-50/50 dark:bg-[#09090B]/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl text-zinc-900 dark:text-white">Student Leaderboard</CardTitle>
                        <CardDescription className="dark:text-zinc-400">Track and compare student progress</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-white w-full sm:w-60 transition-colors"
                            />
                        </div>
                        <Button variant="outline" onClick={onExportCSV} className="text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                            <Download className="w-4 h-4 mr-2 text-zinc-400" /> Export CSV
                        </Button>
                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={onSortChange}>
                                <SelectTrigger className="w-40 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    <SelectItem value="solved">Total Solved</SelectItem>
                                    <SelectItem value="consistency">Daily Streak</SelectItem>
                                    <SelectItem value="pending">Most Pending</SelectItem>
                                    <SelectItem value="rating">Contest Rating</SelectItem>
                                    <SelectItem value="name">Alphabetical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50/80 dark:bg-zinc-900/30">
                        <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rank</th>
                            <th className="text-left py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Student</th>
                            <th className="text-center py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Streak</th>
                            <th className="text-center py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Solved</th>
                            <th className="text-center py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Rating</th>
                            <th className="text-right py-3 px-6 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Assignments</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                        {filteredStudents?.map((student, index) => (
                            <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group" onClick={() => onStudentClick(student.leetcodeUsername)}>
                                <td className="py-4 px-6">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm mx-auto
                                            ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border dark:border-amber-500/20' :
                                        index === 1 ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-300 border dark:border-zinc-500/20' :
                                            index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400 border dark:border-orange-500/20' :
                                                'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 border border-transparent dark:border-zinc-700/50'}`}>
                                        {index + 1}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700">
                                            <AvatarImage src={student.avatarUrl} />
                                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">{student.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{student.name}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">@{student.leetcodeUsername}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Flame className={`w-4 h-4 ${(student.consistencyStreak ?? 0) > 0 ? 'text-amber-500' : 'text-zinc-300 dark:text-zinc-700'}`} />
                                        <span className={`font-bold ${(student.consistencyStreak ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400 dark:text-zinc-600'}`}>{student.consistencyStreak || 0}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center"><span className="font-bold text-zinc-900 dark:text-zinc-200 text-base">{student.totalSolved || 0}</span></td>
                                <td className="py-4 px-6 text-center"><span className="font-bold text-zinc-700 dark:text-zinc-300">{Math.round(student.currentContestRating || 0).toLocaleString()}</span></td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 px-2 py-0.5 text-[10px] uppercase">{student.completedAssignments || 0} Done</Badge>
                                        {(student.pendingAssignments ?? 0) > 0 && (
                                            <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20 px-2 py-0.5 text-[10px] uppercase">{student.pendingAssignments} Pending</Badge>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!filteredStudents || filteredStudents.length === 0) && (
                            <tr><td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400">No students found matching your criteria.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}