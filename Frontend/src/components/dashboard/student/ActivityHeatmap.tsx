import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import type { ProgressRecord } from '@/types';

const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-zinc-200/80 dark:bg-[#1a1a1a]';
    if (count <= 2) return 'bg-emerald-300 dark:bg-emerald-800';
    if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-600';
    if (count <= 8) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
};

const generateHeatmapDays = (progressHistory: ProgressRecord[]) => {
    const days = [];
    const today = new Date();
    const progressMap: Record<string, number> = {};

    progressHistory?.forEach(record => {
        let dateKey = "";
        if (Array.isArray(record.date)) {
            const [y, m, d] = record.date;
            dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        } else if (typeof record.date === 'object' && record.date !== null && '$date' in record.date) {
            dateKey = String((record.date as { $date: string }).$date).substring(0, 10);
        } else if (typeof record.date === 'string') {
            dateKey = record.date.substring(0, 10);
        }
        if (dateKey) progressMap[dateKey] = record.questionSolved || 0;
    });

    for (let i = 363; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ date: localDateKey, count: progressMap[localDateKey] || 0 });
    }
    return days;
};

interface ActivityHeatmapProps {
    progressHistory?: ProgressRecord[];
    consistencyStreak?: number;
}

export function ActivityHeatmap({ progressHistory = [], consistencyStreak = 0 }: ActivityHeatmapProps) {
    const heatmapDays = generateHeatmapDays(progressHistory);
    
    const activeDays = progressHistory.filter(record => record.questionSolved > 0).length;
    const totalSubmissions = heatmapDays.reduce((acc, day) => acc + day.count, 0);

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-6">
                <div>
                    <CardTitle className="text-[15px] text-zinc-600 dark:text-zinc-300 font-medium tracking-wide">
                        <span className="text-zinc-900 dark:text-white font-bold">{totalSubmissions}</span> submissions in the past one year
                    </CardTitle>
                </div>
                <div className="flex gap-6 text-xs text-zinc-500 dark:text-zinc-400 mt-3 sm:mt-0">
                    <span>Total active days: <strong className="text-zinc-900 dark:text-white font-bold text-sm ml-1">{activeDays}</strong></span>
                    <span>Max streak: <strong className="text-zinc-900 dark:text-white font-bold text-sm ml-1">{consistencyStreak}</strong></span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-2 custom-scrollbar flex justify-start xl:justify-center">
                    <TooltipProvider>
                        <div className="inline-grid grid-flow-col gap-1 w-max" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
                            {heatmapDays.map((day, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <div className={`w-3.5 h-3.5 rounded-[3px] ${getIntensityColor(day.count)} transition-all hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 cursor-crosshair transition-transform duration-150 hover:scale-125 relative hover:z-10`} />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-zinc-900 text-white border-zinc-800">
                                        <p className="font-medium text-sm">{day.date}</p>
                                        <p className="text-xs opacity-80">{day.count} {day.count === 1 ? 'problem' : 'problems'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    );
}