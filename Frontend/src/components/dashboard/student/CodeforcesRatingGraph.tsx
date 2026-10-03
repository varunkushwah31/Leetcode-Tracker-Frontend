import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent } from '../../ui/card';
import { TrophyIcon, CalendarBlankIcon as Calendar, TrendUpIcon as TrendingUp, TrendDownIcon as TrendingDown } from '@phosphor-icons/react';
import type { CodeforcesContestHistory } from '@/types';

interface CodeforcesRatingGraphProps {
    contestHistory?: CodeforcesContestHistory[];
    currentRating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
    className?: string;
}

interface CFPoint {
    x: number;
    y: number;
    contest: CodeforcesContestHistory;
}

function getRankBadgeStyle(rank?: string) {
    if (!rank) return { text: 'text-zinc-400', bg: 'bg-zinc-800/40', border: 'border-zinc-700' };
    const r = rank.toLowerCase();
    if (r.includes('legendary') || r.includes('international grandmaster') || r.includes('grandmaster')) {
        return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    }
    if (r.includes('master')) {
        return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    }
    if (r.includes('candidate')) {
        return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
    }
    if (r.includes('expert')) {
        return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    }
    if (r.includes('specialist')) {
        return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
    }
    if (r.includes('pupil')) {
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    }
    return { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30' };
}

function generateSmoothPath(points: CFPoint[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
}

export function CodeforcesRatingGraph({
    contestHistory = [],
    currentRating = 0,
    maxRating,
    rank,
    className = ''
}: Readonly<CodeforcesRatingGraphProps>) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Sort chronologically ascending
    const sortedContests = useMemo(() => {
        return [...contestHistory].sort((a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds);
    }, [contestHistory]);

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const viewBoxWidth = 500;
    const viewBoxHeight = 175;
    const padding = { top: 35, bottom: 28, left: 24, right: 28 };
    const plotWidth = viewBoxWidth - padding.left - padding.right;
    const plotHeight = viewBoxHeight - padding.top - padding.bottom;

    const { points, startYear, endYear } = useMemo(() => {
        if (sortedContests.length === 0) {
            return { points: [], startYear: '', endYear: '' };
        }

        const ratings = sortedContests.map(c => c.newRating);
        let minR = Math.min(...ratings);
        let maxR = Math.max(...ratings);

        if (minR === maxR) {
            minR -= 50;
            maxR += 50;
        } else {
            const range = maxR - minR;
            minR = Math.max(0, Math.floor(minR - range * 0.12));
            maxR = Math.ceil(maxR + range * 0.12);
        }

        const pts: CFPoint[] = sortedContests.map((c, i) => {
            const x = sortedContests.length === 1
                ? padding.left + plotWidth / 2
                : padding.left + (i / (sortedContests.length - 1)) * plotWidth;
            const y = padding.top + plotHeight - ((c.newRating - minR) / (maxR - minR)) * plotHeight;
            return { x, y, contest: c };
        });

        const firstDate = new Date(sortedContests[0].ratingUpdateTimeSeconds * 1000);
        const lastDate = new Date(sortedContests[sortedContests.length - 1].ratingUpdateTimeSeconds * 1000);

        return {
            points: pts,
            startYear: String(firstDate.getFullYear()),
            endYear: String(lastDate.getFullYear())
        };
    }, [sortedContests, plotWidth, plotHeight, padding.left, padding.top]);

    const activeIndex = hoveredIndex ?? (points.length > 0 ? points.length - 1 : null);
    const activePoint = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || points.length === 0) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const relativeX = (clientX / rect.width) * viewBoxWidth;

        let closestIdx = 0;
        let minDiff = Infinity;
        points.forEach((p, idx) => {
            const diff = Math.abs(p.x - relativeX);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
            }
        });
        setHoveredIndex(closestIdx);
    }, [points, viewBoxWidth]);

    const handleMouseLeave = useCallback(() => {
        setHoveredIndex(null);
    }, []);

    // Format display values
    const effectiveRating = activePoint
        ? activePoint.contest.newRating
        : (currentRating > 0 ? currentRating : (sortedContests.length > 0 ? sortedContests[sortedContests.length - 1].newRating : 0));

    const displayRating = effectiveRating > 0
        ? effectiveRating.toLocaleString()
        : '—';

    const displayDelta = useMemo(() => {
        if (!activePoint) return null;
        return activePoint.contest.newRating - activePoint.contest.oldRating;
    }, [activePoint]);

    const attendedCount = sortedContests.length;
    const rankStyle = getRankBadgeStyle(rank);

    const linePath = useMemo(() => generateSmoothPath(points), [points]);
    const areaPath = useMemo(() => {
        if (points.length === 0) return '';
        const baseLine = viewBoxHeight - padding.bottom;
        const first = points[0];
        const last = points[points.length - 1];
        return `${linePath} L ${last.x.toFixed(1)} ${baseLine} L ${first.x.toFixed(1)} ${baseLine} Z`;
    }, [linePath, points, viewBoxHeight, padding.bottom]);

    const formatDate = (ts: number) => {
        return new Date(ts * 1000).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate pill position relative to active point
    const pillMetrics = useMemo(() => {
        if (!activePoint) return null;
        const pillWidth = 52;
        const pillHeight = 22;

        let pillX: number;
        if (activePoint.x > viewBoxWidth - 70) {
            pillX = activePoint.x - pillWidth - 6;
        } else if (activePoint.x < 70) {
            pillX = activePoint.x + 6;
        } else {
            pillX = activePoint.x - pillWidth / 2;
        }

        let pillY: number;
        let stemStartY: number;
        let stemEndY: number;

        if (activePoint.y < 55) {
            pillY = activePoint.y + 14;
            stemStartY = activePoint.y + 5;
            stemEndY = pillY;
        } else {
            pillY = activePoint.y - pillHeight - 12;
            stemStartY = activePoint.y - 5;
            stemEndY = pillY + pillHeight;
        }

        const stemStartX = activePoint.x;
        const stemEndX = pillX + pillWidth / 2;

        return { pillX, pillY, pillWidth, pillHeight, stemStartX, stemStartY, stemEndX, stemEndY };
    }, [activePoint, viewBoxWidth]);

    return (
        <Card className={`relative bg-white/80 dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-all h-full flex flex-col justify-between ${className}`}>
            <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                <div>
                    {/* Dedicated Title & Brand Bar */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200/80 dark:border-zinc-800/60">
                        <div className="flex items-center gap-2">
                            <TrophyIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" weight="bold" />
                            <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">Codeforces Contests</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md shrink-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Codeforces</span>
                        </div>
                    </div>

                    {/* Full-Width Stats Row (Clean & Non-overlapping) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        {/* Contest Rating */}
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase truncate">
                                Contest Rating
                            </p>
                            <p className="text-xl sm:text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 tracking-tight mt-0.5">
                                {displayRating}
                            </p>
                        </div>

                        {/* Rank Tier */}
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase truncate">
                                Rank Tier
                            </p>
                            <div className="mt-1 sm:mt-0.5 flex items-center">
                                {rank ? (
                                    <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded truncate max-w-full ${rankStyle.text} ${rankStyle.bg} border ${rankStyle.border}`}>
                                        {rank}
                                    </span>
                                ) : (
                                    <span className="text-sm sm:text-base font-bold text-zinc-400">
                                        —
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Attended & Max */}
                        <div className="min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase truncate">
                                Attended
                            </p>
                            <p className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-100 mt-1 sm:mt-0.5">
                                {attendedCount}
                                {maxRating && maxRating > 0 ? (
                                    <span className="text-[10px] sm:text-xs text-zinc-500 font-medium ml-1 block sm:inline">
                                        (max {maxRating})
                                    </span>
                                ) : null}
                            </p>
                        </div>
                    </div>

                    {/* Graph Visualization */}
                    {sortedContests.length === 0 ? (
                        <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/20">
                            <TrophyIcon className="w-8 h-8 text-cyan-500/30 mb-2" />
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-400">No Codeforces contest rating recorded</p>
                            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                                Participate in Codeforces rated rounds to track your competitive rating progression.
                            </p>
                        </div>
                    ) : (
                        <div className="relative select-none">
                            <svg
                                ref={svgRef}
                                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                                className="w-full h-40 sm:h-44 overflow-visible cursor-crosshair"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                <defs>
                                    <linearGradient id="cf-rating-gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00bcd4" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.0" />
                                    </linearGradient>
                                    <filter id="cf-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00bcd4" floodOpacity="0.6" />
                                    </filter>
                                </defs>

                                {/* Horizontal guide lines */}
                                <line
                                    x1={padding.left}
                                    y1={padding.top}
                                    x2={viewBoxWidth - padding.right}
                                    y2={padding.top}
                                    stroke="currentColor"
                                    className="text-zinc-200 dark:text-zinc-800"
                                    strokeDasharray="3 3"
                                />
                                <line
                                    x1={padding.left}
                                    y1={viewBoxHeight - padding.bottom}
                                    x2={viewBoxWidth - padding.right}
                                    y2={viewBoxHeight - padding.bottom}
                                    stroke="currentColor"
                                    className="text-zinc-200 dark:text-zinc-800"
                                />

                                {/* Gradient Area under curve */}
                                <path
                                    d={areaPath}
                                    fill="url(#cf-rating-gradient)"
                                />

                                {/* Main Curve Line */}
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="#00bcd4"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    filter="url(#cf-glow-filter)"
                                />

                                {/* Active Point Indicator & Attached Rating Tag */}
                                {activePoint && pillMetrics && (
                                    <g className="transition-all duration-100 ease-out">
                                        {/* Vertical dashed guide line */}
                                        <line
                                            x1={activePoint.x}
                                            y1={padding.top}
                                            x2={activePoint.x}
                                            y2={viewBoxHeight - padding.bottom}
                                            stroke="rgba(0, 188, 212, 0.3)"
                                            strokeDasharray="2 2"
                                            strokeWidth="1"
                                        />

                                        {/* Glowing White/Cyan Marker Circle */}
                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.y}
                                            r="5.5"
                                            fill="#ffffff"
                                            stroke="#00bcd4"
                                            strokeWidth="2.5"
                                            className="drop-shadow-[0_0_6px_rgba(0,188,212,0.9)]"
                                        />

                                        {/* Stem line to floating rating badge */}
                                        <line
                                            x1={pillMetrics.stemStartX}
                                            y1={pillMetrics.stemStartY}
                                            x2={pillMetrics.stemEndX}
                                            y2={pillMetrics.stemEndY}
                                            stroke="#52525b"
                                            strokeWidth="1"
                                        />

                                        {/* Floating rating badge box */}
                                        <g transform={`translate(${pillMetrics.pillX}, ${pillMetrics.pillY})`}>
                                            <rect
                                                x="0"
                                                y="0"
                                                width={pillMetrics.pillWidth}
                                                height={pillMetrics.pillHeight}
                                                rx="5"
                                                fill="#18181b"
                                                stroke="#3f3f46"
                                                strokeWidth="1"
                                                className="shadow-xl"
                                            />
                                            <text
                                                x={pillMetrics.pillWidth / 2}
                                                y="15"
                                                textAnchor="middle"
                                                fill="#38bdf8"
                                                fontSize="11"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                {activePoint.contest.newRating.toLocaleString()}
                                            </text>
                                        </g>
                                    </g>
                                )}

                                {/* X-axis Timeline Year markers at bottom */}
                                {startYear && (
                                    <text
                                        x={padding.left}
                                        y={viewBoxHeight - 8}
                                        fill="currentColor"
                                        className="text-zinc-400 dark:text-zinc-500"
                                        fontSize="11"
                                        fontWeight="600"
                                    >
                                        {startYear}
                                    </text>
                                )}
                                {endYear && startYear !== endYear && (
                                    <text
                                        x={viewBoxWidth - padding.right}
                                        y={viewBoxHeight - 8}
                                        textAnchor="end"
                                        fill="currentColor"
                                        className="text-zinc-400 dark:text-zinc-500"
                                        fontSize="11"
                                        fontWeight="600"
                                    >
                                        {endYear}
                                    </text>
                                )}
                            </svg>
                        </div>
                    )}
                </div>

                {/* Bottom Details Footer Bar */}
                {activePoint ? (
                    <div className="mt-3 p-3 bg-zinc-50/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                            <span className="font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-xs">{activePoint.contest.contestName}</span>
                            <span className="text-zinc-400 dark:text-zinc-500">•</span>
                            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                {formatDate(activePoint.contest.ratingUpdateTimeSeconds)}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300 shrink-0">
                            <span>
                                Rank: <strong className="text-zinc-900 dark:text-white font-semibold">#{activePoint.contest.rank.toLocaleString()}</strong>
                            </span>
                            {displayDelta !== null && (
                                <span className="flex items-center gap-0.5">
                                    Delta:{' '}
                                    <strong className={`font-semibold ${displayDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {displayDelta >= 0 ? `+${displayDelta}` : displayDelta}
                                    </strong>
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold">
                                {displayDelta !== null && displayDelta >= 0 ? (
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                    <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                )}
                                {activePoint.contest.newRating.toLocaleString()}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3 p-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/40 rounded-xl flex items-center justify-center text-xs text-zinc-500">
                        <span>No rated rounds attended yet</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
