import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent } from '../../ui/card';
import { TrophyIcon, CalendarBlankIcon as Calendar, TrendUpIcon as TrendingUp } from '@phosphor-icons/react';
import type { ContestHistory } from '@/types';

interface LeetCodeRatingGraphProps {
    contestHistory?: ContestHistory[];
    currentContestRating?: number;
    globalRanking?: string;
    className?: string;
}

interface Point {
    x: number;
    y: number;
    contest: ContestHistory;
}

function generateSmoothPath(points: Point[]): string {
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

export function LeetCodeRatingGraph({
    contestHistory = [],
    currentContestRating = 0,
    globalRanking,
    className = ''
}: Readonly<LeetCodeRatingGraphProps>) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Sort chronologically ascending
    const sortedContests = useMemo(() => {
        return [...contestHistory].sort((a, b) => a.timestamp - b.timestamp);
    }, [contestHistory]);

    // Active hovered point; default to the latest contest if available
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // SVG coordinates config
    const viewBoxWidth = 500;
    const viewBoxHeight = 170;
    const padding = { top: 32, bottom: 28, left: 24, right: 28 };
    const plotWidth = viewBoxWidth - padding.left - padding.right;
    const plotHeight = viewBoxHeight - padding.top - padding.bottom;

    const { points, startYear, endYear } = useMemo(() => {
        if (sortedContests.length === 0) {
            return { points: [], startYear: '', endYear: '' };
        }

        const ratings = sortedContests.map(c => c.rating);
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

        const pts: Point[] = sortedContests.map((c, i) => {
            const x = sortedContests.length === 1
                ? padding.left + plotWidth / 2
                : padding.left + (i / (sortedContests.length - 1)) * plotWidth;
            const y = padding.top + plotHeight - ((c.rating - minR) / (maxR - minR)) * plotHeight;
            return { x, y, contest: c };
        });

        const firstDate = new Date(sortedContests[0].timestamp * 1000);
        const lastDate = new Date(sortedContests[sortedContests.length - 1].timestamp * 1000);

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
    const displayRating = activePoint
        ? Math.round(activePoint.contest.rating).toLocaleString()
        : Math.round(currentContestRating).toLocaleString();

    const displayRank = useMemo(() => {
        if (activePoint?.contest.ranking) {
            return `#${activePoint.contest.ranking.toLocaleString()}`;
        }
        if (globalRanking) {
            const parsed = Number.parseInt(globalRanking, 10);
            return !Number.isNaN(parsed) ? `#${parsed.toLocaleString()}` : globalRanking;
        }
        return '—';
    }, [activePoint, globalRanking]);

    const attendedCount = sortedContests.length;

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

    return (
        <Card className={`relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden transition-all ${className}`}>
            <CardContent className="p-5 sm:p-6">
                {/* Header Stats Matching LeetCode Contest UI */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="grid grid-cols-3 gap-6 sm:gap-10">
                        {/* Contest Rating */}
                        <div>
                            <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                                Contest Rating
                            </p>
                            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                                {displayRating}
                            </p>
                        </div>

                        {/* Global Ranking */}
                        <div>
                            <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                                Global Ranking
                            </p>
                            <p className="text-base sm:text-xl font-bold text-white mt-1 sm:mt-1.5 truncate">
                                {displayRank}
                            </p>
                        </div>

                        {/* Attended */}
                        <div>
                            <p className="text-[11px] sm:text-xs font-semibold text-zinc-400 tracking-wide uppercase">
                                Attended
                            </p>
                            <p className="text-base sm:text-xl font-bold text-white mt-1 sm:mt-1.5">
                                {attendedCount}
                            </p>
                        </div>
                    </div>

                    {/* Platform Badge */}
                    <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg shrink-0">
                        <TrophyIcon className="w-3.5 h-3.5" weight="bold" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">LeetCode</span>
                    </div>
                </div>

                {/* Graph Visualization */}
                {sortedContests.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20">
                        <TrophyIcon className="w-8 h-8 text-amber-500/40 mb-2" />
                        <p className="text-sm font-semibold text-zinc-400">No LeetCode contest rating recorded yet</p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                            Participate in weekly or biweekly LeetCode contests to track your rating progression here.
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
                                <linearGradient id="lc-rating-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ffa116" stopOpacity="0.28" />
                                    <stop offset="100%" stopColor="#ffa116" stopOpacity="0.0" />
                                </linearGradient>
                                <filter id="lc-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffa116" floodOpacity="0.6" />
                                </filter>
                            </defs>

                            {/* Horizontal guide lines */}
                            <line
                                x1={padding.left}
                                y1={padding.top}
                                x2={viewBoxWidth - padding.right}
                                y2={padding.top}
                                stroke="rgba(255,255,255,0.05)"
                                strokeDasharray="3 3"
                            />
                            <line
                                x1={padding.left}
                                y1={viewBoxHeight - padding.bottom}
                                x2={viewBoxWidth - padding.right}
                                y2={viewBoxHeight - padding.bottom}
                                stroke="rgba(255,255,255,0.05)"
                            />

                            {/* Gradient Area under curve */}
                            <path
                                d={areaPath}
                                fill="url(#lc-rating-gradient)"
                            />

                            {/* Main Curve Line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke="#ffa116"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#lc-glow-filter)"
                            />

                            {/* Active Point Indicator & Attached Rating Tag (Matching Screenshot) */}
                            {activePoint && (
                                <g className="transition-all duration-100 ease-out">
                                    {/* Vertical dashed guide line */}
                                    <line
                                        x1={activePoint.x}
                                        y1={padding.top}
                                        x2={activePoint.x}
                                        y2={viewBoxHeight - padding.bottom}
                                        stroke="rgba(255, 161, 22, 0.3)"
                                        strokeDasharray="2 2"
                                        strokeWidth="1"
                                    />

                                    {/* Glowing White/Amber Marker Circle */}
                                    <circle
                                        cx={activePoint.x}
                                        cy={activePoint.y}
                                        r="6"
                                        fill="#ffffff"
                                        stroke="#ffa116"
                                        strokeWidth="2.5"
                                        className="drop-shadow-[0_0_6px_rgba(255,161,22,0.9)]"
                                    />

                                    {/* Pointer line to floating rating badge */}
                                    <line
                                        x1={activePoint.x}
                                        y1={activePoint.y + 6}
                                        x2={activePoint.x > viewBoxWidth - 80 ? activePoint.x - 18 : activePoint.x - 12}
                                        y2={activePoint.y + 18}
                                        stroke="#52525b"
                                        strokeWidth="1"
                                    />

                                    {/* Floating rating badge box */}
                                    <g transform={`translate(${
                                        activePoint.x > viewBoxWidth - 80
                                            ? activePoint.x - 52
                                            : Math.max(8, activePoint.x - 24)
                                    }, ${Math.min(viewBoxHeight - 48, activePoint.y + 16)})`}>
                                        <rect
                                            x="0"
                                            y="0"
                                            width="48"
                                            height="20"
                                            rx="4"
                                            fill="#18181b"
                                            stroke="#3f3f46"
                                            strokeWidth="1"
                                            className="shadow-lg"
                                        />
                                        <text
                                            x="24"
                                            y="14"
                                            textAnchor="middle"
                                            fill="#e4e4e7"
                                            fontSize="11"
                                            fontWeight="bold"
                                            fontFamily="monospace"
                                        >
                                            {Math.round(activePoint.contest.rating)}
                                        </text>
                                    </g>
                                </g>
                            )}

                            {/* X-axis Timeline Year markers at bottom */}
                            {startYear && (
                                <text
                                    x={padding.left}
                                    y={viewBoxHeight - 8}
                                    fill="#71717a"
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
                                    fill="#71717a"
                                    fontSize="11"
                                    fontWeight="600"
                                >
                                    {endYear}
                                </text>
                            )}
                        </svg>

                        {/* Interactive Tooltip on Active Point */}
                        {activePoint && (
                            <div className="mt-3 p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="font-bold text-zinc-100">{activePoint.contest.title}</span>
                                    <span className="text-zinc-500">•</span>
                                    <span className="text-zinc-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-zinc-500" />
                                        {formatDate(activePoint.contest.timestamp)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-300">
                                    <span>
                                        Rank: <strong className="text-white font-semibold">#{activePoint.contest.ranking?.toLocaleString() || 'N/A'}</strong>
                                    </span>
                                    <span>
                                        Solved: <strong className="text-amber-400 font-semibold">{activePoint.contest.problemsSolved}/{activePoint.contest.totalProblems}</strong>
                                    </span>
                                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {Math.round(activePoint.contest.rating)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
