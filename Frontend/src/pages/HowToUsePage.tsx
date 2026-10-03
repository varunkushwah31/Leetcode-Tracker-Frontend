import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    TerminalIcon,
    ArrowLeftIcon,
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
    CodeIcon,
    SparkleIcon as Sparkles
} from '@phosphor-icons/react';
import { AmbientGlow } from '../components/ui/AmbientGlow';
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
            // Fallback: client-side generate template
            const fallbackCsv = `Name,Email,LeetCode Username,Codeforces Handle\nAlice Sharma,alice@example.com,alicesharma,alice_cf\nBob Kumar,bob@example.com,bobk,bob_codeforces\nCharlie Singh,charlie@example.com,https://leetcode.com/u/charlie,charlie_cf\n`;
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
        <div className="min-h-screen bg-[#f1f3f7] dark:bg-[#09090e] text-zinc-900 dark:text-white bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[24px_24px] bg-fixed selection:bg-[#5b4fff] selection:text-white font-sans relative transition-colors duration-200">

            {/* Ambient Background Glow for Dark Mode */}
            <div className="hidden dark:block">
                <AmbientGlow />
            </div>

            {/* Floating Top Navigation Header */}
            <header className="sticky top-0 z-50 bg-white/85 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-200/90 dark:border-zinc-800/60 px-4 sm:px-8 py-3.5 transition-colors">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="bg-[#5b4fff] p-2.5 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                                <TerminalIcon className="h-5 w-5 text-white" weight="bold" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                                MentorSync
                            </span>
                        </Link>
                        <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                            Docs & Manual
                        </span>
                    </div>

                    <nav className="flex items-center gap-3 sm:gap-5">
                        <Link
                            to="/"
                            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hidden md:inline-flex items-center gap-1.5"
                        >
                            <ArrowLeftIcon className="w-3.5 h-3.5" /> Home
                        </Link>
                        <Link
                            to="/how-to-use"
                            className="text-xs sm:text-sm font-semibold text-[#5b4fff] dark:text-[#968fff] transition-colors hidden md:block"
                        >
                            How to Use
                        </Link>
                        <Link
                            to="/contact"
                            className="text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hidden md:block"
                        >
                            Contact
                        </Link>

                        <ThemeToggle />

                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

                        <Link
                            to="/login"
                            className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/login"
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-xs sm:text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-md shadow-[#5b4fff]/20 hover:-translate-y-0.5"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">

                {/* Hero Title Section */}
                <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-md mb-6 shadow-xs">
                        <Sparkles className="w-4 h-4 text-[#5b4fff]" weight="bold" />
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-700 dark:text-zinc-300 uppercase">
                            Official Application Manual
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white mb-5 leading-tight">
                        How to Use <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#5b4fff] via-[#7d73ff] to-[#4639e6]">
                            MentorSync
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                        Step-by-step instructions, feature walkthroughs, and exhaustive guidelines for bulk student addition via CSV, submission verification, roadmaps, and analytics reports.
                    </p>

                    {/* Section Switcher Tabs */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-8">
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
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                                    activeSection === id
                                        ? 'bg-[#5b4fff] text-white shadow-md shadow-[#5b4fff]/25 scale-105'
                                        : 'bg-white/80 dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <Icon className="w-4 h-4" weight="bold" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-16 sm:space-y-24">

                    {/* SECTION 1: ARCHITECTURE & ROLES OVERVIEW */}
                    {(activeSection === 'all' || activeSection === 'faq') && (
                        <section className="bg-white/90 dark:bg-[#111111]/85 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff]">
                                    <Shield className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">1. Platform Roles & Architecture</h2>
                                    <p className="text-xs sm:text-sm text-zinc-500">Understanding user roles and account capabilities in MentorSync</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-zinc-50/80 dark:bg-[#161726]/50 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-[#5b4fff]/15 text-[#5b4fff] border-[#5b4fff]/30">Mentor</Badge>
                                        <MentorIcon className="w-6 h-6 text-[#5b4fff]" />
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

                                <div className="bg-zinc-50/80 dark:bg-[#161726]/50 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Student</Badge>
                                        <StudentIcon className="w-6 h-6 text-emerald-500" />
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

                                <div className="bg-zinc-50/80 dark:bg-[#161726]/50 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Super Admin</Badge>
                                        <Shield className="w-6 h-6 text-amber-500" />
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

                    {/* SECTION 2: MENTOR GUIDE */}
                    {(activeSection === 'all' || activeSection === 'mentor') && (
                        <section className="bg-white/90 dark:bg-[#111111]/85 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff]">
                                    <MentorIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">2. Mentor Operations Guide</h2>
                                    <p className="text-xs sm:text-sm text-zinc-500">Step-by-step workflow for managing classrooms, assignments, and students</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Step 1 */}
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">1</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Create and Organize Classrooms</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8 leading-relaxed">
                                        In the left sidebar of your Mentor Dashboard, click <strong className="text-zinc-900 dark:text-white">+ Create New Class</strong>. Enter the cohort name (e.g. <em>"DSA Cohort Autumn 2026"</em>). You can switch between active classrooms from the sidebar or the top header dropdown at any time.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">2</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Add Students (Single or Bulk Import)</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8 leading-relaxed">
                                        Click the <strong className="text-zinc-900 dark:text-white">Add Student</strong> button in the top action bar:
                                    </p>
                                    <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="p-3.5 bg-white dark:bg-[#12131e] rounded-xl border border-zinc-200 dark:border-zinc-800">
                                            <p className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">Option A: Single Student</p>
                                            <p className="text-xs text-zinc-500 leading-normal">
                                                Enter their LeetCode username or Codeforces handle. The system automatically initializes their profile, pulls stats asynchronously, and enrolls them into your class.
                                            </p>
                                        </div>
                                        <div className="p-3.5 bg-white dark:bg-[#12131e] rounded-xl border border-zinc-200 dark:border-zinc-800">
                                            <p className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">Option B: Bulk CSV Import</p>
                                            <p className="text-xs text-zinc-500 leading-normal">
                                                Upload a CSV with names, emails, and handles. Auto-provisions accounts for non-existent users and gives real-time line-by-line feedback. <em>(See Section 4 for detailed formatting guidelines.)</em>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">3</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Assign Questions with Smart Platform Auto-Detection</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8 leading-relaxed">
                                        Click <strong className="text-zinc-900 dark:text-white">Assign Question</strong>. You can paste:
                                    </p>
                                    <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-12 space-y-1 list-disc">
                                        <li>Full LeetCode URL: <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">https://leetcode.com/problems/two-sum/</code> or slug: <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">two-sum</code></li>
                                        <li>Full Codeforces URL: <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">https://codeforces.com/problemset/problem/4/A</code> or ID: <code className="text-xs bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">4A</code></li>
                                    </ul>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8 leading-relaxed pt-1">
                                        The platform switches automatically between LeetCode and Codeforces based on the URL you paste. Pick a deadline with custom date/time or click the quick presets (<code className="text-[11px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">+1 Day</code>, <code className="text-[11px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">+3 Days</code>, <code className="text-[11px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">+1 Week</code>).
                                    </p>
                                </div>

                                {/* Step 4 */}
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">4</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Build and Assign Learning Paths (Curriculum Roadmaps)</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8 leading-relaxed">
                                        Click <strong className="text-zinc-900 dark:text-white">Assign Path</strong> → <strong className="text-zinc-900 dark:text-white">Create New Learning Path</strong>. Add sequential questions and specify how many days each problem should take (e.g. 2 days for Question 1, 3 days for Question 2). When assigned to a class, MentorSync calculates cumulative rolling deadlines automatically for every student in the cohort.
                                    </p>
                                </div>

                                {/* Step 5 */}
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-[#5b4fff] text-white text-xs font-black flex items-center justify-center">5</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Monitor Leaderboard, Nudge Students & Inspect Analytics</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 pl-8 leading-relaxed">
                                        - Sort the leaderboard by <em>Total Solved</em>, <em>Daily Streak</em>, <em>Most Pending</em>, or <em>Contest Rating</em>.<br />
                                        - Click <strong className="text-zinc-900 dark:text-white"><BellIcon className="inline w-3.5 h-3.5 text-zinc-500" /> Nudge</strong> on any student with pending assignments to send an automated email reminder.<br />
                                        - Click any student row to view their deep dive: topic mastery, contest performance, submission timeline, and export their individual report.<br />
                                        - Switch to the <strong className="text-zinc-900 dark:text-white">Weakness & Analytics</strong> tab to see overall cohort strengths, completion bottlenecks, and problem solve distributions.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 3: EXHAUSTIVE BULK CSV GUIDELINES */}
                    {(activeSection === 'all' || activeSection === 'csv') && (
                        <section className="bg-white/90 dark:bg-[#111111]/85 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                        <FileSpreadsheet className="w-6 h-6" weight="bold" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">3. Bulk Student Import via CSV Guidelines</h2>
                                        <p className="text-xs sm:text-sm text-zinc-500">Complete specifications, column formats, auto-provisioning details, and samples</p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleDownloadTemplate}
                                    disabled={isDownloadingTemplate}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs font-semibold h-10 px-4 self-start sm:self-auto cursor-pointer flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download CSV Template
                                </Button>
                            </div>

                            {/* Guideline Highlights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1.5">
                                        <CheckCircle className="w-4 h-4" /> Delimiter Auto-Detection
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        You can use standard comma (<code className="font-mono">,</code>), semicolon (<code className="font-mono">;</code>), or tab-delimited (<code className="font-mono">\t</code>) CSV exports directly from Google Sheets or Excel.
                                    </p>
                                </div>

                                <div className="p-4 bg-[#5b4fff]/5 dark:bg-[#5b4fff]/10 border border-[#5b4fff]/20 rounded-2xl">
                                    <div className="flex items-center gap-2 text-[#5b4fff] dark:text-[#968fff] font-bold text-sm mb-1.5">
                                        <Sparkles className="w-4 h-4" /> Zero-Friction Auto-Provisioning
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Students do not need to register before import! MentorSync provisions student accounts in the database automatically and enqueues background profile scraping immediately.
                                    </p>
                                </div>

                                <div className="p-4 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm mb-1.5">
                                        <CodeIcon className="w-4 h-4" /> URL Sanitization
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Paste raw handles (e.g. <code className="font-mono">tourist</code>) or full URLs (e.g. <code className="font-mono">https://leetcode.com/u/tourist</code>). MentorSync strips protocol prefixes and trailing slashes safely.
                                    </p>
                                </div>
                            </div>

                            {/* Format Specification */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>Format 1: Multi-Column Format</span>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Recommended</Badge>
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                    Include the header row with column titles. Any of the following variations are recognized:
                                </p>

                                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-bold uppercase">
                                            <tr>
                                                <th className="py-2.5 px-4">Column</th>
                                                <th className="py-2.5 px-4">Recognized Headers</th>
                                                <th className="py-2.5 px-4">Required?</th>
                                                <th className="py-2.5 px-4">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                                            <tr>
                                                <td className="py-2.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white">Name</td>
                                                <td className="py-2.5 px-4"><code>Name</code>, <code>Student Name</code>, <code>Full Name</code></td>
                                                <td className="py-2.5 px-4"><span className="text-zinc-500">Optional</span></td>
                                                <td className="py-2.5 px-4">Full display name. Falls back to username if empty.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white">Email</td>
                                                <td className="py-2.5 px-4"><code>Email</code>, <code>Email Address</code></td>
                                                <td className="py-2.5 px-4"><span className="text-zinc-500">Optional</span></td>
                                                <td className="py-2.5 px-4">Student email. Auto-generated mock email if omitted.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white">LeetCode Username</td>
                                                <td className="py-2.5 px-4"><code>LeetCode Username</code>, <code>LeetCode</code>, <code>LC</code>, <code>Username</code></td>
                                                <td className="py-2.5 px-4"><span className="text-emerald-600 dark:text-emerald-400 font-bold">Recommended</span></td>
                                                <td className="py-2.5 px-4">Public LeetCode profile handle or URL.</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2.5 px-4 font-mono font-semibold text-zinc-900 dark:text-white">Codeforces Handle</td>
                                                <td className="py-2.5 px-4"><code>Codeforces Handle</code>, <code>Codeforces</code>, <code>CF</code>, <code>CF Handle</code></td>
                                                <td className="py-2.5 px-4"><span className="text-zinc-500">Optional</span></td>
                                                <td className="py-2.5 px-4">Public Codeforces handle or profile URL.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Code Snippet Multi-Column */}
                                <div className="relative mt-3">
                                    <div className="flex items-center justify-between bg-zinc-200/80 dark:bg-zinc-800/80 px-4 py-2 rounded-t-xl border border-zinc-300 dark:border-zinc-700">
                                        <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-semibold">sample_students.csv (Multi-column)</span>
                                        <button
                                            onClick={() => handleCopy(csvSampleMultiColumn, 1)}
                                            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedIndex === 1 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                            {copiedIndex === 1 ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs rounded-b-xl overflow-x-auto border-x border-b border-zinc-800 leading-relaxed">
{csvSampleMultiColumn}
                                    </pre>
                                </div>
                            </div>

                            {/* Format 2: Single Column */}
                            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span>Format 2: Single-Column Usernames List</span>
                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-zinc-400">Quick Mode</Badge>
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                                    Have a raw list of LeetCode handles or Codeforces handles? A single column file with or without a header is processed directly:
                                </p>

                                <div className="relative mt-2">
                                    <div className="flex items-center justify-between bg-zinc-200/80 dark:bg-zinc-800/80 px-4 py-2 rounded-t-xl border border-zinc-300 dark:border-zinc-700">
                                        <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 font-semibold">handles_only.csv</span>
                                        <button
                                            onClick={() => handleCopy(csvSampleSingleColumn, 2)}
                                            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                                        >
                                            {copiedIndex === 2 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                            {copiedIndex === 2 ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <pre className="p-4 bg-zinc-950 text-cyan-400 font-mono text-xs rounded-b-xl overflow-x-auto border-x border-b border-zinc-800 leading-relaxed">
{csvSampleSingleColumn}
                                    </pre>
                                </div>
                            </div>

                            {/* Import Feedback breakdown */}
                            <div className="p-5 bg-zinc-50/80 dark:bg-[#161726]/50 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                    <InfoIcon className="w-4 h-4 text-[#5b4fff]" /> Real-Time Import Response & Status
                                </h4>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    After uploading, MentorSync presents a summary breakdown:
                                </p>
                                <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 pl-4 list-disc">
                                    <li><strong className="text-emerald-600 dark:text-emerald-400">Added Count:</strong> Students newly registered and enrolled into the classroom cohort.</li>
                                    <li><strong className="text-blue-600 dark:text-blue-400">Already Enrolled:</strong> Students that were already active members of this classroom.</li>
                                    <li><strong className="text-rose-600 dark:text-rose-400">Failures:</strong> Any malformed row or duplicate unique constraint with the line number and exact reason provided.</li>
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* SECTION 4: STUDENT GUIDE */}
                    {(activeSection === 'all' || activeSection === 'student') && (
                        <section className="bg-white/90 dark:bg-[#111111]/85 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                                    <StudentIcon className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">4. Student Guide & Tracking</h2>
                                    <p className="text-xs sm:text-sm text-zinc-500">Connecting handles, completing assignments, auto-validation, and portfolio export</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-500 text-white text-xs font-black flex items-center justify-center">1</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Connect Your Coding Handles</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        In your Student Dashboard, click your profile card to link your LeetCode username and Codeforces handle. Make sure your profiles are public so statistics can be scraped.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-500 text-white text-xs font-black flex items-center justify-center">2</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Syncing Profile Stats</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        The system polls and refreshes stats automatically. After solving an assignment, click <strong className="text-zinc-900 dark:text-white">Sync Profile</strong> in the top bar to force an immediate refresh from LeetCode & Codeforces.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-500 text-white text-xs font-black flex items-center justify-center">3</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Submitting & Validating Assignments</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        In the <strong className="text-zinc-900 dark:text-white">Pending Assignments</strong> card, click the problem title to open the problem. Once solved, click <strong className="text-zinc-900 dark:text-white">Auto Validate</strong> to check recent Accepted submissions, or paste your solution URL for instant verification.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-cyan-500 text-white text-xs font-black flex items-center justify-center">4</span>
                                        <h3 className="font-bold text-zinc-900 dark:text-white text-base">Unified Contest History & Heatmaps</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        View a unified, chronological timeline of your LeetCode Weekly/Biweekly contests and Codeforces Division contests in one place. Toggle filters for <em>All</em>, <em>LeetCode</em>, or <em>Codeforces</em> to track rating growth.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 5: REPORTING & CSV EXPORTS */}
                    {(activeSection === 'all' || activeSection === 'reports') && (
                        <section className="bg-white/90 dark:bg-[#111111]/85 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                                    <Download className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">5. Reporting & CSV Exports</h2>
                                    <p className="text-xs sm:text-sm text-zinc-500">All available data export endpoints, schemas, and usage</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">Classroom</Badge>
                                        <Download className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">Classroom Leaderboard CSV</h3>
                                    <p className="text-xs text-zinc-500">
                                        Exported by clicking <strong>Export Leaderboard</strong> in the Leaderboard tab. Contains student ranks, emails, handles, total solved, LC rank, CF rating, max rating, streaks, and assignment counts.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30">Matrix</Badge>
                                        <FileSpreadsheet className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">Assignment Completion Matrix</h3>
                                    <p className="text-xs text-zinc-500">
                                        Exported by clicking <strong>Export Matrix</strong> in the Leaderboard tab. Produces a 2D grid of students × assignments, with each cell marked as <code className="font-mono">COMPLETED</code> or <code className="font-mono">PENDING</code>.
                                    </p>
                                </div>

                                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Individual</Badge>
                                        <TrophyIcon className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">Student Performance Report</h3>
                                    <p className="text-xs text-zinc-500">
                                        Exported from the Student Dashboard (<strong>Export Report</strong>), student details view, or directly per-row on the leaderboard. Contains 6 detailed sections: summary, topic mastery, assignments, recent submissions, and unified contest history.
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SECTION 6: FAQ & TROUBLESHOOTING */}
                    {(activeSection === 'all' || activeSection === 'faq') && (
                        <section className="bg-white/90 dark:bg-[#111111]/85 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                    <HelpCircle className="w-6 h-6" weight="bold" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">6. Frequently Asked Questions & Troubleshooting</h2>
                                    <p className="text-xs sm:text-sm text-zinc-500">Quick answers to common questions and edge cases</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    {
                                        q: "Why does the student's solved count not update immediately after solving a problem?",
                                        a: "LeetCode and Codeforces have caching layers and rate limits. Clicking 'Sync Profile' in the student dashboard or 'Sync Class Data' in the mentor dashboard directly queries the external platform APIs and refreshes database metrics in real time."
                                    },
                                    {
                                        q: "What happens if a student does not have an email in the CSV during bulk import?",
                                        a: "MentorSync automatically provisions the student with a unique surrogate email address (<username>_<uuid>@student.mentorsync.local) to guarantee database integrity. The student can log in and update their email later."
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
                                    <div key={`faq-${idx}`} className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-[#161726]/50 border border-zinc-200/80 dark:border-zinc-800/70 space-y-1.5">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="text-[#5b4fff]">Q:</span> {q}
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
                <div className="mt-16 text-center p-10 bg-linear-to-b from-white/90 to-zinc-100/90 dark:from-[#111111]/90 dark:to-[#161726]/80 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-lg">
                    <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-3 tracking-tight">
                        Ready to empower your cohort?
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto mb-6">
                        Start tracking your students with automated LeetCode and Codeforces synchronization today.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/login"
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#5b4fff]/25 hover:-translate-y-0.5"
                        >
                            Get Started Now
                        </Link>
                        <Link
                            to="/contact"
                            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 py-8 px-4 text-center text-xs text-zinc-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <TerminalIcon className="w-4 h-4 text-[#5b4fff]" weight="bold" />
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">MentorSync</span>
                        <span>• User Guide & Documentation</span>
                    </div>
                    <span>© {new Date().getFullYear()} MentorSync. All rights reserved.</span>
                </div>
            </footer>

        </div>
    );
}
