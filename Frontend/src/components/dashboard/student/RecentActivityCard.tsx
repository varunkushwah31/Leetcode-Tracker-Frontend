import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { ClockIcon, CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react';
import type { StudentExtendedDTO } from '@/types';

export function RecentActivityCard({ data }: Readonly<{
    data: StudentExtendedDTO | null;
}>) {
    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    return (
        <Card className="flex flex-col relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-[#5b4fff]" /> Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 px-6 pb-6 pt-6">
                <ScrollArea className="h-64 pr-4 custom-scrollbar">
                    <div className="space-y-4">
                        {data?.recentSubmissions?.slice(0, 15).map((sub) => (
                            <div key={`${sub.platform || 'LC'}-${sub.titleSlug || sub.title}-${sub.timestamp}`} className="flex items-start space-x-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/60 last:border-0 last:pb-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {sub.questionLink ? (
                                            <a
                                                href={sub.questionLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[14px] font-medium leading-tight text-zinc-900 dark:text-white truncate hover:text-[#5b4fff] dark:hover:text-[#b4afff] transition-colors"
                                            >
                                                {sub.title}
                                            </a>
                                        ) : (
                                            <p className="text-[14px] font-medium leading-tight text-zinc-900 dark:text-white truncate">{sub.title}</p>
                                        )}
                                        {sub.platform && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                                                sub.platform === 'CODEFORCES'
                                                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                            }`}>
                                                {sub.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500">{formatDate(sub.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                        {(!data?.recentSubmissions || data.recentSubmissions.length === 0) && (
                            <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 py-6">
                                No recent activity yet.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
