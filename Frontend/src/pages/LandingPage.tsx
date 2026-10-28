import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    UsersIcon,
    CaretRightIcon as ChevronRight,
    CheckCircleIcon,
    CodeIcon as Code2Icon,
    ListIcon as MenuIcon,
    XIcon,
    DatabaseIcon,
    FireIcon,
    TrophyIcon,
    FileCsvIcon as FileSpreadsheet,
    TerminalIcon,
    ClockIcon,
    BrainIcon,
    ArrowUpRightIcon,
    MagnifyingGlassIcon,
    LightningIcon,
    TargetIcon,
    HeartIcon,
    ShieldCheckIcon,
    ArrowsClockwiseIcon,
    PaperPlaneTiltIcon,
    CheckIcon,
    TrendUpIcon,
    CopyIcon,
    CalendarBlankIcon
} from '@phosphor-icons/react';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { DottedBackground } from '../components/ui/DottedBackground';

interface SampleStudent {
    id: string;
    name: string;
    handle: string;
    lcSolved: number;
    cfSolved: number;
    lcRating: number;
    cfRating: number;
    cfRank: string;
    lcRank: string;
    streak: number;
}

const SAMPLE_LEADERBOARD: SampleStudent[] = [
    {
        id: '1',
        name: 'Prateek Kumar',
        handle: 'prateek_k',
        lcSolved: 440,
        cfSolved: 260,
        lcRating: 1980,
        cfRating: 1640,
        cfRank: 'Expert',
        lcRank: 'Guardian',
        streak: 68
    },
    {
        id: '2',
        name: 'Prachi Sharma',
        handle: 'prachi_s',
        lcSolved: 410,
        cfSolved: 230,
        lcRating: 1910,
        cfRating: 1520,
        cfRank: 'Specialist',
        lcRank: 'Knight',
        streak: 56
    },
    {
        id: '3',
        name: 'Varun Kushwah',
        handle: 'varun_k',
        lcSolved: 380,
        cfSolved: 290,
        lcRating: 1840,
        cfRating: 1680,
        cfRank: 'Expert',
        lcRank: 'Knight',
        streak: 51
    },
    {
        id: '4',
        name: 'Piyush Goel',
        handle: 'piyush_g',
        lcSolved: 350,
        cfSolved: 210,
        lcRating: 1780,
        cfRating: 1420,
        cfRank: 'Specialist',
        lcRank: 'Knight',
        streak: 43
    }
];

interface StudentProfileDetail {
    id: string;
    name: string;
    initials: string;
    avatarBg: string;
    handle: string;
    lcHandle: string;
    cfHandle: string;
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    lcRating: number;
    lcRank: string;
    lcPercentile: string;
    cfRating: number;
    cfRank: string;
    cfDivision: string;
    streak: number;
    annualSubmissions: number;
    heatmapDensity: number[];
}

const STUDENT_PROFILES: Record<string, StudentProfileDetail> = {
    '1': {
        id: '1',
        name: 'Prateek Kumar',
        initials: 'PK',
        avatarBg: 'bg-indigo-600',
        handle: 'prateek_k',
        lcHandle: 'prateek_k',
        cfHandle: 'prateek_cf',
        totalSolved: 700,
        easySolved: 175,
        mediumSolved: 380,
        hardSolved: 145,
        lcRating: 1980,
        lcRank: 'Guardian',
        lcPercentile: 'Top 3.8%',
        cfRating: 1640,
        cfRank: 'Expert',
        cfDivision: 'Div. 1/2 Contender',
        streak: 68,
        annualSubmissions: 520,
        heatmapDensity: [1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 0, 1, 3, 2, 1, 3, 2, 0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 2, 3, 1, 0, 2, 3, 2, 1, 0, 2, 3, 1, 2, 3]
    },
    '2': {
        id: '2',
        name: 'Prachi Sharma',
        initials: 'PS',
        avatarBg: 'bg-purple-600',
        handle: 'prachi_s',
        lcHandle: 'prachi_s',
        cfHandle: 'prachi_cf',
        totalSolved: 640,
        easySolved: 160,
        mediumSolved: 350,
        hardSolved: 130,
        lcRating: 1910,
        lcRank: 'Knight',
        lcPercentile: 'Top 4.5%',
        cfRating: 1520,
        cfRank: 'Specialist',
        cfDivision: 'Div. 2 Participant',
        streak: 56,
        annualSubmissions: 440,
        heatmapDensity: [2, 1, 3, 0, 2, 1, 2, 3, 1, 0, 2, 3, 1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 3, 0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 0, 3, 2]
    },
    '3': {
        id: '3',
        name: 'Varun Kushwah',
        initials: 'VK',
        avatarBg: 'bg-emerald-600',
        handle: 'varun_k',
        lcHandle: 'varun_k',
        cfHandle: 'varun_cf',
        totalSolved: 670,
        easySolved: 150,
        mediumSolved: 360,
        hardSolved: 160,
        lcRating: 1840,
        lcRank: 'Knight',
        lcPercentile: 'Top 5.2%',
        cfRating: 1680,
        cfRank: 'Expert',
        cfDivision: 'Div. 1/2 Contender',
        streak: 51,
        annualSubmissions: 460,
        heatmapDensity: [0, 2, 3, 1, 2, 0, 1, 3, 2, 1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 0, 3, 2, 1, 2, 3, 0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 3]
    },
    '4': {
        id: '4',
        name: 'Piyush Goel',
        initials: 'PG',
        avatarBg: 'bg-amber-600',
        handle: 'piyush_g',
        lcHandle: 'piyush_g',
        cfHandle: 'piyush_cf',
        totalSolved: 560,
        easySolved: 180,
        mediumSolved: 290,
        hardSolved: 90,
        lcRating: 1780,
        lcRank: 'Knight',
        lcPercentile: 'Top 6.5%',
        cfRating: 1420,
        cfRank: 'Specialist',
        cfDivision: 'Div. 2 Participant',
        streak: 43,
        annualSubmissions: 370,
        heatmapDensity: [1, 0, 2, 3, 1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 3, 0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 0, 2, 3, 1, 2, 0, 3, 2, 1, 2, 3, 0, 1, 2, 3, 1]
    }
};

interface TopicMetric {
    id: string;
    name: string;
    category: string;
    percentage: number;
    status: 'Critical Weakness' | 'Developing' | 'Proficient' | 'Mastered';
    statusClass: string;
    barClass: string;
    needReviewCount: number;
}

const COHORT_TOPICS: TopicMetric[] = [
    {
        id: 'dp',
        name: 'Dynamic Programming (Knapsack, 2D Grid, Memoization)',
        category: 'Algorithms',
        percentage: 42,
        status: 'Critical Weakness',
        statusClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
        barClass: 'bg-rose-500',
        needReviewCount: 18
    },
    {
        id: 'graphs',
        name: 'Graph Traversals (BFS, DFS, Topological Sort, Dijkstra)',
        category: 'Algorithms',
        percentage: 58,
        status: 'Developing',
        statusClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        barClass: 'bg-amber-500',
        needReviewCount: 14
    },
    {
        id: 'trees',
        name: 'Binary Trees & Segment Trees',
        category: 'Data Structures',
        percentage: 76,
        status: 'Developing',
        statusClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
        barClass: 'bg-sky-500',
        needReviewCount: 7
    },
    {
        id: 'binary-search',
        name: 'Binary Search & Sliding Window',
        category: 'Techniques',
        percentage: 84,
        status: 'Proficient',
        statusClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        barClass: 'bg-emerald-500',
        needReviewCount: 4
    },
    {
        id: 'arrays',
        name: 'Arrays, Strings & HashMaps',
        category: 'Data Structures',
        percentage: 92,
        status: 'Mastered',
        statusClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        barClass: 'bg-emerald-500',
        needReviewCount: 2
    }
];

interface SampleVerification {
    id: string;
    title: string;
    platform: 'LeetCode' | 'Codeforces';
    problemId: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | '800' | '1400';
    runtime: string;
    beats: string;
    memory: string;
    timestamp: string;
}

const SAMPLE_VERIFICATIONS: SampleVerification[] = [
    {
        id: 'v1',
        title: 'Course Schedule II',
        platform: 'LeetCode',
        problemId: '210',
        difficulty: 'Medium',
        runtime: '12ms',
        beats: '98.4%',
        memory: '14.2 MB',
        timestamp: 'Just now'
    },
    {
        id: 'v2',
        title: 'Watermelon',
        platform: 'Codeforces',
        problemId: '4A',
        difficulty: '800',
        runtime: '30ms',
        beats: '100.0%',
        memory: '1.8 MB',
        timestamp: '2m ago'
    },
    {
        id: 'v3',
        title: 'LRU Cache',
        platform: 'LeetCode',
        problemId: '146',
        difficulty: 'Medium',
        runtime: '44ms',
        beats: '94.6%',
        memory: '22.8 MB',
        timestamp: '5m ago'
    },
    {
        id: 'v4',
        title: 'Trapping Rain Water',
        platform: 'LeetCode',
        problemId: '42',
        difficulty: 'Hard',
        runtime: '4ms',
        beats: '99.1%',
        memory: '18.1 MB',
        timestamp: '8m ago'
    }
];


function getRankBadgeClass(idx: number): string {
    if (idx === 0) return 'text-amber-500 font-extrabold';
    if (idx === 1) return 'text-zinc-400 font-bold';
    if (idx === 2) return 'text-amber-700 font-bold';
    return 'text-zinc-500';
}

function getHeatmapDensityClass(density: number): string {
    if (density === 3) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    if (density === 2) return 'bg-emerald-600/70';
    if (density === 1) return 'bg-emerald-700/40';
    return 'bg-zinc-200 dark:bg-zinc-800';
}

interface HeatmapCellData {
    cellId: string;
    dayIndex: number;
    density: number;
}

function getStudentHeatmapCells(profile: StudentProfileDetail): HeatmapCellData[] {
    return profile.heatmapDensity.map((density, idx) => ({
        cellId: `profile-${profile.id}-day-${idx + 1}`,
        dayIndex: idx,
        density
    }));
}

type LeaderboardSortOption = 'total' | 'lc' | 'cf' | 'streak';
type TopicFilterOption = 'all' | 'weaknesses';

function getSortedLeaderboardStudents(sort: LeaderboardSortOption) {
    return [...SAMPLE_LEADERBOARD].sort((a, b) => {
        switch (sort) {
            case 'lc': return b.lcRating - a.lcRating;
            case 'cf': return b.cfRating - a.cfRating;
            case 'streak': return b.streak - a.streak;
            default: return (b.lcSolved + b.cfSolved) - (a.lcSolved + a.cfSolved);
        }
    });
}

function filterLeaderboardStudents(students: typeof SAMPLE_LEADERBOARD, query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(student => 
        student.name.toLowerCase().includes(q) ||
        student.handle.toLowerCase().includes(q)
    );
}

interface LeaderboardTabContentProps {
    filteredStudents: typeof SAMPLE_LEADERBOARD;
    leaderboardSort: LeaderboardSortOption;
    setLeaderboardSort: (sort: LeaderboardSortOption) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSelectStudent: (id: string) => void;
}

function LeaderboardTabContent({
    filteredStudents,
    leaderboardSort,
    setLeaderboardSort,
    searchQuery,
    setSearchQuery,
    onSelectStudent
}: Readonly<LeaderboardTabContentProps>) {
    return (
        <div key="leaderboard" className="animate-tab-enter space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Class Leaderboard</h3>
                    <p className="text-xs text-zinc-500">Live rankings based on verified problems solved and contest ratings</p>
                </div>

                <div className="relative w-full sm:w-60">
                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter student or handle..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-[#5b4fff] focus:ring-1 focus:ring-[#5b4fff] transition-all"
                    />
                    {searchQuery && (
                        <button 
                            type="button" 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            aria-label="Clear search"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-zinc-500 text-[11px] font-medium">
                    Showing {filteredStudents.length} of {SAMPLE_LEADERBOARD.length} students
                </span>
                <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-medium mr-1">Sort:</span>
                    <button
                        type="button"
                        onClick={() => setLeaderboardSort('total')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-150 ${
                            leaderboardSort === 'total' 
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        Total Solves
                    </button>
                    <button
                        type="button"
                        onClick={() => setLeaderboardSort('lc')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-150 ${
                            leaderboardSort === 'lc' 
                                ? 'bg-[#ffa116] text-white shadow-xs' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        LC Rating
                    </button>
                    <button
                        type="button"
                        onClick={() => setLeaderboardSort('cf')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-150 ${
                            leaderboardSort === 'cf' 
                                ? 'bg-sky-500 text-white shadow-xs' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        CF Rating
                    </button>
                    <button
                        type="button"
                        onClick={() => setLeaderboardSort('streak')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-150 ${
                            leaderboardSort === 'streak' 
                                ? 'bg-amber-500 text-white shadow-xs' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        Streak
                    </button>
                </div>
            </div>

            <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#14141a]">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => (
                        <button 
                            key={student.id} 
                            type="button"
                            onClick={() => onSelectStudent(student.id)}
                            className="w-full text-left p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-[#1c1c24]/50 transition-all duration-200 cursor-pointer group"
                            title="Click to view detailed profile"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`w-6 text-center font-bold text-xs transition-transform group-hover:scale-110 ${getRankBadgeClass(idx)}`}>
                                    #{idx + 1}
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#5b4fff] group-hover:text-white transition-all duration-200 shadow-2xs">
                                    {student.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate group-hover:text-[#5b4fff] group-hover:translate-x-0.5 transition-all duration-200">{student.name}</p>
                                    <p className="text-[11px] text-zinc-500">@{student.handle}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                                <span className="font-bold text-zinc-900 dark:text-white">
                                    {student.lcSolved + student.cfSolved} Solved
                                </span>
                                <span className="px-2 py-0.5 rounded bg-[#ffa116]/10 text-[#ffa116] font-semibold text-[11px] border border-[#ffa116]/20">
                                    LC {student.lcRating} ({student.lcRank})
                                </span>
                                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-semibold text-[11px] border border-sky-500/20">
                                    CF {student.cfRating} ({student.cfRank})
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-amber-500 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    <FireIcon className="w-3.5 h-3.5 animate-flame" weight="fill" />
                                    {student.streak}d
                                </span>
                                <span className="text-[11px] font-semibold text-[#5b4fff] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 hidden md:inline">
                                    Inspect &rarr;
                                </span>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                        No students found matching &quot;{searchQuery}&quot;.
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="ml-2 text-[#5b4fff] underline font-semibold cursor-pointer"
                        >
                            Clear filter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ProfileTabContentProps {
    selectedStudentId: string;
    setSelectedStudentId: (id: string) => void;
    profile: StudentProfileDetail;
    hoveredHeatmapDay: number | null;
    setHoveredHeatmapDay: (day: number | null) => void;
}

function ProfileTabContent({
    selectedStudentId,
    setSelectedStudentId,
    profile,
    hoveredHeatmapDay,
    setHoveredHeatmapDay
}: Readonly<ProfileTabContentProps>) {
    const heatmapCells = getStudentHeatmapCells(profile);

    return (
        <div key={`profile-${selectedStudentId}`} className="animate-tab-enter space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500 font-medium mr-1 text-[11px]">Select Student:</span>
                    {SAMPLE_LEADERBOARD.map(student => (
                        <button
                            key={student.id}
                            type="button"
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer hover:-translate-y-0.5 active:scale-95 transition-all duration-150 ${
                                selectedStudentId === student.id
                                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            {student.name}
                        </button>
                    ))}
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[11px] font-bold border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" weight="bold" />
                    Verified Student Profile
                </span>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                <div className={`w-11 h-11 rounded-xl ${profile.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs hover:rotate-6 transition-transform duration-300`}>
                    {profile.initials}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                        {profile.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        LeetCode: @{profile.lcHandle} • Codeforces: @{profile.cfHandle}
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <FireIcon className="w-4 h-4 animate-flame" weight="fill" />
                    <span>{profile.streak} Day Streak</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80 interactive-card">
                    <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-zinc-500">Solved Distribution</span>
                        <span className="text-emerald-500 font-bold">{profile.easySolved + profile.mediumSolved + profile.hardSolved} Total</span>
                    </div>
                    <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                        {profile.totalSolved} Problems
                    </p>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full mt-2.5 overflow-hidden flex">
                        <div 
                            className="bg-emerald-500 h-full transition-all duration-700 ease-out" 
                            style={{ width: `${(profile.easySolved / profile.totalSolved) * 100}%` }}
                            title={`Easy: ${profile.easySolved}`} 
                        />
                        <div 
                            className="bg-amber-500 h-full transition-all duration-700 ease-out" 
                            style={{ width: `${(profile.mediumSolved / profile.totalSolved) * 100}%` }}
                            title={`Medium: ${profile.mediumSolved}`} 
                        />
                        <div 
                            className="bg-rose-500 h-full transition-all duration-700 ease-out" 
                            style={{ width: `${(profile.hardSolved / profile.totalSolved) * 100}%` }}
                            title={`Hard: ${profile.hardSolved}`} 
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400">Easy {profile.easySolved}</span>
                        <span className="text-amber-600 dark:text-amber-400">Med {profile.mediumSolved}</span>
                        <span className="text-rose-500">Hard {profile.hardSolved}</span>
                    </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80 interactive-card">
                    <p className="text-[11px] font-semibold text-zinc-500">LeetCode Contest</p>
                    <p className="text-xl font-bold text-[#ffa116] mt-1">{profile.lcRating.toLocaleString()}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{profile.lcPercentile} • {profile.lcRank} Rank</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80 interactive-card">
                    <p className="text-[11px] font-semibold text-zinc-500">Codeforces Rating</p>
                    <p className="text-xl font-bold text-sky-500 mt-1">{profile.cfRating.toLocaleString()}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{profile.cfRank} • {profile.cfDivision}</p>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {profile.streak}-Day Technical Consistency Heatmap
                    </span>
                    <span className="text-emerald-500 font-bold">
                        {hoveredHeatmapDay !== null 
                            ? `Day ${hoveredHeatmapDay + 1}: ${profile.heatmapDensity[hoveredHeatmapDay] * 3} solves` 
                            : `${profile.annualSubmissions} Submissions This Year`
                        }
                    </span>
                </div>
                <div className="grid grid-cols-14 gap-1.5 pt-1">
                    {heatmapCells.map((cell) => (
                        <div 
                            key={cell.cellId} 
                            onMouseEnter={() => setHoveredHeatmapDay(cell.dayIndex)}
                            onMouseLeave={() => setHoveredHeatmapDay(null)}
                            className={`h-4 rounded-[3px] hover:scale-135 hover:z-10 transition-transform duration-150 cursor-pointer relative ${getHeatmapDensityClass(cell.density)}`}
                            title={`Day ${cell.dayIndex + 1}: ${cell.density * 3} solves recorded`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

interface AnalyticsTabContentProps {
    topicFilter: TopicFilterOption;
    setTopicFilter: (filter: TopicFilterOption) => void;
    filteredTopics: typeof COHORT_TOPICS;
    dispatchSuccess: boolean;
    onDispatchRemedial: () => void;
}

function AnalyticsTabContent({
    topicFilter,
    setTopicFilter,
    filteredTopics,
    dispatchSuccess,
    onDispatchRemedial
}: Readonly<AnalyticsTabContentProps>) {
    return (
        <div key="analytics" className="animate-tab-enter space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Topic Mastery Matrix</h3>
                    <p className="text-xs text-zinc-500">Track which algorithmic topics your students have mastered and where they need practice</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setTopicFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-150 ${
                            topicFilter === 'all'
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        All Topics ({COHORT_TOPICS.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTopicFilter('weaknesses')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all duration-150 ${
                            topicFilter === 'weaknesses'
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                    >
                        Weaknesses Only (&lt;60%)
                    </button>
                </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <TargetIcon className="w-4 h-4 text-[#5b4fff]" weight="bold" />
                        Recommended Practice Set
                    </p>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        18 students could use extra practice on Dynamic Programming and Graphs.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onDispatchRemedial}
                    disabled={dispatchSuccess}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hover:-translate-y-0.5 active:scale-95 duration-150 ${
                        dispatchSuccess
                            ? 'bg-emerald-600 text-white shadow-md animate-scale-bounce'
                            : 'bg-[#5b4fff] hover:bg-[#4d40ef] text-white shadow-xs hover:shadow-md'
                    }`}
                >
                    {dispatchSuccess ? (
                        <>
                            <CheckIcon className="w-4 h-4" weight="bold" />
                            Practice Set Assigned!
                        </>
                    ) : (
                        <>
                            <PaperPlaneTiltIcon className="w-4 h-4" weight="bold" />
                            Assign Practice Problems
                        </>
                    )}
                </button>
            </div>

            <div className="space-y-3">
                {filteredTopics.map(topic => (
                    <div key={topic.id} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80 interactive-card">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="font-bold text-zinc-900 dark:text-white">{topic.name}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-medium">
                                    {topic.needReviewCount} need review
                                </span>
                                <span className={`font-bold text-[11px] px-2 py-0.5 rounded border ${topic.statusClass}`}>
                                    {topic.status} ({topic.percentage}%)
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${topic.barClass} transition-all duration-700 ease-out`}
                                style={{ width: `${topic.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function LandingPage() {
    const [canvasTab, setCanvasTab] = useState<'leaderboard' | 'profile' | 'analytics'>('leaderboard');
    const [leaderboardSort, setLeaderboardSort] = useState<LeaderboardSortOption>('total');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('2');
    const [selectedVerification, setSelectedVerification] = useState<string>('v1');
    const [isVerifyingSim, setIsVerifyingSim] = useState(false);
    const [topicFilter, setTopicFilter] = useState<TopicFilterOption>('all');
    const [dispatchSuccess, setDispatchSuccess] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<number | null>(null);
    const [copiedPayload, setCopiedPayload] = useState(false);

    useEffect(() => {
        if (window.location.hash) {
            const targetId = window.location.hash.replace('#', '');
            const element = document.getElementById(targetId);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, []);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const sortedStudents = useMemo(() => getSortedLeaderboardStudents(leaderboardSort), [leaderboardSort]);
    const filteredStudents = useMemo(() => filterLeaderboardStudents(sortedStudents, searchQuery), [sortedStudents, searchQuery]);

    const activeVerification = SAMPLE_VERIFICATIONS.find(v => v.id === selectedVerification) || SAMPLE_VERIFICATIONS[0];
    const activeStudentProfile = STUDENT_PROFILES[selectedStudentId] || STUDENT_PROFILES['2'];

    const filteredTopics = useMemo(() => {
        return topicFilter === 'all' 
            ? COHORT_TOPICS 
            : COHORT_TOPICS.filter(t => t.percentage < 60);
    }, [topicFilter]);

    const handleRunVerificationSim = () => {
        setIsVerifyingSim(true);
        setTimeout(() => {
            setIsVerifyingSim(false);
        }, 700);
    };

    const handleCopyPayload = () => {
        const payload = JSON.stringify({
            target: `https://${activeVerification.platform.toLowerCase()}.com/problems/${activeVerification.title.toLowerCase().replace(/\s+/g, '-')}`,
            platform: activeVerification.platform,
            problemId: activeVerification.problemId,
            status: "Accepted",
            runtime: activeVerification.runtime,
            memory: activeVerification.memory,
            verified: true
        }, null, 2);
        void navigator.clipboard?.writeText(payload);
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 2000);
    };

    const handleDispatchRemedial = () => {
        setDispatchSuccess(true);
        setTimeout(() => {
            setDispatchSuccess(false);
        }, 4000);
    };

    const handleSelectStudentForProfile = (studentId: string) => {
        setSelectedStudentId(studentId);
        setCanvasTab('profile');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white selection:bg-[#5b4fff] selection:text-white overflow-x-hidden font-sans relative transition-colors duration-200">

            {/* Background Base matching Signup / Signin / Dashboards */}
            <div className="fixed inset-0 z-0 bg-[#f8fafc] dark:bg-[#050505] transition-colors duration-200 pointer-events-none" aria-hidden="true">
                <DottedBackground />
                <div className="hidden dark:block">
                    <AmbientGlow />
                </div>
            </div>

            {/* Mobile Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 dark:bg-black/75 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Floating Navigation Dock */}
            <header className="fixed top-4 sm:top-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[92%] max-w-5xl z-50 rounded-2xl bg-white/95 dark:bg-[#0e0e12]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-lg px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col transition-all">
                <div className="flex items-center justify-between w-full">
                    <BrandLogo size="responsive" theme="auto" />

                    {/* Desktop Navigation */}
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-5">
                        <button 
                            type="button"
                            onClick={() => scrollToSection('verification-engine')} 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors min-h-11 flex items-center cursor-pointer"
                        >
                            Features
                        </button>
                        <Link 
                            to="/how-to-use" 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors min-h-11 flex items-center"
                        >
                            How to Use
                        </Link>
                        <Link 
                            to="/contact" 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors min-h-11 flex items-center"
                        >
                            Contact
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] rounded-lg px-2 min-h-11 flex items-center"
                        >
                            Sign In
                        </Link>
                        <ThemeToggle className="bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border-zinc-200 dark:border-white/10 min-h-11 min-w-11" />
                        <Link 
                            to="/login" 
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_0_24px_rgba(91,79,255,0.3)] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] hover:-translate-y-0.5 active:translate-y-0 min-h-11 flex items-center shimmer-sweep interactive-press"
                        >
                            Get Started
                        </Link>
                    </nav>

                    {/* Mobile Controls */}
                    <div className="flex md:hidden items-center gap-2 shrink-0">
                        <ThemeToggle className="bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 min-h-11 min-w-11" />
                        <Link
                            to="/login"
                            className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-xs font-semibold px-3 py-2.5 rounded-xl whitespace-nowrap shrink-0 transition-colors min-h-11 flex items-center"
                        >
                            Get Started
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            aria-expanded={mobileMenuOpen}
                            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer shrink-0 min-h-11 min-w-11 flex items-center justify-center"
                        >
                            {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Panel */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                scrollToSection('verification-engine');
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-11 text-left w-full cursor-pointer"
                        >
                            <span>Features</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                        <Link
                            to="/how-to-use"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-11"
                        >
                            <span>How to Use</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <Link
                            to="/contact"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-11"
                        >
                            <span>Contact</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2">
                            <Link
                                to="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 py-3 text-center text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-11 flex items-center justify-center"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 py-3 text-center text-sm font-semibold rounded-xl bg-[#5b4fff] text-white hover:bg-[#4d40ef] transition-colors shadow-sm min-h-11 flex items-center justify-center"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center">

                {/* HERO SECTION */}
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12 sm:mb-16">
                    
                    {/* Live Tech Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-950/40 backdrop-blur-md mb-6 shadow-xs animate-fade-slide-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
                            The Coding LMS - LeetCode & Codeforces
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance text-zinc-900 dark:text-white animate-fade-slide-up [animation-delay:100ms]">
                        The Modern LMS for <br />
                        <span className="text-[#5b4fff] dark:text-[#968fff]">
                            Coding Bootcamps & Cohorts
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal animate-fade-slide-up [animation-delay:200ms] text-pretty">
                        Easily manage coding cohorts, verify homework solutions automatically, and track live student leaderboards across LeetCode and Codeforces without messy spreadsheets.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-8 animate-fade-slide-up [animation-delay:300ms]">
                        <Link 
                            to="/login" 
                            className="w-full sm:w-auto bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_0_28px_rgba(91,79,255,0.35)] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] min-h-12 shimmer-sweep interactive-press group"
                        >
                            <span>Start Free Classroom</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <button
                            type="button"
                            onClick={() => scrollToSection('app-canvas')}
                            className="w-full sm:w-auto bg-white dark:bg-[#111116] border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-white text-[15px] font-semibold px-8 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] min-h-12 interactive-press"
                        >
                            Explore Interactive Demo
                        </button>
                    </div>

                    {/* Trust and Velocity Strip */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 animate-fade-slide-up [animation-delay:400ms]">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs hover:border-amber-500/40 transition-colors cursor-default group">
                            <LightningIcon className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" weight="fill" />
                            <span>Automatic progress syncing</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs hover:border-emerald-500/40 transition-colors cursor-default group">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" weight="bold" />
                            <span>No student passwords needed</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs hover:border-[#5b4fff]/40 transition-colors cursor-default group">
                            <HeartIcon className="w-4 h-4 text-[#5b4fff] shrink-0 group-hover:scale-110 transition-transform" weight="fill" />
                            <span>100% free for teachers & mentors</span>
                        </div>
                    </div>
                </div>

                {/* HERO CENTERPIECE: AUTHENTIC LIVE WORKSTATION CANVAS */}
                <div id="app-canvas" className="w-full max-w-6xl mx-auto mb-24 sm:mb-32 scroll-mt-28">
                    <div className="rounded-3xl bg-white dark:bg-[#0f0f13] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden">
                        
                        {/* OS Window Header Bar */}
                        <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-100/70 dark:bg-[#15151b]/80">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block hover:opacity-100 transition-opacity" />
                                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block hover:opacity-100 transition-opacity" />
                                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block hover:opacity-100 transition-opacity" />
                                <span className="ml-3 text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                                    mentorsync.dev/classroom/super-42/leaderboard
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                                    <span>Real-Time Updates Active</span>
                                </span>
                            </div>
                        </div>

                        {/* Workstation Body: Split Sidebar & Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-140">
                            
                            {/* Left Mini-Sidebar */}
                            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:p-5 bg-zinc-50/50 dark:bg-[#121217]/50 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Active Classroom</p>
                                        <div className="p-3 rounded-xl bg-white dark:bg-[#18181f] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                                            <p className="font-bold text-xs text-zinc-900 dark:text-white">Super 42 Placement Track</p>
                                            <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-1">
                                                <span>42 Enrolled Students</span>
                                                <span className="font-semibold text-emerald-500">Week 4 Active</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Classroom Views</p>
                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => setCanvasTab('leaderboard')}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    canvasTab === 'leaderboard'
                                                        ? 'bg-[#5b4fff] text-white shadow-sm'
                                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <TrophyIcon className="w-4 h-4" weight="bold" />
                                                    Class Leaderboard
                                                </span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setCanvasTab('profile')}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    canvasTab === 'profile'
                                                        ? 'bg-[#5b4fff] text-white shadow-sm'
                                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <UsersIcon className="w-4 h-4" weight="bold" />
                                                    Student Profile
                                                </span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setCanvasTab('analytics')}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    canvasTab === 'analytics'
                                                        ? 'bg-[#5b4fff] text-white shadow-sm'
                                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <BrainIcon className="w-4 h-4" weight="bold" />
                                                    Skill Mastery
                                                </span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500">
                                    <span>Data Sync: </span>
                                    <strong className="text-emerald-500">Instant (Cached in memory)</strong>
                                </div>
                            </div>

                            {/* Main Canvas Area */}
                            <div className="lg:col-span-9 p-4 sm:p-6 flex flex-col justify-between">
                                
                                {/* TAB 1: COHORT LEADERBOARD */}
                                {canvasTab === 'leaderboard' && (
                                    <LeaderboardTabContent
                                        filteredStudents={filteredStudents}
                                        leaderboardSort={leaderboardSort}
                                        setLeaderboardSort={setLeaderboardSort}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        onSelectStudent={handleSelectStudentForProfile}
                                    />
                                )}

                                {/* TAB 2: STUDENT PROFILE VIEW */}
                                {canvasTab === 'profile' && (
                                    <ProfileTabContent
                                        selectedStudentId={selectedStudentId}
                                        setSelectedStudentId={setSelectedStudentId}
                                        profile={activeStudentProfile}
                                        hoveredHeatmapDay={hoveredHeatmapDay}
                                        setHoveredHeatmapDay={setHoveredHeatmapDay}
                                    />
                                )}

                                {/* TAB 3: CLASSROOM ANALYTICS */}
                                {canvasTab === 'analytics' && (
                                    <AnalyticsTabContent
                                        topicFilter={topicFilter}
                                        setTopicFilter={setTopicFilter}
                                        filteredTopics={filteredTopics}
                                        dispatchSuccess={dispatchSuccess}
                                        onDispatchRemedial={handleDispatchRemedial}
                                    />
                                )}

                                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                                    <span>Sync Schedule: Automatically refreshes every 15 minutes</span>
                                    <Link to="/login" className="text-[#5b4fff] font-bold hover:underline flex items-center gap-1">
                                        Open Full Dashboard <ArrowUpRightIcon className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ASYMMETRIC SECTION 1: AUTOMATED SUBMISSION VERIFICATION */}
                <div id="features" className="scroll-mt-28" />
                <section id="verification-engine" className="w-full max-w-6xl mx-auto mb-28 sm:mb-36 scroll-mt-28">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        
                        {/* Narrative Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                                No more manual checking. <br />
                                Verify solutions automatically.
                            </h2>

                            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                                Students simply submit their problem link. MentorSync checks public profiles to verify that the code was accepted, when it was solved, and runtime performance. No manual grading, no fake submissions.
                            </p>

                            <div className="space-y-3 pt-2 text-xs sm:text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Works with public profiles - students never share their passwords</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Confirms problem ID, accepted verdict, runtime, and submission recency</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Updates homework progress bars and grades in real time</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Verification Terminal Card */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xl interactive-card">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-5">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Try Submission Checker</p>
                                        <p className="text-[11px] text-zinc-500">Click a problem below to test how automatic verification works</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold border border-zinc-200 dark:border-zinc-700/60">
                                        POST /api/verify
                                    </span>
                                </div>

                                {/* Preset Selector Pills */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    {SAMPLE_VERIFICATIONS.map((ver) => (
                                        <button
                                            key={ver.id}
                                            type="button"
                                            onClick={() => setSelectedVerification(ver.id)}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 duration-150 ${
                                                selectedVerification === ver.id
                                                    ? 'bg-[#5b4fff]/10 border-[#5b4fff] shadow-xs ring-1 ring-[#5b4fff]/40'
                                                    : 'bg-zinc-50 dark:bg-[#181820] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            <p className={`text-[10px] font-bold ${ver.platform === 'LeetCode' ? 'text-[#ffa116]' : 'text-sky-500'}`}>
                                                {ver.platform} #{ver.problemId}
                                            </p>
                                            <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{ver.title}</p>
                                            <p className="text-[10px] text-zinc-500">{ver.runtime}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Run Simulation Trigger Bar */}
                                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-4">
                                    <div className="min-w-0 font-medium text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                                        https://{activeVerification.platform.toLowerCase()}.com/problems/{activeVerification.title.toLowerCase().replace(/\s+/g, '-')}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRunVerificationSim}
                                        disabled={isVerifyingSim}
                                        className="px-3.5 py-1.5 rounded-lg bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60 hover:-translate-y-0.5 active:scale-95 duration-150 shadow-xs hover:shadow-md group"
                                    >
                                        <ArrowsClockwiseIcon className={`w-3.5 h-3.5 ${isVerifyingSim ? 'animate-spin' : 'group-hover:rotate-90 transition-transform duration-300'}`} weight="bold" />
                                        <span>{isVerifyingSim ? 'Checking...' : 'Test Verification'}</span>
                                    </button>
                                </div>

                                {/* Terminal Console Output */}
                                <div className="p-4 rounded-2xl bg-zinc-950 font-medium text-xs text-emerald-400 border border-zinc-800 space-y-2 relative overflow-hidden">
                                    <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-800/80">
                                        <span className="flex items-center gap-1.5">
                                            <TerminalIcon className="w-4 h-4 text-emerald-400" />
                                            Live Verification Result
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleCopyPayload}
                                                className="text-[10px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 cursor-pointer"
                                                title="Copy payload"
                                            >
                                                {copiedPayload ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <CopyIcon className="w-3 h-3" />}
                                                <span>{copiedPayload ? 'Copied' : 'JSON'}</span>
                                            </button>
                                            <span className={`text-emerald-400 font-bold ${isVerifyingSim ? 'animate-pulse' : 'animate-scale-bounce'}`}>
                                                {isVerifyingSim ? 'CHECKING PROFILE...' : 'VERIFIED ACCEPTED'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300">
                                        &gt; Target: https://{activeVerification.platform.toLowerCase()}.com/problems/{activeVerification.title.toLowerCase().replace(/\s+/g, '-')}
                                    </p>
                                    <p className="text-zinc-400">
                                        &gt; Profile Query: Authenticated against public submission endpoint...
                                    </p>
                                    <p className="text-emerald-400 font-bold">
                                        &gt; Match Found: {activeVerification.title} ({activeVerification.difficulty}) • Runtime: {activeVerification.runtime} (Beats {activeVerification.beats})
                                    </p>
                                    <p className="text-emerald-300">
                                        &gt; Memory Allocation: {activeVerification.memory} • Status: Accepted
                                    </p>
                                    <p className="text-emerald-400/80">
                                        <span>&gt; Assignment Verified: Week 4 DSA Sprint (+10 pts awarded)</span>
                                        <span aria-hidden="true" className="inline-block w-2 h-3.5 bg-emerald-400 animate-live-cursor ml-1.5 align-middle" />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ASYMMETRIC SECTION 2: DUAL-PLATFORM INTEGRATION */}
                <section id="dual-telemetry" className="w-full max-w-6xl mx-auto mb-28 sm:mb-36 scroll-mt-28">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        
                        {/* Dual Platform Visual Card with SVG Sparklines */}
                        <div className="lg:col-span-7 order-2 lg:order-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg space-y-4 interactive-card group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-[#ffa116]" />
                                            <span className="font-bold text-sm text-zinc-900 dark:text-white">LeetCode Profile</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-[#ffa116]/10 text-[#ffa116] text-[11px] font-bold border border-[#ffa116]/20">Knight 1890</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight group-hover:text-[#ffa116] transition-colors">420 Solved</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Top 4.8% Global Contest Rating</p>
                                    </div>

                                    {/* SVG Sparkline for LeetCode Rating Trend */}
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                                            <span>Contest Progression</span>
                                            <span className="text-[#ffa116] font-semibold flex items-center gap-0.5">
                                                <TrendUpIcon className="w-3 h-3" />
                                                +270 pts
                                            </span>
                                        </div>
                                        <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 48" fill="none" aria-hidden="true" role="presentation">
                                            <defs>
                                                <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#ffa116" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#ffa116" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path 
                                                d="M0,40 Q30,36 60,30 T120,20 T170,12 T200,6" 
                                                fill="none" 
                                                stroke="#ffa116" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                            />
                                            <path 
                                                d="M0,40 Q30,36 60,30 T120,20 T170,12 T200,6 L200,48 L0,48 Z" 
                                                fill="url(#lcGrad)" 
                                            />
                                            <circle cx="200" cy="6" r="3.5" fill="#ffa116" className="animate-pulse" />
                                        </svg>
                                    </div>

                                    <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                            <span>Easy: 140</span>
                                            <span className="text-amber-500">Medium: 220</span>
                                            <span className="text-rose-500">Hard: 60</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg space-y-4 interactive-card group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-sky-500" />
                                            <span className="font-bold text-sm text-zinc-900 dark:text-white">Codeforces Profile</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 text-[11px] font-bold border border-sky-500/20">Specialist 1510</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight group-hover:text-sky-500 transition-colors">240 Solved</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Rated for Div. 2 Competitions</p>
                                    </div>

                                    {/* SVG Sparkline for Codeforces Rating Trend */}
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                                            <span>Rating Trajectory</span>
                                            <span className="text-sky-500 font-semibold flex items-center gap-0.5">
                                                <TrendUpIcon className="w-3 h-3" />
                                                +230 pts
                                            </span>
                                        </div>
                                        <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 48" fill="none" aria-hidden="true" role="presentation">
                                            <defs>
                                                <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path 
                                                d="M0,42 Q40,38 70,32 T130,22 T170,14 T200,8" 
                                                fill="none" 
                                                stroke="#0ea5e9" 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                            />
                                            <path 
                                                d="M0,42 Q40,38 70,32 T130,22 T170,14 T200,8 L200,48 L0,48 Z" 
                                                fill="url(#cfGrad)" 
                                            />
                                            <circle cx="200" cy="8" r="3.5" fill="#0ea5e9" className="animate-pulse" />
                                        </svg>
                                    </div>

                                    <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                                            <span>Div. 2 Participant</span>
                                            <span className="text-sky-500 font-bold">Max Rating: 1540</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-200/80 dark:border-zinc-800 interactive-card">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400">Combined Dual Platform Metric</p>
                                        <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">660 Total Unique Problems Solved</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs shadow-xs">
                                        <FireIcon className="w-4 h-4 text-amber-500 animate-flame" weight="fill" />
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">64 Days Active Streak</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Narrative Column */}
                        <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                                One unified profile for <br />
                                LeetCode and Codeforces.
                            </h2>

                            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                                Students practice for interviews on LeetCode and build speed on Codeforces. MentorSync combines both into a single profile, showing total problems solved, contest ratings, and daily streaks in one place.
                            </p>

                            <div className="space-y-3 pt-2 text-xs sm:text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Combines solve counts so you see the complete picture</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Shows official contest ratings and badges automatically</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Upcoming contest calendar so students never miss a round</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ASYMMETRIC SECTION 3: TOPIC COMPETENCY ANALYTICS */}
                <section className="w-full max-w-6xl mx-auto mb-28 sm:mb-36">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        
                        {/* Narrative Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                                Find student weak spots <br />
                                before interview season.
                            </h2>

                            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                                See which topics your students find easy and where they get stuck. If your batch struggles with Dynamic Programming or Graphs, you can quickly assign targeted practice problems to help them improve.
                            </p>

                            <div className="space-y-3 pt-2 text-xs sm:text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Clear topic completion percentages for the whole batch</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Identify struggling students early to give them extra help</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Download complete student progress reports to CSV anytime</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Topic Card with Benchmark Guideline */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xl space-y-4 interactive-card">
                                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white">Batch Topic Proficiency</p>
                                        <p className="text-[11px] text-zinc-500">Combined data for Super 42 (42 students) - 75% Target Goal</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500 font-bold text-xs border border-indigo-500/20">
                                        Analytics Active
                                    </span>
                                </div>

                                <div className="space-y-3.5 pt-2">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Dynamic Programming (0/1 Knapsack, Memoization)</span>
                                            <span className="text-rose-500">42% (Critical Weakness)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
                                            <div className="bg-rose-500 h-full w-[42%] transition-all duration-700 ease-out" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Graphs & Trees (BFS, DFS, Dijkstra)</span>
                                            <span className="text-amber-500">58% (Developing)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
                                            <div className="bg-amber-500 h-full w-[58%] transition-all duration-700 ease-out" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Binary Search & Sliding Window</span>
                                            <span className="text-emerald-500">84% (Strong)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
                                            <div className="bg-emerald-500 h-full w-[84%] transition-all duration-700 ease-out" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Arrays, Strings & HashMaps</span>
                                            <span className="text-emerald-500">92% (Mastered)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
                                            <div className="bg-emerald-500 h-full w-[92%] transition-all duration-700 ease-out" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span>Target goal: 75% for campus placements</span>
                                    </span>
                                    <span className="text-[#5b4fff] font-semibold">18 students recommended for extra practice</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ARCHITECTURAL BENTO HIGHLIGHTS */}
                <section className="w-full max-w-6xl mx-auto mb-28 sm:mb-36">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Card 1: Redis Caching */}
                        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between interactive-card group">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <DatabaseIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-emerald-500 transition-colors">Fast &amp; Scalable Performance</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                                    High-speed in-memory caching ensures student leaderboards, submissions, and profiles load instantly, even with large classes.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-max group-hover:bg-emerald-500/20 transition-colors">
                                Sub-10ms Response Time
                            </span>
                        </div>

                        {/* Card 2: 1-Click CSV Imports */}
                        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between interactive-card group">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] mb-6 border border-[#5b4fff]/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    <FileSpreadsheet className="w-6 h-6" weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-[#5b4fff] transition-colors">Easy Student Batch Import</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                                    Import your whole classroom in seconds using a CSV file from Google Sheets or Excel. Usernames and profile links are organized automatically.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-[#5b4fff] dark:text-[#968fff] bg-[#5b4fff]/10 px-3 py-1.5 rounded-xl border border-[#5b4fff]/20 w-max group-hover:bg-[#5b4fff]/20 transition-colors">
                                Google Sheets &amp; Excel Ready
                            </span>
                        </div>

                        {/* Card 3: Live Contest Radar */}
                        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between interactive-card group">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-amber-500/10 text-amber-500 mb-6 border border-amber-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                    <ClockIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-amber-500 transition-colors">Contest Calendar &amp; Reminders</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-4">
                                    Keep students motivated and active with built-in countdowns and reminders for official LeetCode contests and Codeforces rounds.
                                </p>
                                <div className="space-y-1.5 mb-4 text-xs">
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarBlankIcon className="w-3.5 h-3.5 text-amber-500" />
                                            <span>LC Weekly Contest 525</span>
                                        </span>
                                        <span className="font-semibold text-amber-500">in 2d 14h</span>
                                    </div>
                                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                                        <span className="flex items-center gap-1.5">
                                            <CalendarBlankIcon className="w-3.5 h-3.5 text-sky-500" />
                                            <span>CF Round 1129 (Div. 2)</span>
                                        </span>
                                        <span className="font-semibold text-sky-500">in 4d 08h</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 w-max group-hover:bg-amber-500/20 transition-colors">
                                Live Contest Calendar
                            </span>
                        </div>
                    </div>
                </section>

                {/* PRE-FOOTER CALL TO ACTION */}
                <section className="w-full max-w-5xl mx-auto rounded-3xl bg-white dark:bg-linear-to-b dark:from-[#141418] dark:to-[#0a0a0c] text-zinc-900 dark:text-white p-8 sm:p-14 text-center border border-zinc-200/90 dark:border-zinc-800 shadow-2xl relative overflow-hidden interactive-card">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(91,79,255,0.08),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(91,79,255,0.22),transparent)] pointer-events-none animate-pulse-slow" />
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-balance">
                            Ready to Upgrade Your Coding Classroom?
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                            Join mentors, teachers, and coding clubs using MentorSync to track student progress, verify homework, and build better coders.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link 
                                to="/login" 
                                className="w-full sm:w-auto bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_0_24px_rgba(91,79,255,0.3)] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.98] min-h-12 flex items-center justify-center shimmer-sweep interactive-press"
                            >
                                Start for Free
                            </Link>
                            <Link 
                                to="/how-to-use" 
                                className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-white border border-zinc-300 dark:border-white/20 text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all min-h-12 flex items-center justify-center interactive-press"
                            >
                                How to Use Guide
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer matching HowToUsePage with MENTORSYNC Watermark */}
            <footer className="relative w-full overflow-hidden flex flex-col items-center justify-end z-10 pt-20 pb-8 sm:pb-10 border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/90 dark:bg-[#080808]/90 backdrop-blur-sm transition-colors duration-200">
                <div className="w-full max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start gap-12 mb-24 relative z-20 pointer-events-auto">
                    <div className="max-w-xs">
                        <div className="mb-6">
                            <BrandLogo size="md" theme="auto" asLink={false} />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed">
                            The modern learning management system for coding bootcamps, college clubs, and mentors.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
                        <div>
                            <h4 className="text-zinc-900 dark:text-white font-semibold mb-3 tracking-tight text-sm">Resources</h4>
                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <li>
                                    <Link to="/how-to-use" className="hover:text-zinc-900 dark:hover:text-white transition-colors">How to Use Guide</Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Support & Contact</Link>
                                </li>
                                <li>
                                    <Link to="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Sign In</Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-zinc-900 dark:text-white font-semibold mb-3 tracking-tight text-sm">Open Source</h4>
                            <a href="https://github.com/varunkushwah31/Leetcode-Tracker-Frontend" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-4 py-2 rounded-xl text-sm font-medium transition-all group outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] shadow-xs">
                                <Code2Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                                <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Star on GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-5 sm:bottom-7.5 left-1/2 -translate-x-1/2 w-[200%] sm:w-[120%] text-center whitespace-nowrap pointer-events-none">
                    <h1 className="text-[20vw] sm:text-[14vw] font-black tracking-tighter text-zinc-900 dark:text-white opacity-[0.06] dark:opacity-[0.02] select-none uppercase leading-none">
                        MENTORSYNC
                    </h1>
                </div>

                <div className="relative z-20 text-zinc-500 dark:text-zinc-600 text-xs sm:text-sm font-medium tracking-wide mt-auto pointer-events-auto flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl px-4 sm:px-6">
                    <span>(C) {new Date().getFullYear()} MentorSync. Built for educators • Crafted in India.</span>
                    <span className="mt-2 sm:mt-0 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> All systems operational</span>
                </div>
            </footer>
        </div>
    );
}
