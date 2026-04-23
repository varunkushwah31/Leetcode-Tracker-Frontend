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
        <Card className="mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-zinc-800/60 bg-[#111111]/85 backdrop-blur-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-transparent border-b border-zinc-800/60 pb-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-[22px] font-bold text-white tracking-tight">Student Leaderboard</CardTitle>
                        <CardDescription className="text-zinc-400 text-sm mt-1">Track and compare student progress</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#222] border-none rounded-xl py-2.5 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#5b4fff] text-white placeholder:text-zinc-600 w-full sm:w-64 transition-all"
                            />
                        </div>
                        <Button variant="outline" onClick={onExportCSV} className="text-white bg-transparent border-zinc-700 hover:bg-zinc-800 rounded-xl h-10 px-4 transition-colors">
                            <Download className="w-4 h-4 mr-2 text-zinc-400" /> Export CSV
                        </Button>
                        <div className="flex items-center gap-2">
                            <Select value={sortBy} onValueChange={onSortChange}>
                                <SelectTrigger className="w-44 bg-[#222] border-none text-white h-10 rounded-xl focus:ring-1 focus:ring-[#5b4fff]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1b2e] border-zinc-800 text-white rounded-xl shadow-xl">
                                    <SelectItem value="solved" className="focus:bg-[#5b4fff]/20 focus:text-white">Total Solved</SelectItem>
                                    <SelectItem value="consistency" className="focus:bg-[#5b4fff]/20 focus:text-white">Daily Streak</SelectItem>
                                    <SelectItem value="pending" className="focus:bg-[#5b4fff]/20 focus:text-white">Most Pending</SelectItem>
                                    <SelectItem value="rating" className="focus:bg-[#5b4fff]/20 focus:text-white">Contest Rating</SelectItem>
                                    <SelectItem value="name" className="focus:bg-[#5b4fff]/20 focus:text-white">Alphabetical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a1b2e]/50 border-b border-zinc-800/60">
                        <tr>
                            <th className="text-left py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rank</th>
                            <th className="text-left py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Student</th>
                            <th className="text-center py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Streak</th>
                            <th className="text-center py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Solved</th>
                            <th className="text-center py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Rating</th>
                            <th className="text-right py-4 px-6 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Assignments</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                        {filteredStudents?.map((student, index) => (
                            <tr key={student.id} className="hover:bg-zinc-900/50 transition-colors cursor-pointer group" onClick={() => onStudentClick(student.leetcodeUsername)}>
                                <td className="py-4 px-6">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm mx-auto
                                            ${index === 0 ? 'bg-[#5b4fff]/20 text-[#b4afff] border border-[#5b4fff]/30' :
                                        index === 1 ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' :
                                            index === 2 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                'bg-[#222] text-zinc-500 border border-transparent'}`}>
                                        {index + 1}
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3.5">
                                        <Avatar className="w-10 h-10 border border-zinc-800">
                                            <AvatarImage src={student.avatarUrl} />
                                            <AvatarFallback className="bg-[#1a1b2e] text-[#968fff] font-bold">{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-white group-hover:text-[#b4afff] transition-colors">{student.name}</p>
                                            <p className="text-xs text-zinc-500 font-medium tracking-wide">@{student.leetcodeUsername}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <Flame className={`w-4 h-4 ${(student.consistencyStreak ?? 0) > 0 ? 'text-amber-500' : 'text-zinc-700'}`} />
                                        <span className={`font-bold ${(student.consistencyStreak ?? 0) > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>{student.consistencyStreak || 0}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-center"><span className="font-bold text-zinc-200 text-base">{student.totalSolved || 0}</span></td>
                                <td className="py-4 px-6 text-center"><span className="font-bold text-zinc-400">{Math.round(student.currentContestRating || 0).toLocaleString()}</span></td>
                                <td className="py-4 px-6">
                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">{student.completedAssignments || 0} Done</Badge>
                                        {(student.pendingAssignments ?? 0) > 0 && (
                                            <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">{student.pendingAssignments} Pending</Badge>
                                        )}
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