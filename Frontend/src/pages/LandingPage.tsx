import { useState } from 'react';
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
    ArrowSquareOutIcon,
    FileCsvIcon as FileSpreadsheet,
    TerminalIcon,
    ClockIcon,
    BrainIcon,
    ArrowUpRightIcon
} from '@phosphor-icons/react';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';

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
        name: 'Alex Rivera',
        handle: 'alex_r',
        lcSolved: 420,
        cfSolved: 240,
        lcRating: 1890,
        cfRating: 1510,
        cfRank: 'Specialist',
        lcRank: 'Knight',
        streak: 64
    },
    {
        id: '2',
        name: 'Sarah Chen',
        handle: 'sarah_c',
        lcSolved: 395,
        cfSolved: 215,
        lcRating: 1940,
        cfRating: 1480,
        cfRank: 'Specialist',
        lcRank: 'Guardian',
        streak: 52
    },
    {
        id: '3',
        name: 'Dev Patel',
        handle: 'dev_p',
        lcSolved: 310,
        cfSolved: 280,
        lcRating: 1750,
        cfRating: 1620,
        cfRank: 'Expert',
        lcRank: 'Knight',
        streak: 48
    },
    {
        id: '4',
        name: 'Priya Sharma',
        handle: 'priya_s',
        lcSolved: 360,
        cfSolved: 190,
        lcRating: 1810,
        cfRating: 1390,
        cfRank: 'Pupil',
        lcRank: 'Knight',
        streak: 41
    }
];

interface SampleVerification {
    id: string;
    title: string;
    platform: 'LeetCode' | 'Codeforces';
    problemId: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | '800' | '1400';
    status: 'Verified (100% Runtime)' | 'Accepted';
    timestamp: string;
    runtime: string;
}

const SAMPLE_VERIFICATIONS: SampleVerification[] = [
    {
        id: 'v1',
        title: 'Course Schedule II',
        platform: 'LeetCode',
        problemId: '210',
        difficulty: 'Medium',
        status: 'Verified (100% Runtime)',
        timestamp: 'Just now',
        runtime: '12ms'
    },
    {
        id: 'v2',
        title: 'Watermelon',
        platform: 'Codeforces',
        problemId: '4A',
        difficulty: '800',
        status: 'Accepted',
        timestamp: '2m ago',
        runtime: '30ms'
    },
    {
        id: 'v3',
        title: 'LRU Cache',
        platform: 'LeetCode',
        problemId: '146',
        difficulty: 'Medium',
        status: 'Verified (100% Runtime)',
        timestamp: '5m ago',
        runtime: '44ms'
    }
];

export function LandingPage() {
    const [canvasTab, setCanvasTab] = useState<'leaderboard' | 'profile' | 'analytics'>('leaderboard');
    const [leaderboardSort, setLeaderboardSort] = useState<'total' | 'lc' | 'cf' | 'streak'>('total');
    const [selectedVerification, setSelectedVerification] = useState<string>('v1');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        const section = document.getElementById(id);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const sortedStudents = [...SAMPLE_LEADERBOARD].sort((a, b) => {
        if (leaderboardSort === 'lc') return b.lcRating - a.lcRating;
        if (leaderboardSort === 'cf') return b.cfRating - a.cfRating;
        if (leaderboardSort === 'streak') return b.streak - a.streak;
        return (b.lcSolved + b.cfSolved) - (a.lcSolved + a.cfSolved);
    });

    const activeVerification = SAMPLE_VERIFICATIONS.find(v => v.id === selectedVerification) || SAMPLE_VERIFICATIONS[0];

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white selection:bg-[#5b4fff] selection:text-white overflow-x-hidden font-sans relative transition-colors duration-200">

            {/* Background Base matching Signup / Signin */}
            <div className="fixed inset-0 z-0 bg-[#f8fafc] dark:bg-[#050505] transition-colors duration-200 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] bg-fixed pointer-events-none" />
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
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
                        <Link 
                            to="/how-to-use" 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors min-h-[44px] flex items-center"
                        >
                            Documentation
                        </Link>
                        <Link 
                            to="/contact" 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors min-h-[44px] flex items-center"
                        >
                            Support
                        </Link>
                        <Link 
                            to="/login" 
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] rounded-lg px-2 min-h-[44px] flex items-center"
                        >
                            Sign In
                        </Link>
                        <ThemeToggle className="bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border-zinc-200 dark:border-white/10 min-h-[44px] min-w-[44px]" />
                        <Link 
                            to="/login" 
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_0_24px_rgba(91,79,255,0.3)] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] flex items-center shimmer-sweep interactive-press"
                        >
                            Get Started
                        </Link>
                    </nav>

                    {/* Mobile Controls */}
                    <div className="flex md:hidden items-center gap-2 shrink-0">
                        <ThemeToggle className="bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 min-h-[44px] min-w-[44px]" />
                        <Link
                            to="/login"
                            className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-xs font-semibold px-3 py-2.5 rounded-xl whitespace-nowrap shrink-0 transition-colors min-h-[44px] flex items-center"
                        >
                            Get Started
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            aria-expanded={mobileMenuOpen}
                            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                            {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Panel */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-2">
                        <Link
                            to="/how-to-use"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-[44px]"
                        >
                            <span>Documentation</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <Link
                            to="/contact"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-[44px]"
                        >
                            <span>Support</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-2">
                            <Link
                                to="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 py-3 text-center text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors min-h-[44px] flex items-center justify-center"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex-1 py-3 text-center text-sm font-semibold rounded-xl bg-[#5b4fff] text-white hover:bg-[#4d40ef] transition-colors shadow-sm min-h-[44px] flex items-center justify-center"
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
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-950/40 backdrop-blur-md mb-6 shadow-xs">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold tracking-wider text-indigo-700 dark:text-indigo-300 uppercase">
                            Dual-Platform Engine • LeetCode & Codeforces
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 text-balance text-zinc-900 dark:text-white">
                        The Engineering OS for <br />
                        <span className="text-[#5b4fff] dark:text-[#968fff]">Coding Bootcamps & Cohorts.</span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
                        Automate submission verification, monitor dual-platform contest ratings, and track live student leaderboards across LeetCode and Codeforces without manual spreadsheets.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Link 
                            to="/login" 
                            className="w-full sm:w-auto bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_0_28px_rgba(91,79,255,0.35)] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] min-h-[48px] shimmer-sweep interactive-press"
                        >
                            Start Free Cohort <ChevronRight className="w-4 h-4" />
                        </Link>

                        <button
                            type="button"
                            onClick={() => scrollToSection('app-canvas')}
                            className="w-full sm:w-auto bg-white dark:bg-[#111111] border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-white text-[15px] font-semibold px-8 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer hover:-translate-y-0.5 min-h-[48px] interactive-press"
                        >
                            View Live Sandbox
                        </button>
                    </div>
                </div>

                {/* HERO CENTERPIECE: AUTHENTIC LIVE WORKSTATION CANVAS */}
                <div id="app-canvas" className="w-full max-w-6xl mx-auto mb-24 sm:mb-32 scroll-mt-28">
                    <div className="rounded-3xl bg-white dark:bg-[#0f0f13] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden">
                        
                        {/* OS Window Header Bar */}
                        <div className="px-4 sm:px-6 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-100/70 dark:bg-[#15151b]/80">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                                <span className="ml-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                                    app.mentorsync.com/cohort/batch-24/leaderboard
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Live WebSocket Connected
                                </span>
                            </div>
                        </div>

                        {/* Workstation Body: Split Sidebar & Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-140">
                            
                            {/* Left Mini-Sidebar */}
                            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:p-5 bg-zinc-50/50 dark:bg-[#121217]/50 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Classroom Cohort</p>
                                        <div className="p-3 rounded-xl bg-white dark:bg-[#18181f] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                                            <p className="font-bold text-xs text-zinc-900 dark:text-white">Batch 2024 Placement Track</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5">64 Enrolled Students</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Workstation Views</p>
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
                                                    Cohort Leaderboard
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
                                                    Student Profile View
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
                                                    Topic Competency
                                                </span>
                                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500">
                                    <span>Redis Cache Hit Rate: </span>
                                    <strong className="text-emerald-500">98.6% (4ms)</strong>
                                </div>
                            </div>

                            {/* Main Canvas Area */}
                            <div className="lg:col-span-9 p-4 sm:p-6 flex flex-col justify-between">
                                
                                {/* TAB 1: COHORT LEADERBOARD */}
                                {canvasTab === 'leaderboard' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                                            <div>
                                                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Active Cohort Standings</h3>
                                                <p className="text-xs text-zinc-500">Real-time rank recalculation combining LeetCode and Codeforces</p>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="text-zinc-500 font-medium mr-1">Sort:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setLeaderboardSort('total')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                                        leaderboardSort === 'total' 
                                                            ? 'bg-[#5b4fff] text-white' 
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                >
                                                    Total Solves
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLeaderboardSort('lc')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                                        leaderboardSort === 'lc' 
                                                            ? 'bg-[#ffa116] text-white' 
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                >
                                                    LC Rating
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLeaderboardSort('cf')}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                                        leaderboardSort === 'cf' 
                                                            ? 'bg-sky-500 text-white' 
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                                    }`}
                                                >
                                                    CF Rating
                                                </button>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden bg-white dark:bg-[#14141a]">
                                            {sortedStudents.map((student, idx) => (
                                                <div key={student.id} className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-[#1c1c24]/50 transition-colors">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className={`w-5 text-center font-bold text-xs ${idx === 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                                                            #{idx + 1}
                                                        </span>
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0">
                                                            {student.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">{student.name}</p>
                                                            <p className="text-[11px] text-zinc-500">@{student.handle}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                                                        <span className="font-bold text-zinc-900 dark:text-white">
                                                            {student.lcSolved + student.cfSolved} Solved
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-[#ffa116]/10 text-[#ffa116] font-semibold text-[11px]">
                                                            LC {student.lcRating} ({student.lcRank})
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-semibold text-[11px]">
                                                            CF {student.cfRating} ({student.cfRank})
                                                        </span>
                                                        <span className="flex items-center gap-1 font-semibold text-amber-500 text-[11px]">
                                                            <FireIcon className="w-3.5 h-3.5" weight="fill" />
                                                            {student.streak}d
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: STUDENT PROFILE VIEW */}
                                {canvasTab === 'profile' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center">
                                                    SC
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Sarah Chen</h3>
                                                    <p className="text-xs text-zinc-500">LeetCode: sarah_c • Codeforces: chen_s</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                                Verified Student Profile
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                                <p className="text-[11px] font-semibold text-zinc-500">Solved Distribution</p>
                                                <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">610 Problems</p>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden flex">
                                                    <div className="bg-emerald-500 h-full w-[25%]" title="Easy" />
                                                    <div className="bg-amber-500 h-full w-[55%]" title="Medium" />
                                                    <div className="bg-rose-500 h-full w-[20%]" title="Hard" />
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                                <p className="text-[11px] font-semibold text-zinc-500">LeetCode Contest</p>
                                                <p className="text-xl font-bold text-[#ffa116] mt-1">1,940</p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">Top 4.2% • Guardian Rank</p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                                <p className="text-[11px] font-semibold text-zinc-500">Codeforces Rating</p>
                                                <p className="text-xl font-bold text-sky-500 mt-1">1,480</p>
                                                <p className="text-[11px] text-zinc-400 mt-0.5">Specialist • Div. 2</p>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                            <div className="flex items-center justify-between mb-2 text-xs">
                                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">52-Day Technical Consistency Heatmap</span>
                                                <span className="text-emerald-500 font-bold">428 Submissions This Year</span>
                                            </div>
                                            <div className="grid grid-cols-14 gap-1.5 pt-1">
                                                {Array.from({ length: 42 }).map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`h-4 rounded-[3px] ${
                                                            i % 3 === 0 ? 'bg-emerald-500' : i % 5 === 0 ? 'bg-emerald-600/70' : 'bg-zinc-200 dark:bg-zinc-800'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: CLASSROOM ANALYTICS */}
                                {canvasTab === 'analytics' && (
                                    <div className="space-y-4">
                                        <div className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Cohort Topic Competency Matrix</h3>
                                            <p className="text-xs text-zinc-500">Identifies algorithmic weakness areas across all 64 enrolled students</p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                                <div className="flex justify-between items-center text-xs mb-1.5">
                                                    <span className="font-bold text-zinc-900 dark:text-white">Dynamic Programming (Knapsack, 2D Grid)</span>
                                                    <span className="text-rose-500 font-bold text-[11px] px-2 py-0.5 rounded bg-rose-500/10">Critical Weakness (42%)</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-rose-500 h-full w-[42%]" />
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                                <div className="flex justify-between items-center text-xs mb-1.5">
                                                    <span className="font-bold text-zinc-900 dark:text-white">Graph Traversals (BFS / DFS / Topological Sort)</span>
                                                    <span className="text-amber-500 font-bold text-[11px] px-2 py-0.5 rounded bg-amber-500/10">Developing (58%)</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-amber-500 h-full w-[58%]" />
                                                </div>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#14141a] border border-zinc-200/80 dark:border-zinc-800/80">
                                                <div className="flex justify-between items-center text-xs mb-1.5">
                                                    <span className="font-bold text-zinc-900 dark:text-white">Arrays & Two Pointers</span>
                                                    <span className="text-emerald-500 font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-500/10">Proficient (92%)</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full w-[92%]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                                    <span>Sync Schedule: Automatic 15-minute background polling</span>
                                    <Link to="/login" className="text-[#5b4fff] font-bold hover:underline flex items-center gap-1">
                                        Open Full Dashboard <ArrowUpRightIcon className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ASYMMETRIC SECTION 1: AUTOMATED SUBMISSION VERIFICATION */}
                <section id="verification-engine" className="w-full max-w-6xl mx-auto mb-28 sm:mb-36 scroll-mt-28">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        
                        {/* Narrative Column */}
                        <div className="lg:col-span-5 space-y-6">
                            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
                                Zero spreadsheet toil. <br />
                                Every solution verified live.
                            </h2>

                            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                                Students submit their solution URL. MentorSync queries live LeetCode and Codeforces profile endpoints to confirm problem ID, accepted status, runtime percentile, and timestamp. False claims and plagiarism are eliminated instantly.
                            </p>

                            <div className="space-y-3 pt-2 text-xs sm:text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Scrapes official public submission feeds directly without student passwords</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Validates solution acceptance, runtime beats percentage, and submission recency</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Automatically syncs classroom assignment progress bars and grading matrices</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Verification Terminal Card */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xl">
                                <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-5">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Interactive Submission Tester</p>
                                        <p className="text-[11px] text-zinc-500">Select a problem to simulate the automated scraper</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-mono">
                                        POST /api/verify
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
                                    {SAMPLE_VERIFICATIONS.map((ver) => (
                                        <button
                                            key={ver.id}
                                            type="button"
                                            onClick={() => setSelectedVerification(ver.id)}
                                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                selectedVerification === ver.id
                                                    ? 'bg-[#5b4fff]/10 border-[#5b4fff]'
                                                    : 'bg-zinc-50 dark:bg-[#181820] border-zinc-200 dark:border-zinc-800'
                                            }`}
                                        >
                                            <p className={`text-[11px] font-bold ${ver.platform === 'LeetCode' ? 'text-[#ffa116]' : 'text-sky-500'}`}>
                                                {ver.platform}
                                            </p>
                                            <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{ver.title}</p>
                                            <p className="text-[10px] text-zinc-500">{ver.runtime}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 rounded-2xl bg-zinc-950 font-mono text-xs text-emerald-400 border border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-800/80">
                                        <span className="flex items-center gap-1.5">
                                            <TerminalIcon className="w-4 h-4 text-emerald-400" />
                                            Live Verification Stream
                                        </span>
                                        <span className="text-emerald-400 font-bold">200 OK (8ms)</span>
                                    </div>
                                    <p className="text-zinc-300">
                                        &gt; Target: https://{activeVerification.platform.toLowerCase()}.com/problems/{activeVerification.title.toLowerCase().replace(/\s+/g, '-')}
                                    </p>
                                    <p className="text-zinc-400">
                                        &gt; Status: Querying recent accepted submissions for cohort student...
                                    </p>
                                    <p className="text-emerald-400 font-bold">
                                        &gt; Match Found: {activeVerification.title} ({activeVerification.difficulty}) • Runtime: {activeVerification.runtime}
                                    </p>
                                    <p className="text-emerald-300">
                                        &gt; Assignment Verified: Week 4 DSA Placement Sprint (+10 pts)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ASYMMETRIC SECTION 2: DUAL-PLATFORM INTEGRATION */}
                <section id="dual-telemetry" className="w-full max-w-6xl mx-auto mb-28 sm:mb-36 scroll-mt-28">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        
                        {/* Dual Platform Visual Card */}
                        <div className="lg:col-span-7 order-2 lg:order-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-[#ffa116]" />
                                            <span className="font-bold text-sm text-zinc-900 dark:text-white">LeetCode Profile</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-[#ffa116]/10 text-[#ffa116] text-[11px] font-bold">Knight 1890</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">420 Solved</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Top 4.8% Global Contest Rating</p>
                                    </div>
                                    <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                                            <span>Easy: 140</span>
                                            <span>Medium: 220</span>
                                            <span className="text-rose-500">Hard: 60</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-sky-500" />
                                            <span className="font-bold text-sm text-zinc-900 dark:text-white">Codeforces Profile</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 text-[11px] font-bold">Specialist 1510</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">240 Solved</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Rated for Div. 2 Competitions</p>
                                    </div>
                                    <div className="space-y-1.5 text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
                                        <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                                            <span>Div. 2 Participant</span>
                                            <span className="text-sky-500 font-bold">Max Rating: 1540</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 p-5 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-800">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-zinc-400">Combined Dual Platform Metric</p>
                                        <p className="text-2xl font-extrabold text-white">660 Total Unique Problems Solved</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-2 rounded-xl border border-zinc-700 text-xs">
                                        <FireIcon className="w-4 h-4 text-amber-500" weight="fill" />
                                        <span>64 Days Active Streak</span>
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
                                Most serious coding students practice on both LeetCode for technical interview rounds and Codeforces for competitive speed. MentorSync bridges the gap, tracking ratings, solve counts, and streaks under one unified profile.
                            </p>

                            <div className="space-y-3 pt-2 text-xs sm:text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Unified solved count prevents duplicated problems across platforms</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Live official contest ratings and rank badges (Knight, Guardian, Specialist)</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Upcoming contest radar with automated calendar reminders</span>
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
                                Spot cohort weaknesses <br />
                                before placement exams.
                            </h2>

                            <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                                MentorSync analyzes student solve tags across 40+ algorithmic topics. Instantly see when your cohort is struggling with Dynamic Programming, Graphs, or Binary Trees, and assign targeted problem sets with one click.
                            </p>

                            <div className="space-y-3 pt-2 text-xs sm:text-sm">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Automated topic proficiency percentages across all enrolled students</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Flag critical weaknesses early to prevent placement interview dropouts</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" weight="bold" />
                                    <span className="text-zinc-700 dark:text-zinc-300">Export 2D student-assignment completion matrix directly to CSV</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Topic Card */}
                        <div className="lg:col-span-7">
                            <div className="rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-xl space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                                    <div>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white">Cohort Topic Proficiency Analysis</p>
                                        <p className="text-[11px] text-zinc-500">Aggregated across Batch 2024 (64 students)</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-500 font-bold text-xs">
                                        Analytics Active
                                    </span>
                                </div>

                                <div className="space-y-3.5 pt-2">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Dynamic Programming (0/1 Knapsack, Memoization)</span>
                                            <span className="text-rose-500">42% (Critical Weakness)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-rose-500 h-full w-[42%]" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Graphs & Trees (BFS, DFS, Dijkstra)</span>
                                            <span className="text-amber-500">58% (Developing)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full w-[58%]" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Binary Search & Sliding Window</span>
                                            <span className="text-emerald-500">84% (Strong)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full w-[84%]" />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold mb-1 text-zinc-800 dark:text-zinc-200">
                                            <span>Arrays, Strings & HashMaps</span>
                                            <span className="text-emerald-500">92% (Mastered)</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full w-[92%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ARCHITECTURAL BENTO HIGHLIGHTS */}
                <section className="w-full max-w-6xl mx-auto mb-28 sm:mb-36">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Card 1: Redis Caching */}
                        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between interactive-card">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20">
                                    <DatabaseIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Redis Telemetry Cluster</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                                    Equipped with multi-region Redis caching. Protects upstream APIs from rate limits and delivers sub-10ms query times for large cohorts.
                                </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-max">
                                Cache Hit Latency: 4ms
                            </span>
                        </div>

                        {/* Card 2: 1-Click CSV Imports */}
                        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between interactive-card">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] mb-6 border border-[#5b4fff]/20">
                                    <FileSpreadsheet className="w-6 h-6" weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">1-Click CSV Roster Sync</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                                    Upload CSV files exported from Google Sheets or Google Classroom. URLs and handles are sanitized and mapped into classrooms automatically.
                                </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#5b4fff] dark:text-[#968fff] bg-[#5b4fff]/10 px-3 py-1.5 rounded-xl border border-[#5b4fff]/20 w-max">
                                Auto URL Regex Extraction
                            </span>
                        </div>

                        {/* Card 3: Live Contest Radar */}
                        <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#111116] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between interactive-card">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-amber-500/10 text-amber-500 mb-6 border border-amber-500/20">
                                    <ClockIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Integrated Contest Radar</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">
                                    Never let students miss official LeetCode Weekly contests or Codeforces Div. 2/3 rounds with built-in countdowns and reminders.
                                </p>
                            </div>
                            <span className="font-mono text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 w-max">
                                Synchronized Calendars
                            </span>
                        </div>
                    </div>
                </section>

                {/* PRE-FOOTER CALL TO ACTION */}
                <section className="w-full max-w-5xl mx-auto rounded-3xl bg-linear-to-b from-zinc-900 to-zinc-950 dark:from-[#141418] dark:to-[#0a0a0c] text-white p-8 sm:p-14 text-center border border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(91,79,255,0.22),transparent)] pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-balance">
                            Ready to Streamline Your Coding Cohorts?
                        </h2>
                        <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                            Join educators and competitive programmers using MentorSync to automate submission verification and track growth natively.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link 
                                to="/login"
                                className="w-full sm:w-auto bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_0_24px_rgba(91,79,255,0.3)] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 min-h-[48px] flex items-center justify-center shimmer-sweep interactive-press"
                            >
                                Start for Free
                            </Link>
                            <Link 
                                to="/how-to-use"
                                className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all min-h-[48px] flex items-center justify-center interactive-press"
                            >
                                Read Documentation
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative w-full z-10 pt-16 pb-10 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/90 dark:bg-[#080808]/90 backdrop-blur-sm transition-colors duration-200">
                <div className="w-full max-w-7xl px-4 sm:px-6 mx-auto flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
                    <div className="max-w-xs">
                        <div className="mb-4">
                            <BrandLogo size="md" theme="auto" asLink={false} />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                            The educational operating system for coding bootcamps. Automated progress and contest tracking for LeetCode and Codeforces.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-10 sm:gap-14">
                        <div>
                            <h4 className="text-zinc-900 dark:text-white font-semibold mb-3 text-sm tracking-tight">Platform</h4>
                            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                                <li>
                                    <Link to="/how-to-use" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Documentation</Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Support & Contact</Link>
                                </li>
                                <li>
                                    <Link to="/login" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Sign In</Link>
                                </li>
                                <li>
                                    <Link to="/register" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Create Account</Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-zinc-900 dark:text-white font-semibold mb-3 text-sm tracking-tight">Repository</h4>
                            <a 
                                href="https://github.com/varunkushwah31/Leetcode-Tracker-Frontend" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm hover:-translate-y-0.5 text-zinc-800 dark:text-zinc-200 min-h-[44px]"
                            >
                                <Code2Icon className="w-4 h-4 text-zinc-500" />
                                <span>Star on GitHub</span>
                                <ArrowSquareOutIcon className="w-3.5 h-3.5 text-zinc-400" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-7xl px-4 sm:px-6 mx-auto pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 gap-3">
                    <span>(C) {new Date().getFullYear()} MentorSync. All rights reserved.</span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        All systems operational
                    </span>
                </div>
            </footer>
        </div>
    );
}