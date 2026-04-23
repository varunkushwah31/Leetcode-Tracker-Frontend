import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Activity, Target, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import type { ClassroomAnalyticsDTO } from '@/types';

export function ClassroomAnalytics({ data }: { data: ClassroomAnalyticsDTO | null }) {
    if (!data || data.totalStudents === 0) {
        return (
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#09090B]/50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Not enough data to generate analytics.</p>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">Add students to see class performance insights.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Users className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Class Engagement</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{Math.round(data.classEngagementScore)}%</h3>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{data.activeStudentsThisWeek} active this week</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><Target className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Avg. Problems Solved</p>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{data.averageTotalSolved}</h3>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Per student</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Critical Weakness</p>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate max-w-37.5">
                                {data.criticalWeaknesses?.[0]?.tagName || 'None'}
                            </h3>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Requires attention</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Difficulty Breakdown */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="text-lg text-zinc-900 dark:text-white">Class Average by Difficulty</CardTitle>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400">Average problems solved per student</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-bold text-zinc-700 dark:text-zinc-300">Easy</span><span className="font-bold text-emerald-500">{data.averageEasy}</span></div>
                            <Progress value={(data.averageEasy / Math.max(data.averageTotalSolved, 1)) * 100} className="h-2.5 bg-emerald-100 dark:bg-emerald-950 [&>div]:bg-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-bold text-zinc-700 dark:text-zinc-300">Medium</span><span className="font-bold text-amber-500">{data.averageMedium}</span></div>
                            <Progress value={(data.averageMedium / Math.max(data.averageTotalSolved, 1)) * 100} className="h-2.5 bg-amber-100 dark:bg-amber-950 [&>div]:bg-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-bold text-zinc-700 dark:text-zinc-300">Hard</span><span className="font-bold text-rose-500">{data.averageHard}</span></div>
                            <Progress value={(data.averageHard / Math.max(data.averageTotalSolved, 1)) * 100} className="h-2.5 bg-rose-100 dark:bg-rose-950 [&>div]:bg-rose-500" />
                        </div>
                    </CardContent>
                </Card>

                {/* Topic Analysis */}
                <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-zinc-900 dark:text-white"><TrendingUp className="w-5 h-5 text-indigo-500" /> Topic Proficiency</CardTitle>
                        <CardDescription className="text-zinc-500 dark:text-zinc-400">Aggregated across entire classroom</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Top Strengths</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.topStrengths?.map((skill, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{skill.tagName}</span>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded">{skill.problemsSolved}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />

                            <div>
                                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3">Needs Attention</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.criticalWeaknesses?.map((skill, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{skill.tagName}</span>
                                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 px-1.5 py-0.5 rounded">{skill.problemsSolved}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 italic">These are topics the class has encountered but solved the least.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}