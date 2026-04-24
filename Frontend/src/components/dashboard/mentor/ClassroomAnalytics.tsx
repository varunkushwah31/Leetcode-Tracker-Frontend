import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Activity, Target, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import type { ClassroomAnalyticsDTO } from '@/types';

export function ClassroomAnalytics({ data }: { data: ClassroomAnalyticsDTO | null }) {
    if (!data || data.totalStudents === 0) {
        return (
            <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-zinc-800/60 bg-[#111111]/85 backdrop-blur-2xl rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-[#1a1b2e] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                        <Activity className="w-8 h-8 text-[#968fff]" />
                    </div>
                    <p className="text-white text-lg font-bold tracking-tight mb-2">No data available to generate analytics.</p>
                    <p className="text-zinc-400 text-sm">Add students to view class performance insights.</p>
                </CardContent>
            </Card>
        );
    }

    const cardClasses = "border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-[#111111]/85 backdrop-blur-2xl rounded-2xl";

    return (
        <div className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={cardClasses}>
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl shadow-inner"><Users className="w-6 h-6" /></div>
                        <div>
                            <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Class Engagement</p>
                            <h3 className="text-3xl font-extrabold text-white tracking-tight">{Math.round(data.classEngagementScore)}%</h3>
                            <p className="text-xs text-zinc-400 mt-1 font-medium">{data.activeStudentsThisWeek} active this week</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cardClasses}>
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shadow-inner"><Target className="w-6 h-6" /></div>
                        <div>
                            <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Avg. Problems</p>
                            <h3 className="text-3xl font-extrabold text-white tracking-tight">{data.averageTotalSolved}</h3>
                            <p className="text-xs text-zinc-400 mt-1 font-medium">Per student</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cardClasses}>
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl shadow-inner"><AlertTriangle className="w-6 h-6" /></div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Critical Weakness</p>
                            <h3 className="text-xl font-extrabold text-white truncate w-full">
                                {data.criticalWeaknesses?.[0]?.tagName || 'None'}
                            </h3>
                            <p className="text-xs text-zinc-400 mt-1 font-medium">Requires attention</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Difficulty Breakdown */}
                <Card className={cardClasses}>
                    <CardHeader className="pb-4 border-b border-zinc-800/60">
                        <CardTitle className="text-lg font-bold text-white tracking-tight">Performance by Difficulty Level</CardTitle>
                        <CardDescription className="text-zinc-400">Average problems solved per student across all difficulty levels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-bold text-zinc-300">Easy</span><span className="font-bold text-emerald-400">{data.averageEasy}</span></div>
                            <Progress value={(data.averageEasy / Math.max(data.averageTotalSolved, 1)) * 100} className="h-2.5 bg-[#1a1b2e] border border-zinc-800/60 [&>div]:bg-emerald-500 shadow-inner" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-bold text-zinc-300">Medium</span><span className="font-bold text-amber-400">{data.averageMedium}</span></div>
                            <Progress value={(data.averageMedium / Math.max(data.averageTotalSolved, 1)) * 100} className="h-2.5 bg-[#1a1b2e] border border-zinc-800/60 [&>div]:bg-amber-500 shadow-inner" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="font-bold text-zinc-300">Hard</span><span className="font-bold text-rose-400">{data.averageHard}</span></div>
                            <Progress value={(data.averageHard / Math.max(data.averageTotalSolved, 1)) * 100} className="h-2.5 bg-[#1a1b2e] border border-zinc-800/60 [&>div]:bg-rose-500 shadow-inner" />
                        </div>
                    </CardContent>
                </Card>

                {/* Topic Analysis */}
                <Card className={cardClasses}>
                    <CardHeader className="pb-4 border-b border-zinc-800/60">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white tracking-tight"><TrendingUp className="w-5 h-5 text-[#5b4fff]" /> Topic Proficiency</CardTitle>
                        <CardDescription className="text-zinc-400">Aggregated across entire classroom</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Top Strengths</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.topStrengths?.map((skill, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 shadow-sm">
                                            <span className="text-[13px] font-medium text-emerald-100">{skill.tagName}</span>
                                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">{skill.problemsSolved}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px w-full bg-zinc-800/60" />

                            <div>
                                <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-3">Needs Attention</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.criticalWeaknesses?.map((skill, i) => (
                                        <div key={i} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 shadow-sm">
                                            <span className="text-[13px] font-medium text-rose-100">{skill.tagName}</span>
                                            <span className="text-[11px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded-md">{skill.problemsSolved}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-500 mt-4 italic font-medium">These are topics the class has encountered but solved the least.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}