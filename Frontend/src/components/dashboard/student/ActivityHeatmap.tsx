import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { CalendarBlankIcon as Calendar, LightningIcon } from '@phosphor-icons/react';
import type { ProgressRecord } from '@/types';
import { StreakFlame } from '@/components/ui/StreakFlame';

export type ActivityRange = '12weeks' | '6months' | '1year';

export interface ActivityHeatmapProps {
    progressHistory?: ProgressRecord[];
    consistencyStreak?: number;
    className?: string;
    cardClassName?: string;
    defaultRange?: ActivityRange;
    title?: string;
}

interface HeatmapDay {
    dateKey: string;
    formattedDate: string;
    dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
    count: number;
    isFuture: boolean;
}

interface WeekColumn {
    weekIndex: number;
    monthLabel?: string;
    days: HeatmapDay[];
}

const getIntensityColor = (count: number, isFuture: boolean) => {
    if (isFuture) return 'opacity-0 pointer-events-none select-none';
    if (count === 0) return 'bg-zinc-100 dark:bg-[#151518] border border-zinc-200/80 dark:border-zinc-800/80';
    if (count <= 2) return 'bg-emerald-200 dark:bg-[#0e4429] border border-emerald-300 dark:border-emerald-800/60';
    if (count <= 5) return 'bg-emerald-400 dark:bg-[#006d32] border border-emerald-500/50 dark:border-emerald-600/60';
    if (count <= 8) return 'bg-emerald-500 dark:bg-[#26a641] border border-emerald-500 dark:border-emerald-500/80';
    return 'bg-emerald-600 dark:bg-[#39d353] border border-emerald-600 dark:border-[#39d353] shadow-[0_0_8px_rgba(57,211,83,0.4)]';
};

export function ActivityHeatmap({
    progressHistory = [],
    consistencyStreak = 0,
    className = '',
    cardClassName,
    defaultRange = '1year',
    title,
}: Readonly<ActivityHeatmapProps>) {
    const [range, setRange] = useState<ActivityRange>(defaultRange);
    const [hoveredCell, setHoveredCell] = useState<{ day: HeatmapDay; x: number; y: number; placement: 'top' | 'bottom' } | null>(null);
    const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const activeDay = hoveredCell?.day || selectedDay;

    // 1. Process progressHistory map and streaks
    const { progressMap, totalSolvedAllTime, calculatedCurrentStreak, calculatedMaxStreak } = useMemo(() => {
        const pMap: Record<string, number> = {};
        let total = 0;

        progressHistory?.forEach((record) => {
            let dateKey = '';
            if (Array.isArray(record.date)) {
                const [y, m, d] = record.date;
                dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            } else if (typeof record.date === 'object' && record.date !== null && '$date' in record.date) {
                dateKey = String((record.date as { $date: string }).$date).substring(0, 10);
            } else if (typeof record.date === 'string') {
                dateKey = record.date.substring(0, 10);
            }
            if (dateKey && record.questionSolved > 0) {
                pMap[dateKey] = (pMap[dateKey] || 0) + record.questionSolved;
                total += record.questionSolved;
            }
        });

        const activeDates = Object.keys(pMap).sort((a, b) => a.localeCompare(b));
        let maxS = 0;
        let currentS = 0;
        let tempStreak = 0;
        let prevDate: Date | null = null;

        activeDates.forEach((dStr) => {
            const curDate = new Date(`${dStr}T00:00:00`);
            if (prevDate) {
                const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak += 1;
                } else if (diffDays > 1) {
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            if (tempStreak > maxS) maxS = tempStreak;
            prevDate = curDate;
        });

        // Current streak ending today or yesterday in IST
        const getISTDate = () => {
            const d = new Date();
            const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
            return new Date(utc + (3600000 * 5.5));
        };
        const istNow = getISTDate();
        const todayStr = `${istNow.getFullYear()}-${String(istNow.getMonth() + 1).padStart(2, '0')}-${String(istNow.getDate()).padStart(2, '0')}`;
        const yesterday = new Date(istNow);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (pMap[todayStr] || pMap[yesterdayStr]) {
            const startCheck = pMap[todayStr] ? istNow : yesterday;
            const checkDate = new Date(startCheck.getFullYear(), startCheck.getMonth(), startCheck.getDate());
            let count = 0;
            while (true) {
                const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                if (pMap[key]) {
                    count += 1;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
            currentS = count;
        }

        return {
            progressMap: pMap,
            totalSolvedAllTime: total,
            calculatedCurrentStreak: currentS,
            calculatedMaxStreak: maxS,
        };
    }, [progressHistory]);

    const effectiveMaxStreak = Math.max(calculatedMaxStreak, consistencyStreak || 0);
    const effectiveCurrentStreak = consistencyStreak !== undefined && consistencyStreak > 0 ? consistencyStreak : calculatedCurrentStreak;

    // 2. Generate week columns based on selected range
    const { weeks, rangeSubmissions, rangeActiveDays } = useMemo(() => {
        const numWeeks = range === '12weeks' ? 12 : range === '6months' ? 26 : 52;
        const today = new Date();
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dayOfWeek = todayMidnight.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

        // Sunday of the current week
        const currentWeekSunday = new Date(todayMidnight);
        currentWeekSunday.setDate(todayMidnight.getDate() - dayOfWeek);

        // Sunday of the starting week
        const gridStartDate = new Date(currentWeekSunday);
        gridStartDate.setDate(currentWeekSunday.getDate() - (numWeeks - 1) * 7);

        let rangeSubCount = 0;
        let rangeActiveCount = 0;
        const weekCols: WeekColumn[] = [];
        let lastLabeledMonth = -1;

        for (let w = 0; w < numWeeks; w++) {
            const weekDays: HeatmapDay[] = [];
            let weekMonthLabel: string | undefined;

            for (let d = 0; d < 7; d++) {
                const cellDate = new Date(gridStartDate);
                cellDate.setDate(gridStartDate.getDate() + w * 7 + d);
                const isFuture = cellDate.getTime() > todayMidnight.getTime();

                const y = cellDate.getFullYear();
                const m = String(cellDate.getMonth() + 1).padStart(2, '0');
                const dayNum = String(cellDate.getDate()).padStart(2, '0');
                const dateKey = `${y}-${m}-${dayNum}`;

                const count = isFuture ? 0 : (progressMap[dateKey] || 0);

                if (!isFuture) {
                    rangeSubCount += count;
                    if (count > 0) rangeActiveCount += 1;
                }

                if (d === 0) {
                    const currentMonth = cellDate.getMonth();
                    if (currentMonth !== lastLabeledMonth) {
                        weekMonthLabel = cellDate.toLocaleDateString('en-US', { month: 'short' });
                        lastLabeledMonth = currentMonth;
                    }
                }

                weekDays.push({
                    dateKey,
                    formattedDate: cellDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }),
                    dayOfWeek: d,
                    count,
                    isFuture
                });
            }

            weekCols.push({
                weekIndex: w,
                monthLabel: weekMonthLabel,
                days: weekDays
            });
        }

        return {
            weeks: weekCols,
            rangeSubmissions: rangeSubCount,
            rangeActiveDays: rangeActiveCount
        };
    }, [progressMap, range]);

    // 3. Smooth scroll to end for 6 months and 1 year
    useEffect(() => {
        if (scrollContainerRef.current && (range === '6months' || range === '1year')) {
            const scrollToCurrent = () => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
                }
            };
            scrollToCurrent();
            const timer = setTimeout(scrollToCurrent, 100);
            return () => clearTimeout(timer);
        }
    }, [range, weeks]);

    // Dismiss floating tooltip on window scroll or resize
    useEffect(() => {
        const handleScrollOrResize = () => setHoveredCell(null);
        window.addEventListener('scroll', handleScrollOrResize, { passive: true });
        window.addEventListener('resize', handleScrollOrResize, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, []);

    const rangeLabel = range === '12weeks' ? 'past 12 weeks' : range === '6months' ? 'past 6 months' : 'past one year';

    const defaultCardClass = "relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200";

    return (
        <Card className={`${cardClassName || defaultCardClass} ${className}`}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800/60">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <Calendar className="w-5 h-5" weight="bold" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                            {title || 'Activity Heatmap'}
                        </CardTitle>
                        {activeDay ? (
                            <div className="flex items-center gap-2 mt-0.5 animate-in fade-in duration-150">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">{activeDay.formattedDate}:</span>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {activeDay.count === 0 ? 'No problems solved' : `${activeDay.count} ${activeDay.count === 1 ? 'problem' : 'problems'} solved`}
                                </span>
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                <strong className="text-zinc-900 dark:text-white font-bold">{rangeSubmissions}</strong> submissions in the {rangeLabel}
                                {range !== '1year' && totalSolvedAllTime > rangeSubmissions && (
                                    <span className="text-zinc-400 dark:text-zinc-500 ml-1">({totalSolvedAllTime} total all-time)</span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Header Section: Stats & Range Tabs */}
                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 w-full sm:w-auto">
                        <span>
                            Active: <strong className="text-zinc-900 dark:text-white font-bold">{rangeActiveDays}d</strong>
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="flex items-center gap-1">
                            <StreakFlame className="w-3.5 h-3.5" />
                            Streak: <strong className="text-zinc-900 dark:text-white font-bold">{effectiveCurrentStreak}d</strong>
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>
                            Max: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{effectiveMaxStreak}d</strong>
                        </span>
                    </div>

                    {/* Range Selector Pills */}
                    <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-zinc-100 dark:bg-[#141414]/90 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs dark:shadow-none w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => setRange('12weeks')}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all text-center cursor-pointer ${
                                range === '12weeks'
                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            12 Weeks
                        </button>
                        <button
                            type="button"
                            onClick={() => setRange('6months')}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all text-center cursor-pointer ${
                                range === '6months'
                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            6 Months
                        </button>
                        <button
                            type="button"
                            onClick={() => setRange('1year')}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all text-center cursor-pointer ${
                                range === '1year'
                                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            1 Year
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-5">
                <div className="flex items-start">
                    {/* Weekday Labels Column - pinned outside scroll container, ALWAYS visible */}
                    <div className="flex flex-col gap-1 shrink-0 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mr-2 pt-5 select-none">
                        <div className="h-3.5 flex items-center justify-end pr-1 opacity-0">Sun</div>
                        <div className="h-3.5 flex items-center justify-end pr-1">Mon</div>
                        <div className="h-3.5 flex items-center justify-end pr-1 opacity-0">Tue</div>
                        <div className="h-3.5 flex items-center justify-end pr-1">Wed</div>
                        <div className="h-3.5 flex items-center justify-end pr-1 opacity-0">Thu</div>
                        <div className="h-3.5 flex items-center justify-end pr-1">Fri</div>
                        <div className="h-3.5 flex items-center justify-end pr-1 opacity-0">Sat</div>
                    </div>

                    {/* Scrollable Grid Container */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={() => {
                            if (hoveredCell) setHoveredCell(null);
                        }}
                        className="flex-1 min-w-0 pb-2 overflow-x-auto custom-scrollbar"
                    >
                        <div className="flex gap-1 min-w-fit select-none">
                            {weeks.map((week) => (
                                <div key={week.weekIndex} className="flex flex-col shrink-0 w-3.5">
                                    {/* Month header label positioned cleanly above week column */}
                                    <div className="relative h-5">
                                        {week.monthLabel && (
                                            <span className="absolute left-0 top-0 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap pointer-events-none select-none">
                                                {week.monthLabel}
                                            </span>
                                        )}
                                    </div>

                                    {/* 7 Days in Week Column */}
                                    <div className="flex flex-col gap-1">
                                        {week.days.map((day) => (
                                            <div
                                                key={day.dateKey}
                                                tabIndex={day.isFuture ? -1 : 0}
                                                role={day.isFuture ? undefined : "button"}
                                                aria-label={day.isFuture ? undefined : `${day.formattedDate}: ${day.count} solved`}
                                                onClick={() => {
                                                    if (day.isFuture) return;
                                                    setSelectedDay(prev => prev?.dateKey === day.dateKey ? null : day);
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (day.isFuture) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const placement = rect.top < 85 ? 'bottom' : 'top';
                                                    const targetY = placement === 'top' ? rect.top - 4 : rect.bottom + 4;
                                                    const targetX = rect.left + rect.width / 2;
                                                    setHoveredCell({
                                                        day,
                                                        x: targetX,
                                                        y: targetY,
                                                        placement,
                                                    });
                                                }}
                                                onMouseLeave={() => setHoveredCell(null)}
                                                className={`w-3.5 h-3.5 rounded-[3px] ${getIntensityColor(day.count, day.isFuture)} transition-transform duration-100 ${
                                                    day.isFuture
                                                        ? ''
                                                        : `cursor-pointer relative hover:z-20 hover:scale-125 hover:ring-2 hover:ring-emerald-400 dark:hover:ring-emerald-400 ${
                                                            selectedDay?.dateKey === day.dateKey ? 'ring-2 ring-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''
                                                        }`
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Single Shared Floating Tooltip Overlay - Anchored directly to cell with triangle pointer */}
                {hoveredCell && typeof document !== 'undefined' && createPortal(
                    <div
                        className={`fixed z-[9999] pointer-events-none -translate-x-1/2 ${
                            hoveredCell.placement === 'top' ? '-translate-y-full' : 'translate-y-0'
                        } flex flex-col items-center drop-shadow-lg`}
                        style={{ left: hoveredCell.x, top: hoveredCell.y }}
                    >
                        {/* Tooltip Content Box */}
                        <div className="bg-zinc-900/95 dark:bg-zinc-900/95 backdrop-blur-md text-white border border-zinc-700/80 dark:border-zinc-800 text-xs py-1 px-2.5 rounded-lg shadow-xl text-center whitespace-nowrap">
                            <p className="font-semibold text-zinc-100 text-[11px] leading-tight">{hoveredCell.day.formattedDate}</p>
                            <p className="text-emerald-400 text-[10px] font-medium leading-tight mt-0.5">
                                {hoveredCell.day.count === 0
                                    ? 'No problems solved'
                                    : `${hoveredCell.day.count} ${hoveredCell.day.count === 1 ? 'problem' : 'problems'} solved`}
                            </p>
                        </div>
                        {/* Directional Triangle Pointer directly anchoring to cell */}
                        <div
                            className={`w-0 h-0 border-x-4 border-x-transparent ${
                                hoveredCell.placement === 'top'
                                    ? 'border-t-4 border-t-zinc-900 -mt-px'
                                    : 'border-b-4 border-b-zinc-900 -order-1 -mb-px'
                            }`}
                        />
                    </div>,
                    document.body
                )}

                {/* Legend & Synced Indicator Footer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    <div className="flex items-center gap-2">
                        <LightningIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" weight="fill" />
                        {activeDay ? (
                            <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                <strong className="text-zinc-900 dark:text-white font-semibold">{activeDay.formattedDate}</strong>: {activeDay.count === 0 ? 'No problems' : `${activeDay.count} ${activeDay.count === 1 ? 'problem' : 'problems'}`} solved
                            </span>
                        ) : (
                            <span className="text-[11px]">Synchronized daily submissions activity</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                        <span>Less</span>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-[3px] bg-zinc-100 dark:bg-[#151518] border border-zinc-200/80 dark:border-zinc-800/80" title="0 submissions" />
                            <div className="w-3 h-3 rounded-[3px] bg-emerald-200 dark:bg-[#0e4429] border border-emerald-300 dark:border-emerald-800/60" title="1-2 submissions" />
                            <div className="w-3 h-3 rounded-[3px] bg-emerald-400 dark:bg-[#006d32] border border-emerald-500/50 dark:border-emerald-600/60" title="3-5 submissions" />
                            <div className="w-3 h-3 rounded-[3px] bg-emerald-500 dark:bg-[#26a641] border border-emerald-500 dark:border-emerald-500/80" title="6-8 submissions" />
                            <div className="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-[#39d353] border border-emerald-600 dark:border-[#39d353]" title="9+ submissions" />
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
