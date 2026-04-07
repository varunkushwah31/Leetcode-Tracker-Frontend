import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip';
import { Target } from 'lucide-react';
import type { ProgressRecord } from '../../../types';

// Moved helper functions inside this file so they don't pollute the global scope!
const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2) return 'bg-emerald-200';
    if (count <= 5) return 'bg-emerald-400';
    if (count <= 8) return 'bg-emerald-600';
    return 'bg-emerald-800';
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
            dateKey = String((record.date as any).$date).substring(0, 10);
        } else if (typeof record.date === 'string') {
            dateKey = record.date.substring(0, 10);
        }
        if (dateKey) progressMap[dateKey] = record.questionSolved || 0;
    });

    for (let i = 83; i >= 0; i--) {
        const d = new Date(); 
        d.setDate(today.getDate() - i);
        const localDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ date: localDateKey, count: progressMap[localDateKey] || 0 });
    }
    return days;
};

// Define what data this specific component needs to work
interface ActivityHeatmapProps {
    progressHistory?: ProgressRecord[];
}

export function ActivityHeatmap({ progressHistory = [] }: ActivityHeatmapProps) {
    const heatmapDays = generateHeatmapDays(progressHistory);

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-emerald-500" /> Activity Heatmap
                </CardTitle>
                <CardDescription>Your solving activity over the last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-4">
                    <TooltipProvider>
                        <div className="inline-grid grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
                            {heatmapDays.map((day, index) => (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <div className={`w-3.5 h-3.5 rounded-[3px] ${getIntensityColor(day.count)} transition-all hover:ring-2 hover:ring-slate-400 cursor-crosshair`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium text-sm">{day.date}</p>
                                        <p className="text-xs text-slate-300">{day.count} {day.count === 1 ? 'problem' : 'problems'}</p>
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