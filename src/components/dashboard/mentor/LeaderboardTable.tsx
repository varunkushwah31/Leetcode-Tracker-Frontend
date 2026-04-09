import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Flame, Download } from 'lucide-react';
import type { StudentSummaryDTO } from '../../../types';

interface LeaderboardTableProps {
    students: StudentSummaryDTO[];
    sortBy: string;
    onSortChange: (value: string) => void;
    onExportCSV: () => void;
    onStudentClick: (username: string) => void;
}

export function LeaderboardTable({ students, sortBy, onSortChange, onExportCSV, onStudentClick }: LeaderboardTableProps) {    return (
        <Card className="mb-6 shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Student Leaderboard</CardTitle>
                        <CardDescription>Track and compare student progress</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={onExportCSV} className="text-slate-600 bg-white hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 font-medium">Sort by:</span>
                            <Select value={sortBy} onValueChange={onSortChange}>
                                <SelectTrigger className="w-48 bg-white"><SelectValue /></SelectTrigger>
                                <SelectContent>
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
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-6 text-sm font-semibold text-slate-500 uppercase">Rank</th>
                                <th className="text-left py-3 px-6 text-sm font-semibold text-slate-500 uppercase">Student</th>
                                <th className="text-center py-3 px-6 text-sm font-semibold text-slate-500 uppercase">Streak</th>
                                <th className="text-center py-3 px-6 text-sm font-semibold text-slate-500 uppercase">Total Solved</th>
                                <th className="text-center py-3 px-6 text-sm font-semibold text-slate-500 uppercase">Rating</th>
                                <th className="text-right py-3 px-6 text-sm font-semibold text-slate-500 uppercase">Assignments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students?.map((student, index) => (
                                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => onStudentClick(student.leetcodeUsername)}>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">{index + 1}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-slate-200">
                                                <AvatarImage src={student.avatarUrl} />
                                                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">{student.name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-slate-900">{student.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">@{student.leetcodeUsername}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Flame className={`w-4 h-4 ${(student.consistencyStreak ?? 0) > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
                                            <span className={`font-bold ${(student.consistencyStreak ?? 0) > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{student.consistencyStreak || 0}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center"><span className="font-bold text-slate-800">{student.totalSolved || 0}</span></td>
                                    <td className="py-4 px-6 text-center"><span className="font-bold text-slate-800">{Math.round(student.currentContestRating || 0).toLocaleString()}</span></td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{student.completedAssignments || 0} Done</Badge>
                                            {(student.pendingAssignments ?? 0) > 0 && (
                                                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">{student.pendingAssignments} Pending</Badge>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!students || students.length === 0) && (
                                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No students in this classroom yet. Click "Add Student" to get started.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}