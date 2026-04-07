import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { ScrollArea } from '../../ui/scroll-area';
import { Award, Clock, CheckCircle2 } from 'lucide-react';
import type { StudentExtendedDTO } from '../../../types';

export function StudentRightSidebar({ data, totalSolved }: { data: StudentExtendedDTO | null, totalSolved: number }) {
    const easyStats = data?.problemStats?.find(s => s.difficulty === 'Easy') || { count: 0, beatsPercentage: 0 };
    const medStats = data?.problemStats?.find(s => s.difficulty === 'Medium') || { count: 0, beatsPercentage: 0 };
    const hardStats = data?.problemStats?.find(s => s.difficulty === 'Hard') || { count: 0, beatsPercentage: 0 };

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    return (
        <div className="space-y-8">
            {/* Difficulty Breakdown */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader><CardTitle className="text-lg">Difficulty Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-700">Easy</span><span className="font-bold text-[#10b981]">{easyStats.count} <span className="text-slate-400 font-medium ml-1">({easyStats.beatsPercentage}% beats)</span></span></div>
                        <Progress value={(easyStats.count / totalSolved) * 100} className="h-2.5 bg-emerald-100 [&>div]:bg-[#10b981]" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-700">Medium</span><span className="font-bold text-[#f59e0b]">{medStats.count} <span className="text-slate-400 font-medium ml-1">({medStats.beatsPercentage}% beats)</span></span></div>
                        <Progress value={(medStats.count / totalSolved) * 100} className="h-2.5 bg-amber-100 [&>div]:bg-[#f59e0b]" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-700">Hard</span><span className="font-bold text-[#f43f5e]">{hardStats.count} <span className="text-slate-400 font-medium ml-1">({hardStats.beatsPercentage}% beats)</span></span></div>
                        <Progress value={(hardStats.count / totalSolved) * 100} className="h-2.5 bg-rose-100 [&>div]:bg-[#f43f5e]" />
                    </div>
                </CardContent>
            </Card>

            {/* Badges */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Award className="w-5 h-5 text-[#f59e0b]" /> Earned Badges</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {data?.badges?.slice(0, 6).map((badge, i) => (
                            <div key={i} className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-xl text-center group">
                                <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt={badge.title} className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 object-contain" />
                                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider leading-tight line-clamp-2">{badge.title}</span>
                            </div>
                        ))}
                        {(!data?.badges || data.badges.length === 0) && <p className="col-span-2 text-center text-sm text-slate-400 py-4">No badges earned yet.</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card className="shadow-sm border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5 text-blue-500" /> Recent Submissions</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-64">
                        <div className="divide-y divide-slate-100">
                            {data?.recentSubmissions?.slice(0, 10).map((sub, idx) => (
                                <a key={idx} href={sub.questionLink} target="_blank" rel="noreferrer" className="flex flex-col p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-3 min-w-0">
                                            <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
                                            <p className="text-sm font-bold text-slate-900 truncate">{sub.title}</p>
                                        </div>
                                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{formatDate(sub.timestamp)}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}