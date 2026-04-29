import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Activity, Users, LayoutDashboard, ChevronRight, CheckCircle, Sparkles, Target, Award, Code2Icon,  } from 'lucide-react';

export function LandingPage() {
    const [activeTab, setActiveTab] = useState<'mentor' | 'student'>('student');

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#5b4fff] selection:text-white overflow-x-hidden font-sans relative">

            {/* Background Base */}
            <div className="fixed inset-0 z-0 bg-[#050505]">
                {/* Unique dot grid texture background */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[24px_24px] opacity-[0.03] pointer-events-none"></div>
                {/* Elegant Vercel-like Top Glow */}
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-300 h-150 bg-linear-to-b from-[#5b4fff]/20 via-[#5b4fff]/5 to-transparent blur-[100px] rounded-full pointer-events-none"></div>
            </div>

            {/* Floating Header */}
            <header className="fixed top-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] max-w-5xl z-50 rounded-2xl bg-[#0a0a0a]/60 backdrop-blur-2xl border border-white/5 shadow-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all">
                <div className="flex items-center gap-3">
                    <div className="bg-[#5b4fff] p-2.5 rounded-xl flex items-center justify-center shadow-lg">
                        <Terminal className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white hidden sm:block">LeetTracker</span>
                </div>
                <nav className="flex items-center gap-4 sm:gap-6">
                    <Link to="/login" className="text-[14px] font-medium text-zinc-400 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">Sign In</Link>
                    <Link to="/login" className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_0_20px_rgba(91,79,255,0.2)] text-white text-[14px] font-medium px-5 sm:px-6 py-2.5 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">Get Started</Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-36 sm:pt-48 pb-20 sm:pb-32 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center">

                {/* Hero Section */}
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-28 sm:mb-40">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-[#111111]/80 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <span className="flex h-2 w-2 rounded-full bg-[#5b4fff] animate-pulse"></span>
                        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-zinc-300 uppercase">The Ultimate Classroom Tool</span>
                    </div>

                    <h1 className="text-[11vw] leading-[1.1] sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-6 sm:mb-8 sm:leading-[1.05] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance">
                        Track LeetCode <br className="hidden sm:block"/>
                        <span className="text-transparent bg-clip-text bg-linear-to-br from-white via-white to-[#5b4fff]">Like Never Before.</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        A modern OS for coding bootcamps and mentors. Automate tracking, validate submissions, and foster friendly competition seamlessly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link to="/login" className="w-full sm:w-auto bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_0_30px_rgba(91,79,255,0.3)] text-white text-[15px] font-medium px-8 py-4 rounded-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]">
                            Start for Free <ChevronRight className="w-4 h-4" />
                        </Link>
                        <a href="#features" className="w-full sm:w-auto bg-[#0a0a0a] border border-white/8 text-white text-[15px] font-medium px-8 py-4 hover:bg-[#111111] hover:border-white/15 shadow-lg rounded-xl transition-all flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]">
                            Explore Features
                        </a>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent mb-16 sm:mb-24"></div>

                {/* Two-Sided Ecosystem Tabs Section */}
                <section className="w-full  relative z-10 scroll-mt-32">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">Built for Both Sides</h2>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">A unified ecosystem where administrators track with ease and students thrive.</p>
                    </div>

                    <div className="flex bg-[#0a0a0a]/80 backdrop-blur-3xl p-1.5 rounded-2xl w-max mx-auto mb-10 border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)] transition-all">
                        <button
                            onClick={() => setActiveTab('mentor')}
                            className={`px-6 sm:px-8 py-3 text-[14px] sm:text-[15px] font-medium rounded-xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${activeTab === 'mentor' ? 'bg-[#1a1a1a] text-white shadow-md border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/2'}`}
                        >
                            For Mentors
                        </button>
                        <button
                            onClick={() => setActiveTab('student')}
                            className={`px-6 sm:px-8 py-3 text-[14px] sm:text-[15px] font-medium rounded-xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${activeTab === 'student' ? 'bg-[#1a1a1a] text-white shadow-md border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/2'}`}
                        >
                            For Students
                        </button>
                    </div>

                    {/* Tab Content Block */}
                    <div className="max-w-5xl mx-auto bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-3xl p-6 sm:p-12 min-h-95 shadow-2xl overflow-hidden relative group/tab">
                        <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none"></div>
                        {activeTab === 'mentor' ? (
                            <div className="grid md:grid-cols-2 gap-10 items-center animate-in fade-in slide-in-from-right-4 duration-500">
                                <div>
                                    <div className="bg-[#1a1b2e] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl mb-6 border border-[#5b4fff]/20">
                                        <Users className="h-6 w-6 text-[#968fff]" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">Manage Entire Cohorts</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 leading-relaxed text-[15px]">Create boundless classrooms and organize your students effectively.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 leading-relaxed text-[15px]">Assign lists of target LeetCode problems natively to the entire class.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 leading-relaxed text-[15px]">Instantly flag plagiarized or invalid URL submissions with automated 1-click validation.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-37.5 h-37.5 bg-[#5b4fff]/20 blur-[60px] rounded-full pointer-events-none"></div>
                                    <div className="space-y-3 relative z-10 w-full">
                                        <div className="flex justify-between items-center bg-[#141414] p-3.5 rounded-xl border border-zinc-800/50">
                                            <span className="text-sm font-medium">Batch '24 Placement</span>
                                            <span className="text-xs bg-[#5b4fff]/20 text-[#968fff] px-2.5 py-1 rounded-md font-semibold">80 Students</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#141414] p-3.5 rounded-xl border border-zinc-800/50">
                                            <span className="text-sm font-medium">DSA Fast Track</span>
                                            <span className="text-xs bg-[#5b4fff]/20 text-[#968fff] px-2.5 py-1 rounded-md font-semibold">120 Students</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-[#141414] p-3.5 rounded-xl border border-zinc-800/50 opacity-40">
                                            <span className="text-sm font-medium">System Design</span>
                                            <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md font-semibold">Draft</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-10 items-center animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="order-2 md:order-1 bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 left-0 w-37.5 h-37.5 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                                    <div className="flex justify-between items-end mb-6 relative z-10">
                                        <div>
                                            <p className="text-[11px] text-zinc-500 font-bold mb-1 uppercase tracking-widest">Consistency Streak</p>
                                            <p className="text-4xl font-black text-white tracking-tight">42<span className="text-lg text-zinc-500 font-medium tracking-normal ml-1">days</span></p>
                                        </div>
                                        <Award className="w-12 h-12 text-emerald-400 opacity-90" />
                                    </div>
                                    <div className="grid grid-cols-7 gap-1.5 relative z-10 w-full rounded-lg overflow-hidden">
                                        {Array.from({length: 28}).map((_, i) => (
                                            <div key={i} className={`w-full aspect-square rounded-[3px] shadow-sm ${i % 5 === 0 || i % 7 === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-800/80'}`}></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="order-1 md:order-2">
                                    <div className="bg-[#1a1b2e] w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl mb-6 border border-[#5b4fff]/20">
                                        <Target className="h-6 w-6 text-[#968fff]" strokeWidth={2} />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">Compete, Learn, Grow</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 leading-relaxed text-[15px]">See your progress mapped against your classmates on live cohort leaderboards.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 leading-relaxed text-[15px]">Get a beautiful and dynamic heatmap analyzing your 365-day technical consistency.</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-[#5b4fff] shrink-0 mt-0.5" />
                                            <span className="text-zinc-300 leading-relaxed text-[15px]">Submit answers actively and unlock profile achievements along your journey.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Divider Line */}
                <div className="w-full h-px bg-linear-to-r from-transparent via-zinc-800 to-transparent my-24 sm:my-24  "></div>

                {/* Bento Grid Features */}
                <section id="features" className="w-full  scroll-mt-32 relative z-10">
                    <div className="text-center mb-12 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-[#111111]/80 backdrop-blur-md mb-6">
                            <Sparkles className="w-4 h-4 text-[#5b4fff]" />
                            <span className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">Power Tools</span>
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-balance">Everything You Need</h2>
                        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">A modern toolkit designed to help you run, track, and scale your coding cohorts efficiently.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:auto-rows-[340px]">

                        {/* Large Card 1 */}
                        <div className="md:col-span-2 bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-end relative overflow-hidden group hover:border-white/10 hover:bg-[#0c0c0c] transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 sm:p-10">
                                <div className="bg-[#1a1b2e] w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300 border border-[#5b4fff]/20">
                                    <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-[#968fff]" strokeWidth={2} />
                                </div>
                            </div>
                            {/* Abstract Ambient Blob */}
                            <div className="absolute top-[10%] right-[10%] w-50 h-50 bg-[#5b4fff]/20 blur-[90px] rounded-full pointer-events-none"></div>

                            <div className="relative z-10 w-full md:max-w-[70%]">
                                <h3 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Live Progress Tracking</h3>
                                <p className="text-zinc-400 text-[15px] sm:text-base leading-relaxed">
                                    Instantly sync your students' LeetCode profiles. View problem stats, daily heatmaps, and consistency streaks in real-time without manual spreadsheets.
                                </p>
                            </div>
                        </div>

                        {/* Small Card 1 */}
                        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between group relative overflow-hidden hover:border-white/10 hover:bg-[#0c0c0c] transition-all duration-500">
                            <div className="bg-[#1a1b2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300 border border-[#5b4fff]/20">
                                <CheckCircle className="h-7 w-7 text-[#968fff]" strokeWidth={2} />
                            </div>
                            <div className="mt-8">
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">Smart Validation</h3>
                                <p className="text-[14px] sm:text-[15px] text-zinc-400 leading-relaxed">Automated submission checking directly from URLs.</p>
                            </div>
                        </div>

                        {/* Small Card 2 */}
                        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between group relative overflow-hidden hover:border-white/10 hover:bg-[#0c0c0c] transition-all duration-500">
                            <div className="bg-[#1a1b2e] w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300 border border-[#5b4fff]/20">
                                <LayoutDashboard className="h-7 w-7 text-[#968fff]" strokeWidth={2} />
                            </div>
                            <div className="mt-8">
                                <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">Clear Assignments</h3>
                                <p className="text-[14px] sm:text-[15px] text-zinc-400 leading-relaxed">Manage cohort problem-sets effortlessly.</p>
                            </div>
                        </div>

                        {/* Large Card 2 */}
                        <div className="md:col-span-2 bg-[#0a0a0a]/80 backdrop-blur-3xl p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-white/10 hover:bg-[#0c0c0c] transition-all duration-500">

                            <div className="flex items-end gap-2 sm:gap-3 mb-8 sm:mb-12 relative z-10 w-full h-30 overflow-hidden opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                {/* Abstract Bar Chart Visual */}
                                <div className="h-[40%] w-10 sm:w-14 bg-[#1a1a1a] border border-zinc-800/50 rounded-t-lg"></div>
                                <div className="h-[60%] w-10 sm:w-14 bg-[#1a1a1a] border border-zinc-800/50 rounded-t-lg"></div>
                                <div className="h-[30%] w-10 sm:w-14 bg-[#1a1a1a] border border-zinc-800/50 rounded-t-lg"></div>
                                <div className="h-[80%] w-10 sm:w-14 bg-[#5b4fff]/40 rounded-t-lg backdrop-blur-md"></div>
                                <div className="h-full w-10 sm:w-14 bg-[#5b4fff] rounded-t-lg shadow-[0_0_30px_rgba(91,79,255,0.6)] relative">
                                    <div className="absolute -top-3.75 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white] animate-pulse"></div>
                                </div>
                            </div>

                            <div className="relative z-10 w-full md:max-w-[75%] h-full flex flex-col justify-end">
                                <div className="absolute right-[-10%] bottom-[-20%] pointer-events-none opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                                    {/* <Activity className="h-48 w-48 text-white" /> */}
                                </div>
                                <div className="bg-[#1a1b2e] w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-xl mb-4 sm:mb-5 transform group-hover:scale-110 transition-transform duration-300 border border-[#5b4fff]/20">
                                    <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-[#968fff]" strokeWidth={2} />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">Deep Analytics</h3>
                                <p className="text-zinc-400 text-[15px] sm:text-base leading-relaxed relative z-10">
                                    Drill down into individual student performance. Identify pain points, review problem categories, and offer targeted mentorship.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>
            </main>

            {/* Real Footer Section */}
            <footer className="relative w-full overflow-hidden flex flex-col items-center justify-end z-10 pt-20 pb-8 sm:pb-10 border-t border-zinc-900 bg-[#050508]/80 backdrop-blur-sm">

                <div className="w-full max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start gap-12 mb-24 relative z-20 pointer-events-auto">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-[#5b4fff] p-2 rounded-lg flex items-center justify-center">
                                <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">LeetTracker</span>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                            The operating system for modern coding bootcamps. Empowering educators to track Scalable cohorts natively.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4 tracking-tight">Open Source</h4>
                        <a href="https://github.com/varunkushwah31/Leetcode-Tracker-Frontend" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 px-4 py-2 rounded-xl text-sm font-medium transition-all group outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]">
                            <Code2Icon className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                            <span className="text-zinc-300 group-hover:text-white transition-colors">Star on GitHub</span>
                        </a>
                    </div>
                </div>

                {/* Huge Faded Background Text */}
                <div className="absolute bottom-5 sm:bottom-7.5 left-1/2 -translate-x-1/2 w-[200%] sm:w-[120%] text-center whitespace-nowrap pointer-events-none">
                    <h1 className="text-[20vw] sm:text-[14vw] font-black tracking-tighter text-white opacity-[0.02] select-none uppercase leading-none">
                        LEETCODE TRACKER
                    </h1>
                </div>

                <div className="relative z-20 text-zinc-600 text-xs sm:text-sm font-medium tracking-wide mt-auto pointer-events-auto flex flex-col sm:flex-row items-center justify-between w-full max-w-7xl px-4 sm:px-6">
                    <span>© {new Date().getFullYear()} LeetTracker. Built for educators.</span>
                    <span className="mt-2 sm:mt-0 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> All systems operational</span>
                </div>
            </footer>
        </div>
    );
}
