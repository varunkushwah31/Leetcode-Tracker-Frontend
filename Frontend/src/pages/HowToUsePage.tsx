import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    DownloadSimpleIcon as Download,
    CheckCircleIcon as CheckCircle,
    CopyIcon,
    FileCsvIcon as FileSpreadsheet,
    GraduationCapIcon as StudentIcon,
    ChalkboardTeacherIcon as MentorIcon,
    ClipboardTextIcon as ClipboardList,
    TrophyIcon,
    ShieldCheckIcon as Shield,
    QuestionIcon as HelpCircle,
    InfoIcon,
    BellIcon,
    CodeIcon as Code2Icon,
    SparkleIcon as Sparkles,
    CaretRightIcon as ChevronRight
} from '@phosphor-icons/react';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ClassroomService } from '@/services/endpoints';

export function HowToUsePage() {
    const [activeSection, setActiveSection] = useState<'all' | 'mentor' | 'student' | 'csv' | 'reports' | 'faq'>('all');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const response = await ClassroomService.downloadTemplateCsv();
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_import_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: unknown) {
            console.error('Failed to download template:', err);
            const fallbackCsv = `Name,Email,LeetCode Username,Codeforces Handle\nAlice Sharma,alice@example.com,alicesharma,alice_cf\nBob Kumar,bob@example.com,bobk,bob_codeforces\nCharlie Singh,charlie@example.com,https://leetcode.com/u/charlie,charlie_cf\nDavid Lee,,davidlee,tourist\n`;
            const blob = new Blob([fallbackCsv], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_import_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const csvSampleMultiColumn = `Name,Email,LeetCode Username,Codeforces Handle
Alice Sharma,alice@example.com,alicesharma,alice_cf
Bob Kumar,bob@example.com,bobk,bob_codeforces
Charlie Singh,charlie@example.com,https://leetcode.com/u/charlie,charlie_cf
David Lee,,davidlee,tourist`;

    const csvSampleSingleColumn = `LeetCode Username
tourist
neal_wu
https://leetcode.com/u/alicesharma
https://codeforces.com/profile/petr`;

    return (
        <div className="min-h-screen bg-[#f1f3f7] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white selection:bg-[#5b4fff] selection:text-white overflow-x-hidden font-sans relative transition-colors duration-200">

            {/* Background Base matching Landing Page */}
            <div className="fixed inset-0 z-0 bg-[#f8fafc] dark:bg-[#050505] transition-colors duration-200 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] bg-fixed opacity-25 dark:opacity-100 pointer-events-none" />
                <AmbientGlow />
            </div>

            {/* Floating Header matching Landing Page */}
            <header className="fixed top-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] max-w-5xl z-50 rounded-2xl bg-white/85 dark:bg-[#0a0a0a]/75 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/5 shadow-xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all">
                <BrandLogo size="md" theme="auto" />

                <nav className="flex items-center gap-2.5 sm:gap-5">
                    <Link
                        to="/#features"
                        className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors hidden md:block"
                    >
                        Features
                    </Link>
                    <Link
                        to="/how-to-use"
                        className="text-[14px] font-semibold text-indigo-600 dark:text-white transition-colors hidden sm:block"
                    >
                        How to Use
                    </Link>
                    <Link
                        to="/contact"
                        className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors hidden md:block"
                    >
                        Contact
                    </Link>
                    <Link
                        to="/login"
                        className="text-[14px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff]"
                    >
                        Sign In
                    </Link>
                    <ThemeToggle className="bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border-zinc-200 dark:border-white/10" />
                    <Link
                        to="/login"
                        className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_0_20px_rgba(91,79,255,0.2)] text-white text-[14px] font-medium px-4 sm:px-6 py-2.5 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] hover:-translate-y-0.5 active:translate-y-0 shimmer-sweep interactive-press"
                    >
                        Get Started
                    </Link>
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 pt-36 sm:pt-48 pb-20 sm:pb-32 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center">

                {/* Hero Title Section */}
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 sm:mb-20">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white/90 dark:bg-[#111111]/80 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm animate-float-subtle">
                        <span className="flex h-2 w-2 rounded-full bg-[#5b4fff] animate-pulse"></span>
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-700 dark:text-zinc-300 uppercase">
                            Official Documentation & User Manual
                        </span>
                    </div>

                    <h1 className="text-[10vw] leading-[1.1] sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-6 sm:mb-8 sm:leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance text-zinc-900 dark:text-white">
                        How to Use <br className="hidden sm:block" />
                        <span className="text-[#5b4fff] dark:text-[#968fff]">
                            MentorSync
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Step-by-step instructions, feature walkthroughs, and guidelines for bulk student addition via CSV, submission verification, roadmaps, and analytics reports.
                    </p>

                    {/* Section Switcher Tabs matching Landing Page Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-2xl p-2 rounded-2xl border border-zinc-200/80 dark:border-white/5 shadow-md">
                        {[
                            { id: 'all', label: 'All Guides', icon: ClipboardList },
                            { id: 'mentor', label: 'Mentor Guide', icon: MentorIcon },
                            { id: 'student', label: 'Student Guide', icon: StudentIcon },
                            { id: 'csv', label: 'Bulk CSV Import', icon: FileSpreadsheet },
                            { id: 'reports', label: 'Reports & Exports', icon: Download },
                            { id: 'faq', label: 'FAQ & Tips', icon: HelpCircle },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveSection(id as typeof activeSection)}
                                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer interactive-press ${
                                    activeSection === id
                                        ? 'bg-[#5b4fff] text-white shadow-md shadow-[#5b4fff]/25 scale-102'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-4 h-4" weight="bold" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full h-px bg-linear-to-r from-transparent via-zinc-300 dark:via-zinc-800 to-transparent mb-16 sm:mb-24"></div>

                <div className="w-full space-y-12 sm:space-y-16">

                    {/* SECTION 1: ARCHITECTURE & ROLES OVERVIEW */}
                    {(activeSection === 'all' || activeSection === 'faq') && (
                        <section className="bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-indigo-50 dark:bg-[#1a1b2e] w-12 h-12 rounded-xl flex items-center justify-center shadow-sm dark:shadow-xl border border-indigo-100 dark:border-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff]">
                                    <Shield className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">1. Platform Roles & Architecture</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Understanding user roles and account capabilities in MentorSync</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-zinc-50/90 dark:bg-[#111116]/80 p-6 rounded-2xl border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:bg-zinc-100/80 dark:hover:bg-[#14141a] transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/30">Mentor</Badge>
                                        <MentorIcon className="w-6 h-6 text-[#5b4fff] dark:text-[#968fff]" />
                                    </div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Classroom Instructor</h3>
                                    <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                        <li>• Creates & manages classroom cohorts.</li>
                                        <li>• Adds students individually or in bulk via multi-column CSV.</li>
                                        <li>• Assigns LeetCode & Codeforces problems with custom deadlines.</li>
                                        <li>• Builds sequential multi-question Learning Paths.</li>
                                        <li>• Exports full leaderboard CSVs, assignment completion matrices, and student reports.</li>
                                    </ul>
                                </div>

                                <div className="bg-zinc-50/90 dark:bg-[#111116]/80 p-6 rounded-2xl border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:bg-zinc-100/80 dark:hover:bg-[#14141a] transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Student</Badge>
                                        <StudentIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Learner & Competitor</h3>
                                    <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                        <li>• Links both LeetCode username and Codeforces handle.</li>
                                        <li>• Automated and on-demand stats syncing from both platforms.</li>
                                        <li>• Solves assigned problems and triggers automated or URL verification.</li>
                                        <li>• Views live streaks, unified contest history, and activity heatmaps.</li>
                                        <li>• Exports comprehensive personal performance reports as CSV.</li>
                                    </ul>
                                </div>

                                <div className="bg-zinc-50/90 dark:bg-[#111116]/80 p-6 rounded-2xl border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 hover:bg-zinc-100/80 dark:hover:bg-[#14141a] transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Super Admin</Badge>
                                        <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white">System Administrator</h3>
                                    <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                                        <li>• System-wide metrics (total students, mentors, classrooms).</li>
                                        <li>• Mentor management and classroom oversight.</li>
                                        <li>• Global sync trigger across all registered students.</li>
                                        <li>• System health and distributed lock monitoring.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 2: MENTOR OPERATIONS GUIDE */}
                    {(activeSection === 'all' || activeSection === 'mentor') && (
                        <section className="bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 dark:bg-[#1a1b2e] w-12 h-12 rounded-xl flex items-center justify-center shadow-sm dark:shadow-xl border border-indigo-100 dark:border-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff]">
                                    <MentorIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">2. Mentor Operations Guide</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Step-by-step workflow for managing classrooms, assignments, and students</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Step 1 */}
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">1</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Create and Organize Classrooms</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8.5 leading-relaxed">
                                        In the left sidebar of your Mentor Dashboard, click <strong className="text-zinc-900 dark:text-white">+ Create New Class</strong>. Enter the cohort name (e.g. <em>"DSA Cohort Autumn 2026"</em>). You can switch between active classrooms from the sidebar or the top header dropdown at any time.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">2</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Add Students (Single or Bulk Import)</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8.5 leading-relaxed">
                                        Click the <strong className="text-zinc-900 dark:text-white">Add Student</strong> button in the top action bar:
                                    </p>
                                    <div className="pl-8.5 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="p-4 bg-white dark:bg-[#14141c]/90 rounded-xl border border-zinc-200 dark:border-white/5 shadow-xs">
                                            <p className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">Option A: Single Student</p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                                                Enter their LeetCode username, Codeforces handle, email, or profile URL. The student must already have created an account on MentorSync through signup. The platform verifies their account and enrolls them into your class.
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-[#14141c]/90 rounded-xl border border-zinc-200 dark:border-white/5 shadow-xs">
                                            <p className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">Option B: Bulk CSV Import</p>
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">
                                                Upload a CSV with names, emails, handles, or profile URLs. Only students who have registered on MentorSync will be added; unregistered students are reported with actionable feedback. <em>(See Section 3 for detailed formatting guidelines.)</em>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">3</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Assign Questions with Smart Platform Auto-Detection</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8.5 leading-relaxed">
                                        Click <strong className="text-zinc-900 dark:text-white">Assign Question</strong>. You can paste:
                                    </p>
                                    <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-12 space-y-1.5 list-disc">
                                        <li>Full LeetCode URL: <code className="text-xs bg-zinc-200 dark:bg-[#1a1a22] text-[#5b4fff] dark:text-[#968fff] px-1.5 py-0.5 rounded font-mono">https://leetcode.com/problems/two-sum/</code> or slug: <code className="text-xs bg-zinc-200 dark:bg-[#1a1a22] text-[#5b4fff] dark:text-[#968fff] px-1.5 py-0.5 rounded font-mono">two-sum</code></li>
                                        <li>Full Codeforces URL: <code className="text-xs bg-zinc-200 dark:bg-[#1a1a22] text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded font-mono">https://codeforces.com/problemset/problem/4/A</code> or ID: <code className="text-xs bg-zinc-200 dark:bg-[#1a1a22] text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded font-mono">4A</code></li>
                                    </ul>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8.5 leading-relaxed pt-1">
                                        The platform switches automatically between LeetCode and Codeforces based on the URL you paste. Pick a deadline with custom date/time or click the quick presets (<code className="text-[11px] bg-zinc-200 dark:bg-[#1a1a22] px-1.5 py-0.5 rounded">+1 Day</code>, <code className="text-[11px] bg-zinc-200 dark:bg-[#1a1a22] px-1.5 py-0.5 rounded">+3 Days</code>, <code className="text-[11px] bg-zinc-200 dark:bg-[#1a1a22] px-1.5 py-0.5 rounded">+1 Week</code>).
                                    </p>
                                </div>

                                {/* Step 4 */}
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">4</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Build and Assign Learning Paths (Curriculum Roadmaps)</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8.5 leading-relaxed">
                                        Click <strong className="text-zinc-900 dark:text-white">Assign Path</strong> → <strong className="text-zinc-900 dark:text-white">Create New Learning Path</strong>. Add sequential questions and specify how many days each problem should take (e.g. 2 days for Question 1, 3 days for Question 2). When assigned to a class, MentorSync calculates cumulative rolling deadlines automatically for every student in the cohort.
                                    </p>
                                </div>

                                {/* Step 5 */}
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">5</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Monitor Leaderboard, Nudge Students & Inspect Analytics</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8.5 leading-relaxed">
                                        - Sort the leaderboard by <em>Total Solved</em>, <em>Daily Streak</em>, <em>Most Pending</em>, or <em>Contest Rating</em>.<br />
                                        - Click <strong className="text-zinc-900 dark:text-white"><BellIcon className="inline w-3.5 h-3.5 text-amber-500" /> Nudge</strong> on any student with pending assignments to send an automated email reminder.<br />
                                        - Click <strong className="text-zinc-900 dark:text-white">Remove</strong> on any student row or student profile to un-enroll them from the class (with confirmation prompt). Their account and problem solving history remain safe.<br />
                                        - Click any student row to view their deep dive: topic mastery, contest performance, submission timeline, and export their individual report.<br />
                                        - Switch to the <strong className="text-zinc-900 dark:text-white">Weakness & Analytics</strong> tab to see overall cohort strengths, completion bottlenecks, and problem solve distributions.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 3: EXHAUSTIVE BULK CSV GUIDELINES */}
                    {(activeSection === 'all' || activeSection === 'csv') && (
                        <section className="bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-50 dark:bg-[#1a1b2e] w-12 h-12 rounded-xl flex items-center justify-center shadow-sm dark:shadow-xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                        <FileSpreadsheet className="w-6 h-6" weight="bold" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">3. Bulk Student Import via CSV Guidelines</h2>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Complete specifications, column formats, auto-provisioning details, and samples</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleDownloadTemplate}
                                    disabled={isDownloadingTemplate}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md text-xs font-semibold h-11 px-5 self-start sm:self-auto cursor-pointer flex items-center gap-2 transition-all hover:-translate-y-0.5 interactive-press"
                                >
                                    <Download className="w-4 h-4" />
                                    Download CSV Template
                                </Button>
                            </div>

                            {/* Guideline Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-2">
                                        <CheckCircle className="w-4 h-4" /> Delimiter Auto-Detection
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Supports comma (<code className="font-mono text-emerald-600 dark:text-emerald-300">,</code>), semicolon (<code className="font-mono text-emerald-600 dark:text-emerald-300">;</code>), or tab-delimited (<code className="font-mono text-emerald-600 dark:text-emerald-300">\t</code>) CSV exports directly from Google Sheets or Excel.
                                    </p>
                                </div>

                                <div className="p-5 bg-[#5b4fff]/5 dark:bg-[#5b4fff]/10 border border-[#5b4fff]/20 rounded-2xl">
                                    <div className="flex items-center gap-2 text-[#5b4fff] dark:text-[#968fff] font-bold text-sm mb-2">
                                        <Sparkles className="w-4 h-4" /> Zero-Friction Auto-Provisioning
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Students do not need to register beforehand! MentorSync automatically provisions their accounts and enqueues background profile scraping immediately.
                                    </p>
                                </div>

                                <div className="p-5 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm mb-2">
                                        <CheckCircle className="w-4 h-4" /> Auto URL & Handle Extraction
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Paste raw handles (e.g. <code className="font-mono text-cyan-600 dark:text-cyan-300">tourist</code>) or full URLs (e.g. <code className="font-mono text-cyan-600 dark:text-cyan-300">https://leetcode.com/u/user</code> or <code className="font-mono text-cyan-600 dark:text-cyan-300">https://codeforces.com/profile/handle</code>). Queries, hashes, and slashes are cleaned automatically with cross-platform column detection.
                                    </p>
                                </div>
                            </div>

                            {/* Format Specification */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <span>Format 1: Multi-Column Format</span>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Recommended</Badge>
                                    </h3>
                                </div>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                    Include the header row with column titles. Any of the following variations are recognized:
                                </p>

                                <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#111116]/80 shadow-xs">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 font-bold uppercase">
                                            <tr>
                                                <th className="py-3 px-4">Column</th>
                                                <th className="py-3 px-4">Recognized Headers</th>
                                                <th className="py-3 px-4">Required?</th>
                                                <th className="py-3 px-4">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-zinc-600 dark:text-zinc-400">
                                            <tr>
                                                <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">Name</td>
                                                <td className="py-3 px-4"><code className="text-zinc-700 dark:text-zinc-300">Name</code>, <code className="text-zinc-700 dark:text-zinc-300">Student Name</code>, <code className="text-zinc-700 dark:text-zinc-300">Full Name</code></td>
                                                <td className="py-3 px-4"><span className="text-zinc-500">Optional</span></td>
                                                <td className="py-3 px-4">Full display name. Falls back to username if empty.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">Email</td>
                                                <td className="py-3 px-4"><code className="text-zinc-700 dark:text-zinc-300">Email</code>, <code className="text-zinc-700 dark:text-zinc-300">Email Address</code></td>
                                                <td className="py-3 px-4"><span className="text-zinc-500">Optional</span></td>
                                                <td className="py-3 px-4">Student email. Auto-generated mock email if omitted.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">LeetCode Username</td>
                                                <td className="py-3 px-4"><code className="text-emerald-600 dark:text-emerald-400">LeetCode Username</code>, <code className="text-emerald-600 dark:text-emerald-400">LeetCode</code>, <code className="text-emerald-600 dark:text-emerald-400">LC</code>, <code className="text-emerald-600 dark:text-emerald-400">Username</code></td>
                                                <td className="py-3 px-4"><span className="text-emerald-600 dark:text-emerald-400 font-bold">Recommended</span></td>
                                                <td className="py-3 px-4">Public LeetCode profile handle or URL.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-3 px-4 font-mono font-semibold text-zinc-900 dark:text-white">Codeforces Handle</td>
                                                <td className="py-3 px-4"><code className="text-cyan-600 dark:text-cyan-400">Codeforces Handle</code>, <code className="text-cyan-600 dark:text-cyan-400">Codeforces</code>, <code className="text-cyan-600 dark:text-cyan-400">CF</code>, <code className="text-cyan-600 dark:text-cyan-400">CF Handle</code></td>
                                                <td className="py-3 px-4"><span className="text-zinc-500">Optional</span></td>
                                                <td className="py-3 px-4">Public Codeforces handle or profile URL.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Code Snippet Multi-Column */}
                                <div className="relative mt-3">
                                    <div className="flex items-center justify-between bg-zinc-800 px-4 py-2.5 rounded-t-2xl border border-zinc-700">
                                        <span className="text-[12px] font-mono text-zinc-300 font-semibold">sample_students.csv (Multi-column)</span>
                                        <button
                                            onClick={() => handleCopy(csvSampleMultiColumn, 1)}
                                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors interactive-press"
                                        >
                                            {copiedIndex === 1 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                            {copiedIndex === 1 ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-zinc-900 text-emerald-400 font-mono text-xs rounded-b-2xl overflow-x-auto border-x border-b border-zinc-700 leading-relaxed">
{csvSampleMultiColumn}
                                    </pre>
                                </div>
                            </div>

                            {/* Format 2: Single Column */}
                            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/5">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>Format 2: Single-Column Usernames List</span>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700">Quick Mode</Badge>
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                    Have a raw list of LeetCode handles or Codeforces handles? A single column file with or without a header is processed directly:
                                </p>

                                <div className="relative mt-2">
                                    <div className="flex items-center justify-between bg-zinc-800 px-4 py-2.5 rounded-t-2xl border border-zinc-700">
                                        <span className="text-[12px] font-mono text-zinc-300 font-semibold">handles_only.csv</span>
                                        <button
                                            onClick={() => handleCopy(csvSampleSingleColumn, 2)}
                                            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors interactive-press"
                                        >
                                            {copiedIndex === 2 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                            {copiedIndex === 2 ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-zinc-900 text-cyan-400 font-mono text-xs rounded-b-2xl overflow-x-auto border-x border-b border-zinc-700 leading-relaxed">
{csvSampleSingleColumn}
                                    </pre>
                                </div>
                            </div>

                            {/* Import Feedback breakdown */}
                            <div className="p-6 bg-zinc-50/90 dark:bg-[#111116]/80 rounded-2xl border border-zinc-200/70 dark:border-white/5 space-y-3">
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                    <InfoIcon className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" /> Real-Time Import Response & Status
                                </h4>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    After uploading, MentorSync presents a summary breakdown:
                                </p>
                                <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-4 list-disc">
                                    <li><strong className="text-emerald-600 dark:text-emerald-400">Added Count:</strong> Students newly registered and enrolled into the classroom cohort.</li>
                                    <li><strong className="text-blue-600 dark:text-blue-400">Already Enrolled:</strong> Students that were already active members of this classroom.</li>
                                    <li><strong className="text-rose-600 dark:text-rose-400">Failures:</strong> Any malformed row or duplicate unique constraint with the line number and exact reason provided.</li>
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* SECTION 4: STUDENT GUIDE */}
                    {(activeSection === 'all' || activeSection === 'student') && (
                        <section className="bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-cyan-50 dark:bg-[#1a1b2e] w-12 h-12 rounded-xl flex items-center justify-center shadow-sm dark:shadow-xl border border-cyan-100 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                                    <StudentIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">4. Student Guide & Tracking</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Connecting handles, completing assignments, auto-validation, and portfolio export</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white text-xs font-black flex items-center justify-center">1</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Connect Your Coding Handles</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8.5">
                                        During signup or in your Student Dashboard, enter your LeetCode username and Codeforces handle, or paste your profile URLs directly (e.g. <code className="text-[11px] bg-zinc-200/70 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">leetcode.com/u/alice</code>). MentorSync automatically cleans URLs and extracts handles. Make sure your profiles are public so statistics can be scraped.
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white text-xs font-black flex items-center justify-center">2</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Syncing Profile Stats</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8.5">
                                        The system polls and refreshes stats automatically. After solving an assignment, click <strong className="text-zinc-900 dark:text-white">Sync Profile</strong> in the top bar to force an immediate refresh from LeetCode & Codeforces.
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white text-xs font-black flex items-center justify-center">3</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Submitting & Validating Assignments</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8.5">
                                        In the <strong className="text-zinc-900 dark:text-white">Pending Assignments</strong> card, click the problem title to open the problem. Once solved, click <strong className="text-zinc-900 dark:text-white">Auto Validate</strong> to check recent Accepted submissions, or paste your solution URL for instant verification.
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-600 dark:bg-cyan-500 text-white text-xs font-black flex items-center justify-center">4</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Unified Contest History & Heatmaps</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-8.5">
                                        View a unified, chronological timeline of your LeetCode Weekly/Biweekly contests and Codeforces Division contests in one place. Toggle filters for <em>All</em>, <em>LeetCode</em>, or <em>Codeforces</em> to track rating growth.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 5: REPORTING & CSV EXPORTS */}
                    {(activeSection === 'all' || activeSection === 'reports') && (
                        <section className="bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-indigo-50 dark:bg-[#1a1b2e] w-12 h-12 rounded-xl flex items-center justify-center shadow-sm dark:shadow-xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                    <Download className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">5. Reporting & CSV Exports</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">All available data export endpoints, schemas, and usage</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">Classroom</Badge>
                                        <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">Classroom Leaderboard CSV</h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Exported by clicking <strong>Export Leaderboard</strong> in the Leaderboard tab. Contains student ranks, emails, handles, total solved, LC rank, CF rating, max rating, streaks, and assignment counts.
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">Matrix</Badge>
                                        <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">Assignment Completion Matrix</h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Exported by clicking <strong>Export Matrix</strong> in the Leaderboard tab. Produces a 2D grid of students × assignments, with each cell marked as <code className="font-mono text-purple-600 dark:text-purple-300">COMPLETED</code> or <code className="font-mono text-purple-600 dark:text-purple-300">PENDING</code>.
                                    </p>
                                </div>

                                <div className="p-6 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Individual</Badge>
                                        <TrophyIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">Student Performance Report</h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Exported from the Student Dashboard (<strong>Export Report</strong>), student details view, or directly per-row on the leaderboard. Contains 6 detailed sections: summary, topic mastery, assignments, recent submissions, and unified contest history.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 6: FAQ & TROUBLESHOOTING */}
                    {(activeSection === 'all' || activeSection === 'faq') && (
                        <section className="bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-12 rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="bg-amber-50 dark:bg-[#1a1b2e] w-12 h-12 rounded-xl flex items-center justify-center shadow-sm dark:shadow-xl border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                                    <HelpCircle className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">6. Frequently Asked Questions & Troubleshooting</h2>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Quick answers to common questions and edge cases</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        q: "Why does the student's solved count not update immediately after solving a problem?",
                                        a: "LeetCode and Codeforces have caching layers and rate limits. Clicking 'Sync Profile' in the student dashboard or 'Sync Class Data' in the mentor dashboard directly queries the external platform APIs and refreshes database metrics in real time."
                                    },
                                    {
                                        q: "Can I add students who have not yet signed up on MentorSync?",
                                        a: "No. For security, data integrity, and privacy, students must first create their account on MentorSync through signup. Once registered, mentors can add them individually or via bulk CSV import by their email, LeetCode username, or Codeforces handle."
                                    },
                                    {
                                        q: "Can I import a mix of LeetCode profile URLs and Codeforces profile URLs in the same CSV?",
                                        a: "Yes! MentorSync's regex parser automatically cleans URLs such as https://leetcode.com/u/user and https://codeforces.com/profile/user, extracting only the canonical username or handle."
                                    },
                                    {
                                        q: "How does assignment auto-validation verify LeetCode vs Codeforces submissions?",
                                        a: "For LeetCode, it inspects the student's recent Accepted submissions matching the assignment slug. For Codeforces, it inspects the student's recent submissions for verdict == OK on the corresponding problem ID (e.g. 4A)."
                                    },
                                    {
                                        q: "Can I extend or change the deadline of an existing assignment?",
                                        a: "Yes. In the Manage Assignments tab of the mentor dashboard, mentors can edit the assignment deadline or delete obsolete assignments at any time."
                                    }
                                ].map(({ q, a }, idx) => (
                                    <div key={`faq-${idx}`} className="p-5 rounded-2xl bg-zinc-50/90 dark:bg-[#111116]/80 border border-zinc-200/70 dark:border-white/5 space-y-1.5">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="text-[#5b4fff] dark:text-[#968fff]">Q:</span> {q}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-4 leading-relaxed">
                                            {a}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Bottom Call to Action */}
                <div className="w-full mt-20 text-center p-10 sm:p-14 bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-3xl border border-zinc-200/80 dark:border-white/5 shadow-xl relative overflow-hidden group hover:border-zinc-300 dark:hover:border-white/10 transition-all">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white mb-4 tracking-tight">
                        Ready to empower your cohort?
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed">
                        Start tracking your students with automated LeetCode and Codeforces synchronization today.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_0_20px_rgba(91,79,255,0.2)] text-white text-[15px] font-medium px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            Get Started Now <ChevronRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/contact"
                            className="bg-white dark:bg-[#111111] border border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20 text-zinc-800 dark:text-white text-[15px] font-medium px-8 py-3.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-[#161616] transition-all"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>

            </main>

            {/* Footer matching Landing Page */}
            <footer className="relative w-full overflow-hidden flex flex-col items-center justify-end z-10 pt-20 pb-8 sm:pb-10 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100/90 dark:bg-[#050508]/80 backdrop-blur-sm transition-colors duration-200">
                <div className="w-full max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start gap-12 mb-24 relative z-20 pointer-events-auto">
                    <div className="max-w-xs">
                        <div className="mb-6">
                            <BrandLogo size="md" theme="auto" asLink={false} />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-500 text-sm leading-relaxed">
                            The operating system for modern coding bootcamps. Empowering educators to track Scalable cohorts natively.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
                        <div>
                            <h4 className="text-zinc-900 dark:text-white font-semibold mb-3 tracking-tight text-sm">Resources</h4>
                            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <li>
                                    <Link to="/how-to-use" className="hover:text-zinc-900 dark:hover:text-white transition-colors">How to Use & Docs</Link>
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
                    <span>© {new Date().getFullYear()} MentorSync. Built for educators • Crafted in India.</span>
                    <span className="mt-2 sm:mt-0 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> All systems operational</span>
                </div>
            </footer>

        </div>
    );
}
