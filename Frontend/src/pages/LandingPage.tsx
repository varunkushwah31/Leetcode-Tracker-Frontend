import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    UsersIcon,
    CaretRightIcon as ChevronRight,
    CaretDownIcon,
    CheckCircleIcon,
    TargetIcon,
    MedalIcon as Award,
    CodeIcon as Code2Icon,
    ListIcon as MenuIcon,
    XIcon,
    ShieldCheckIcon,
    ChartLineUpIcon,
    DatabaseIcon,
    FireIcon,
    TrophyIcon,
    ArrowSquareOutIcon
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

const FAQS = [
    {
        question: 'How does automated submission verification work without student passwords?',
        answer: 'MentorSync connects directly to public LeetCode and Codeforces endpoints. When a student enters their problem URL or submits a solution, the system queries the live submission history for that handle, confirming problem ID, timestamp, and accepted status within milliseconds.'
    },
    {
        question: 'Can instructors bulk import entire student cohorts from CSV or Google Sheets?',
        answer: 'Yes. Instructors can upload standard CSV files containing student names, emails, LeetCode handles, and Codeforces usernames. The system automatically parses handles, validates profiles, and assigns students directly to designated classroom cohorts.'
    },
    {
        question: 'How are dual-platform rankings and solve totals aggregated?',
        answer: 'The platform aggregates total unique solved counts from both LeetCode and Codeforces into a unified score. It also tracks individual peak contest ratings (e.g., LeetCode Knight/Guardian and Codeforces Specialist/Expert) so instructors can sort by either platform or overall performance.'
    },
    {
        question: 'How does Redis caching protect against external rate limits?',
        answer: 'MentorSync utilizes an enterprise-grade multi-region Redis cache cluster. Profile statistics, contest histories, and classroom analytics are cached with intelligent TTLs, ensuring sub-10ms query times and isolating upstream APIs from burst traffic.'
    }
];

export function LandingPage() {
    const [activeTab, setActiveTab] = useState<'mentor' | 'student'>('mentor');
    const [demoMode, setDemoMode] = useState<'leaderboard' | 'verifier' | 'radar'>('leaderboard');
    const [leaderboardSort, setLeaderboardSort] = useState<'total' | 'lc' | 'cf' | 'streak'>('total');
    const [selectedVerification, setSelectedVerification] = useState<string>('v1');
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToFeatures = () => {
        setMobileMenuOpen(false);
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
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

            {/* Background Base with Theme Adaptation */}
            <div className="fixed inset-0 z-0 bg-[#f8fafc] dark:bg-[#050505] transition-colors duration-200 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] bg-fixed opacity-70 dark:opacity-100 pointer-events-none" />
                <AmbientGlow />
            </div>

            {/* Mobile Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 dark:bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Floating Navigation Dock */}
            <header className="fixed top-4 sm:top-6 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] max-w-5xl z-50 rounded-2xl bg-white/95 dark:bg-[#0d0d0f]/90 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 shadow-lg px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col transition-all">
                <div className="flex items-center justify-between w-full">
                    <BrandLogo size="responsive" theme="auto" />

                    {/* Desktop Navigation */}
                    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
                        <button
                            type="button"
                            onClick={scrollToFeatures}
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center"
                        >
                            Features
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const demo = document.getElementById('interactive-demo');
                                demo?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center"
                        >
                            Live Demo
                        </button>
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
                            className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] flex items-center"
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
                        <button
                            type="button"
                            onClick={scrollToFeatures}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition-colors cursor-pointer min-h-[44px]"
                        >
                            <span>Features</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left transition-colors cursor-pointer min-h-[44px]"
                        >
                            <span>Live Demo</span>
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
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
            <main className="relative z-10 pt-32 sm:pt-44 pb-20 sm:pb-32 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center">

                {/* Hero Section */}
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 sm:mb-20">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 sm:mb-8 text-balance text-zinc-900 dark:text-white">
                        Automate Coding Cohorts. <br />
                        <span className="text-[#5b4fff] dark:text-[#968fff]">Track LeetCode and Codeforces.</span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                        The educational operating system for bootcamps, academies, and universities. Automate submission validation, track dual-platform ratings, and run real-time cohort leaderboards without manual spreadsheets.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Link 
                            to="/login" 
                            className="w-full sm:w-auto bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] min-h-[48px]"
                        >
                            Get Started Free <ChevronRight className="w-4 h-4" />
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full sm:w-auto bg-white dark:bg-[#111111] border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-white text-[15px] font-semibold px-8 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer hover:-translate-y-0.5 min-h-[48px]"
                        >
                            Try Interactive Demo
                        </button>
                    </div>
                </div>

                {/* INTERACTIVE HERO COMMAND DECK */}
                <div id="interactive-demo" className="w-full max-w-5xl mx-auto mb-20 sm:mb-28 scroll-mt-28">
                    <div className="rounded-3xl bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden">
                        
                        {/* Deck Command Bar */}
                        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/70 dark:bg-[#18181b]/50">
                            <div className="flex items-center gap-3">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">Interactive Platform Simulator</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium hidden sm:inline">
                                    Live Sandbox
                                </span>
                            </div>

                            {/* Mode Tabs */}
                            <div className="flex items-center gap-1.5 bg-zinc-200/60 dark:bg-zinc-900 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setDemoMode('leaderboard')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        demoMode === 'leaderboard'
                                            ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Leaderboard
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDemoMode('verifier')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        demoMode === 'verifier'
                                            ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Auto-Verifier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDemoMode('radar')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        demoMode === 'radar'
                                            ? 'bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Contest Radar
                                </button>
                            </div>
                        </div>

                        {/* MODE 1: LEADERBOARD PREVIEW */}
                        {demoMode === 'leaderboard' && (
                            <div className="p-5 sm:p-7">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">Batch 2024 Placement Cohort</h3>
                                        <p className="text-xs text-zinc-500">Live dual-platform ranking updated every 15 minutes</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-zinc-500 font-medium">Sort by:</span>
                                        <button
                                            type="button"
                                            onClick={() => setLeaderboardSort('total')}
                                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                                                leaderboardSort === 'total' 
                                                    ? 'bg-[#5b4fff]/10 border-[#5b4fff]/40 text-[#5b4fff] dark:text-[#968fff]' 
                                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}
                                        >
                                            Total Solved
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeaderboardSort('lc')}
                                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                                                leaderboardSort === 'lc' 
                                                    ? 'bg-[#ffa116]/10 border-[#ffa116]/40 text-[#ffa116]' 
                                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}
                                        >
                                            LC Rating
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeaderboardSort('cf')}
                                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                                                leaderboardSort === 'cf' 
                                                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-500' 
                                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}
                                        >
                                            CF Rating
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLeaderboardSort('streak')}
                                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                                                leaderboardSort === 'streak' 
                                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' 
                                                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                            }`}
                                        >
                                            Streak
                                        </button>
                                    </div>
                                </div>

                                <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden">
                                    {sortedStudents.map((student, idx) => (
                                        <div key={student.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-6 text-center font-bold text-sm ${idx === 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                                                    #{idx + 1}
                                                </span>
                                                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{student.name}</p>
                                                    <p className="text-xs text-zinc-500">@{student.handle}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                                                {/* Solves */}
                                                <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
                                                    <span>{student.lcSolved + student.cfSolved} Solves</span>
                                                    <span className="text-[11px] text-zinc-400 font-normal">({student.lcSolved} LC + {student.cfSolved} CF)</span>
                                                </div>

                                                {/* Ratings */}
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-[#ffa116]/10 text-[#ffa116] font-semibold border border-[#ffa116]/20">
                                                        LC: {student.lcRating} ({student.lcRank})
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 font-semibold border border-sky-500/20">
                                                        CF: {student.cfRating} ({student.cfRank})
                                                    </span>
                                                </div>

                                                {/* Streak */}
                                                <div className="flex items-center gap-1 font-semibold text-amber-500">
                                                    <FireIcon className="w-3.5 h-3.5" weight="fill" />
                                                    <span>{student.streak}d</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MODE 2: SUBMISSION VERIFIER SIMULATOR */}
                        {demoMode === 'verifier' && (
                            <div className="p-5 sm:p-7">
                                <div className="mb-4">
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Live Submission Verification Pipeline</h3>
                                    <p className="text-xs text-zinc-500">Test how MentorSync verifies actual student submissions without spreadsheets</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                    {SAMPLE_VERIFICATIONS.map((ver) => (
                                        <button
                                            key={ver.id}
                                            type="button"
                                            onClick={() => setSelectedVerification(ver.id)}
                                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                selectedVerification === ver.id
                                                    ? 'bg-[#5b4fff]/10 border-[#5b4fff] dark:border-[#5b4fff]'
                                                    : 'bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[11px] font-bold ${ver.platform === 'LeetCode' ? 'text-[#ffa116]' : 'text-sky-500'}`}>
                                                    {ver.platform}
                                                </span>
                                                <span className="text-[10px] text-zinc-400">{ver.timestamp}</span>
                                            </div>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{ver.title}</p>
                                            <p className="text-[11px] text-zinc-500">Problem #{ver.problemId}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Pipeline Terminal Output */}
                                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-zinc-800">
                                        <span>Pipeline Execution Log</span>
                                        <span className="text-emerald-400 font-semibold">Status: 200 OK</span>
                                    </div>
                                    <p className="text-zinc-300">
                                        [1] Ingesting URL: https://{activeVerification.platform.toLowerCase()}.com/problems/{activeVerification.title.toLowerCase().replace(/\s+/g, '-')}
                                    </p>
                                    <p className="text-zinc-300">
                                        [2] Querying live profile submission feed for target cohort student...
                                    </p>
                                    <p className="text-emerald-400">
                                        [3] Match confirmed: {activeVerification.title} ({activeVerification.difficulty}) • Runtime: {activeVerification.runtime}
                                    </p>
                                    <p className="text-emerald-400 font-bold">
                                        [4] Verdict: {activeVerification.status} • Assignment progress updated (+10 pts)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* MODE 3: DUAL-PLATFORM CONTEST RADAR */}
                        {demoMode === 'radar' && (
                            <div className="p-5 sm:p-7">
                                <div className="mb-5">
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Upcoming Competitive Rounds</h3>
                                    <p className="text-xs text-zinc-500">Live countdowns for official LeetCode and Codeforces rating rounds</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* LeetCode Contest Card */}
                                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="px-2.5 py-1 rounded-md bg-[#ffa116]/10 text-[#ffa116] font-bold text-xs border border-[#ffa116]/20">
                                                    LeetCode Contest
                                                </span>
                                                <span className="text-xs text-zinc-500 font-medium">Weekly 445</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Weekly Contest 445</h4>
                                            <p className="text-xs text-zinc-500 mb-4">4 algorithmic problems • 90 minutes • Global Rating Impact</p>
                                        </div>
                                        <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                                            <span className="text-zinc-500">Starts in: <strong>1d 14h 20m</strong></span>
                                            <span className="text-[#ffa116] font-semibold">Registered (42 students)</span>
                                        </div>
                                    </div>

                                    {/* Codeforces Contest Card */}
                                    <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-500 font-bold text-xs border border-sky-500/20">
                                                    Codeforces Round
                                                </span>
                                                <span className="text-xs text-zinc-500 font-medium">Div. 2</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Codeforces Round 1012</h4>
                                            <p className="text-xs text-zinc-500 mb-4">Rated for Div. 2 (Rating &lt; 2100) • 2 hours • ICPC scoring</p>
                                        </div>
                                        <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                                            <span className="text-zinc-500">Starts in: <strong>2d 08h 15m</strong></span>
                                            <span className="text-sky-500 font-semibold">Registered (36 students)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/80 mb-20 sm:mb-28" />

                {/* DUAL-ECOSYSTEM: FOR INSTRUCTORS & FOR STUDENTS */}
                <section className="w-full relative z-10 scroll-mt-28 mb-24 sm:mb-32">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance text-zinc-900 dark:text-white">
                            Purpose-Built for Both Sides of the Classroom
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
                            A unified platform aligning educator supervision with student progress and technical competition.
                        </p>
                    </div>

                    {/* Role Switcher Pill Bar */}
                    <div 
                        role="tablist" 
                        aria-label="Target audience views"
                        className="flex bg-zinc-100 dark:bg-[#18181b] p-1.5 rounded-2xl w-max mx-auto mb-10 border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm"
                    >
                        <button
                            role="tab"
                            id="tab-mentor"
                            aria-selected={activeTab === 'mentor'}
                            aria-controls="panel-mentor"
                            onClick={() => setActiveTab('mentor')}
                            className={`px-6 sm:px-8 py-3 text-sm font-semibold rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer min-h-[44px] flex items-center ${
                                activeTab === 'mentor' 
                                    ? 'bg-white dark:bg-[#111111] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-white/10' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            For Instructors & Mentors
                        </button>
                        <button
                            role="tab"
                            id="tab-student"
                            aria-selected={activeTab === 'student'}
                            aria-controls="panel-student"
                            onClick={() => setActiveTab('student')}
                            className={`px-6 sm:px-8 py-3 text-sm font-semibold rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer min-h-[44px] flex items-center ${
                                activeTab === 'student' 
                                    ? 'bg-white dark:bg-[#111111] text-zinc-900 dark:text-white shadow-sm border border-zinc-200/80 dark:border-white/10' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            For Competitive Students
                        </button>
                    </div>

                    {/* Tab Panes */}
                    <div className="max-w-5xl mx-auto bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-12 shadow-xl">
                        {activeTab === 'mentor' ? (
                            <div 
                                id="panel-mentor" 
                                role="tabpanel" 
                                aria-labelledby="tab-mentor"
                                className="grid md:grid-cols-2 gap-10 items-center"
                            >
                                <div>
                                    <div className="bg-[#5b4fff]/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-[#5b4fff]/20">
                                        <UsersIcon className="h-6 w-6 text-[#5b4fff] dark:text-[#968fff]" weight="bold" />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-zinc-900 dark:text-white">
                                        Total Control Over Cohort Progress
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" weight="bold" />
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                                                Create distinct classrooms with access codes and auto-sync student rosters via CSV or handle imports.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" weight="bold" />
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                                                Assign problem lists from LeetCode and Codeforces with strict deadlines and automated validation.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" weight="bold" />
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                                                Export 2D student-assignment completion matrices directly to CSV for streamlined grading and review.
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#18181b]/80 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-[#111111] border border-zinc-200/80 dark:border-zinc-800/80">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Batch 2024 Placement Track</p>
                                            <p className="text-xs text-zinc-500">64 Enrolled • 94% on pace</p>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff]">Active</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-[#111111] border border-zinc-200/80 dark:border-zinc-800/80">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Competitive Programming Sprint</p>
                                            <p className="text-xs text-zinc-500">48 Enrolled • Div. 2 Prep</p>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff]">Active</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-white dark:bg-[#111111] border border-zinc-200/80 dark:border-zinc-800/80 opacity-60">
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">System Design Cohort</p>
                                            <p className="text-xs text-zinc-500">Curriculum Drafting</p>
                                        </div>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Draft</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div 
                                id="panel-student" 
                                role="tabpanel" 
                                aria-labelledby="tab-student"
                                className="grid md:grid-cols-2 gap-10 items-center"
                            >
                                <div className="p-6 sm:p-8 rounded-2xl bg-zinc-50 dark:bg-[#18181b]/80 border border-zinc-200/80 dark:border-zinc-800/80">
                                    <div className="flex justify-between items-end mb-6">
                                        <div>
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Consistency Streak</p>
                                            <p className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                                54 <span className="text-base font-normal text-zinc-500">days active</span>
                                            </p>
                                        </div>
                                        <Award className="w-10 h-10 text-emerald-500" weight="bold" />
                                    </div>

                                    {/* 28-Day Consistency Preview Grid */}
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 28 }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`aspect-square rounded-md transition-colors ${
                                                    i % 4 === 0 || i % 7 === 0 || i % 9 === 0 
                                                        ? 'bg-emerald-500' 
                                                        : 'bg-zinc-200 dark:bg-zinc-800'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="bg-[#5b4fff]/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-[#5b4fff]/20">
                                        <TargetIcon className="h-6 w-6 text-[#5b4fff] dark:text-[#968fff]" weight="bold" />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-zinc-900 dark:text-white">
                                        Track Personal Growth and Rankings
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" weight="bold" />
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                                                Compare your standing against classmates on live cohort leaderboards updated in real time.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" weight="bold" />
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                                                Visualize your year-round discipline with a 365-day technical activity heatmap.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircleIcon className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" weight="bold" />
                                            <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
                                                Monitor upcoming LeetCode and Codeforces contests with live countdowns to never miss a round.
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/80 mb-20 sm:mb-28" />

                {/* CORE ARCHITECTURE PILLARS */}
                <section id="features" className="w-full scroll-mt-28 relative z-10 mb-24 sm:mb-32">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance text-zinc-900 dark:text-white">
                            Engineered for High-Velocity Coding Cohorts
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
                            Purpose-built infrastructure to eliminate spreadsheet toil and foster technical rigor.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pillar 1: Automated Verification (Spans 2 cols on desktop) */}
                        <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] mb-6 border border-[#5b4fff]/20">
                                    <ShieldCheckIcon className="w-7 h-7" weight="bold" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                                    Automated Dual-Platform Verification
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                                    Submissions are checked directly against LeetCode and Codeforces profile feeds. The scraper verifies problem slug, accepted status, and timestamp to eliminate false reporting.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-zinc-800/80 font-mono text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                                    <span>POST /api/submissions/verify</span>
                                    <span className="text-emerald-500 font-semibold">200 OK (8ms)</span>
                                </div>
                                <div className="text-zinc-900 dark:text-zinc-200 truncate">
                                    Payload: https://leetcode.com/problems/course-schedule-ii/ -&gt; VERIFIED
                                </div>
                            </div>
                        </div>

                        {/* Pillar 2: Real-Time Leaderboard */}
                        <div className="p-8 rounded-3xl bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-amber-500/10 text-amber-500 mb-6 border border-amber-500/20">
                                    <TrophyIcon className="w-7 h-7" weight="bold" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                                    Cohort Leaderboards
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                                    Rank students by aggregate solves, peak ratings, or consistency streaks. Instantly sort by LeetCode or Codeforces independently.
                                </p>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/70 dark:border-zinc-800/70">
                                    <span className="font-bold text-zinc-900 dark:text-white">#1 Alex Rivera</span>
                                    <span className="font-semibold text-[#5b4fff]">660 Solves</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/70 dark:border-zinc-800/70">
                                    <span className="font-bold text-zinc-900 dark:text-white">#2 Sarah Chen</span>
                                    <span className="font-semibold text-[#5b4fff]">610 Solves</span>
                                </div>
                            </div>
                        </div>

                        {/* Pillar 3: Educational Analytics */}
                        <div className="p-8 rounded-3xl bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-indigo-500/10 text-indigo-500 mb-6 border border-indigo-500/20">
                                    <ChartLineUpIcon className="w-7 h-7" weight="bold" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                                    Topic Mastery
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
                                    Identify critical student weaknesses across topic competencies like Dynamic Programming, Graphs, and Tree structures.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/70 dark:border-zinc-800/70 text-xs space-y-2">
                                <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                                    <span>Dynamic Programming</span>
                                    <span className="font-semibold">78%</span>
                                </div>
                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-[#5b4fff] h-full w-[78%]" />
                                </div>
                            </div>
                        </div>

                        {/* Pillar 4: Redis Cluster Telemetry (Spans 2 cols on desktop) */}
                        <div className="md:col-span-2 p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 shadow-lg flex flex-col justify-between">
                            <div>
                                <div className="p-3 w-max rounded-2xl bg-emerald-500/10 text-emerald-500 mb-6 border border-emerald-500/20">
                                    <DatabaseIcon className="w-7 h-7" weight="bold" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                                    Redis-Backed Cache Infrastructure
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                                    Equipped with multi-tier Redis caching to protect against third-party rate limits. Delivers sub-10ms response times for classroom analytics, profile statistics, and live leaderboards.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200/80 dark:border-zinc-700/80">
                                    Redis Cluster: Connected
                                </span>
                                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200/80 dark:border-zinc-700/80">
                                    Namespace Eviction: Supported
                                </span>
                                <span className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200/80 dark:border-zinc-700/80">
                                    Cache Hit Ratio: 98.6%
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FREQUENTLY ASKED QUESTIONS */}
                <section className="w-full max-w-4xl mx-auto mb-24 sm:mb-32">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-3">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
                            Everything educators and bootcamp leads ask about MentorSync infrastructure.
                        </p>
                    </div>

                    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 border border-zinc-200/90 dark:border-white/10 rounded-3xl bg-white dark:bg-[#111111] overflow-hidden shadow-lg">
                        {FAQS.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={index} className="transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                        aria-expanded={isOpen}
                                        className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-zinc-900 dark:text-white text-sm sm:text-base cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-[#18181b]/50 transition-colors"
                                    >
                                        <span>{faq.question}</span>
                                        <CaretDownIcon 
                                            className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5b4fff]' : ''}`} 
                                            weight="bold" 
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed animate-in fade-in duration-200">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Pre-Footer Call to Action */}
                <section className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-900 dark:bg-[#141416] text-white p-8 sm:p-14 text-center border border-zinc-800 shadow-2xl relative overflow-hidden">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-balance">
                        Ready to Streamline Your Coding Cohorts?
                    </h2>
                    <p className="text-zinc-300 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                        Join educators and competitive programmers using MentorSync to automate submission verification and track growth natively.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/login"
                            className="w-full sm:w-auto bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[48px] flex items-center justify-center"
                        >
                            Start for Free
                        </Link>
                        <Link 
                            to="/how-to-use"
                            className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 text-[15px] font-semibold px-8 py-3.5 rounded-xl transition-all min-h-[48px] flex items-center justify-center"
                        >
                            Read Documentation
                        </Link>
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