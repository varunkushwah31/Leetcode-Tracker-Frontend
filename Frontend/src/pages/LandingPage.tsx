import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    UsersIcon,
    CaretRightIcon as ChevronRight,
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
    CheckIcon,
    ArrowSquareOutIcon
} from '@phosphor-icons/react';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function LandingPage() {
    const [activeTab, setActiveTab] = useState<'mentor' | 'student'>('mentor');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToFeatures = () => {
        setMobileMenuOpen(false);
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

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
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 sm:mb-24">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 sm:mb-8 text-balance text-zinc-900 dark:text-white">
                        Automate Coding Cohorts. <br />
                        <span className="text-[#5b4fff] dark:text-[#968fff]">Track LeetCode and Codeforces.</span>
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                        The all-in-one platform for bootcamps, academies, and mentors. Automate submission validation, track dual-platform contest ratings, and run real-time cohort leaderboards without spreadsheets.
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
                            onClick={scrollToFeatures}
                            className="w-full sm:w-auto bg-white dark:bg-[#111111] border border-zinc-300 dark:border-zinc-800 text-zinc-800 dark:text-white text-[15px] font-semibold px-8 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] cursor-pointer hover:-translate-y-0.5 min-h-[48px]"
                        >
                            Explore Platform
                        </button>
                    </div>
                </div>

                {/* Hero Product Deck: Live Telemetry & Verification Preview */}
                <div className="w-full max-w-5xl mx-auto mb-20 sm:mb-28">
                    <div className="rounded-3xl bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-white/10 shadow-xl overflow-hidden">
                        {/* Top Control Bar */}
                        <div className="px-5 sm:px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/70 dark:bg-[#18181b]/50">
                            <div className="flex items-center gap-2.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">Batch 2024 Placement Cohort</span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">• Live Sync Active</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                    64 Students
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] font-medium border border-[#5b4fff]/20">
                                    Dual-Platform Sync
                                </span>
                            </div>
                        </div>

                        {/* Interactive Data Matrix Preview */}
                        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Metric 1: Dual Solves */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b]/70 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Problems Solved</span>
                                    <div className="p-2 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff]">
                                        <Code2Icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">14,820</p>
                                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                                    <span className="text-[#ffa116] font-semibold">LeetCode: 9,210</span>
                                    <span className="text-zinc-400">•</span>
                                    <span className="text-sky-500 font-semibold">Codeforces: 5,610</span>
                                </div>
                            </div>

                            {/* Metric 2: Live Verification */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b]/70 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Submissions Verified</span>
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">99.4%</p>
                                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    <CheckIcon className="w-3.5 h-3.5" /> Direct platform URL verification
                                </div>
                            </div>

                            {/* Metric 3: Active Streaks */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b]/70 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Streak Leader</span>
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                        <FireIcon className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">64 <span className="text-base font-normal text-zinc-500">days</span></p>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span>Continuous daily solving active</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Verified Activity Feed */}
                        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 px-5 sm:px-8 py-4 bg-white dark:bg-[#111111]">
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-3">Live Verification Feed</p>
                            <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/60">
                                <div className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="font-semibold text-zinc-900 dark:text-white truncate">Alex Rivera</span>
                                        <span className="text-zinc-500 truncate">Course Schedule II</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">LeetCode #210</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
                                    </div>
                                </div>
                                <div className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span className="font-semibold text-zinc-900 dark:text-white truncate">Sarah Chen</span>
                                        <span className="text-zinc-500 truncate">Watermelon</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">Codeforces 4A</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800/80 mb-20 sm:mb-28" />

                {/* Ecosystem Section: For Mentors & For Students */}
                <section className="w-full relative z-10 scroll-mt-28 mb-24 sm:mb-32">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance text-zinc-900 dark:text-white">
                            Purpose-Built for Instructors and Students
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

                {/* Core Architecture Pillars */}
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
                                    <span className="font-semibold text-[#5b4fff]">420 Solves</span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/70 dark:border-zinc-800/70">
                                    <span className="font-bold text-zinc-900 dark:text-white">#2 Sarah Chen</span>
                                    <span className="font-semibold text-[#5b4fff]">395 Solves</span>
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
                                    Skill Analytics
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

                {/* Pre-Footer Call to Action */}
                <section className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-900 dark:bg-[#141416] text-white p-8 sm:p-12 text-center border border-zinc-800 shadow-2xl relative overflow-hidden">
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