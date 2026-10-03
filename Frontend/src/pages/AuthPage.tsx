import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TerminalIcon, PulseIcon as Activity, WarningCircleIcon as AlertCircle, UsersIcon, SquaresFourIcon as LayoutDashboard, GlobeIcon, SpinnerIcon as Loader2, ArrowLeftIcon, CodeIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';

export function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login, registerMentor, registerStudent } = useAuth();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', leetcodeUsername: '', codeforcesHandle: '',
  });

  const handleAuth = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else if (role === 'student') {
        const lcTrim = formData.leetcodeUsername?.trim();
        const cfTrim = formData.codeforcesHandle?.trim();
        if (!lcTrim && !cfTrim) {
          setError("Please provide at least one platform username (LeetCode or Codeforces).");
          setIsLoading(false);
          return;
        }
        await registerStudent({
          ...formData,
          leetcodeUsername: lcTrim || undefined,
          codeforcesHandle: cfTrim || undefined,
        });
      } else {
        await registerMentor({
          name: formData.name, email: formData.email, password: formData.password
        });
      }

      // Successfully authenticated, go straight to dashboard
      navigate('/dashboard');

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError(null);
  };

  return (
      <div className="min-h-screen flex text-white font-sans selection:bg-[#5b4fff] selection:text-white relative">
        {/* Single Back to Home Navigation Button */}
        <Link
          to="/"
          className="fixed top-5 left-5 sm:top-6 sm:left-6 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold transition-all hover:-translate-x-0.5 shadow-lg backdrop-blur-md"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Left Panel - Visuals & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#09090e] border-r border-zinc-900 flex-col justify-center p-10 xl:p-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
          <div className="relative z-10 w-full max-w-lg mx-auto">
            <div className="mb-8">
              <BrandLogo size="md" theme="dark" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
              The modern OS for <br />
              <span className="text-[#968fff]">Coding Bootcamps.</span>
            </h1>
            <p className="text-zinc-400 text-[16px] leading-relaxed mb-8 max-w-105">
              Track, assign, and validate your students' LeetCode & Codeforces progress through an automated, data-rich dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3 xl:gap-4">
              <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors">
                <div className="bg-[#1a1b2e] w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <Activity className="h-4 w-4 text-[#968fff]" />
                </div>
                <h3 className="text-white font-semibold text-[14px] mb-1 tracking-tight">Live Tracking</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Real-time sync with LeetCode & Codeforces</p>
              </div>
              <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors">
                <div className="bg-[#1a1b2e] w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <AlertCircle className="h-4 w-4 text-[#968fff]" />
                </div>
                <h3 className="text-white font-semibold text-[14px] mb-1 tracking-tight">Smart Assignments</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Automated validation & scoring</p>
              </div>
              <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors">
                <div className="bg-[#1a1b2e] w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <UsersIcon className="h-4 w-4 text-[#968fff]" />
                </div>
                <h3 className="text-white font-semibold text-[14px] mb-1 tracking-tight">Leaderboards</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Gamified cohort rankings</p>
              </div>
              <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors">
                <div className="bg-[#1a1b2e] w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <LayoutDashboard className="h-4 w-4 text-[#968fff]" />
                </div>
                <h3 className="text-white font-semibold text-[14px] mb-1 tracking-tight">Analytics</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Progress heatmaps & reports</p>
              </div>
            </div>
          </div>
        </div>
        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-[#0a0a0a] min-h-screen overflow-y-auto">
          <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none"></div>
          <AmbientGlow variant="center" />

          <div className="w-full max-w-lg relative z-10 bg-[#111111]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-800/60 shadow-[0_8px_40px_rgb(0,0,0,0.5)] my-auto mt-14 sm:my-auto">
            {/* Mobile Header with Logo */}
            <div className="flex items-center mb-4 pb-3 border-b border-zinc-800/60 lg:hidden">
              <BrandLogo size="sm" theme="dark" />
            </div>
            <div className="mb-4 sm:mb-5">
              <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight mb-1">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm">
                {isLogin ? 'Sign in to your account to continue.' : 'Fill in your details to get started.'}
              </p>
            </div>
            <ErrorBanner message={error} />

            {/* Standard Login / Register Form */}
            {!isLogin && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950/60 rounded-xl mb-4 border border-zinc-800/80">
                  <button
                      type="button"
                      className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                          role === 'student'
                              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                      }`}
                      onClick={() => { setRole('student'); clearError(); }}
                  >
                    Student
                  </button>
                  <button
                      type="button"
                      className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                          role === 'mentor'
                              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                      }`}
                      onClick={() => { setRole('mentor'); clearError(); }}
                  >
                    Mentor
                  </button>
                </div>
            )}
            <form onSubmit={handleAuth} className="space-y-3.5">
              {!isLogin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Full Name</Label>
                      <Input
                          required
                          autoComplete="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => { setFormData({...formData, name: e.target.value}); clearError(); }}
                          className="bg-[#18181b] border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] focus-visible:border-transparent h-10 rounded-xl w-full transition-all px-3.5 text-sm hover:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Email Address</Label>
                      <Input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                          className="bg-[#18181b] border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] focus-visible:border-transparent h-10 rounded-xl w-full transition-all px-3.5 text-sm hover:border-zinc-700"
                      />
                    </div>
                  </div>
              ) : (
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Email Address</Label>
                    <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                        className="bg-[#18181b] border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] focus-visible:border-transparent h-10 rounded-xl w-full transition-all px-3.5 text-sm hover:border-zinc-700"
                    />
                  </div>
              )}

              {!isLogin && role === 'student' && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <CodeIcon className="w-4 h-4 text-[#968fff]" weight="bold" />
                        <span className="text-xs font-semibold text-zinc-200 tracking-wide uppercase">Coding Platforms</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/60">
                        At least 1 required
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffa116]" />
                            <Label className="uppercase text-[10px] tracking-wider text-zinc-300 font-semibold">LeetCode</Label>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-normal">optional</span>
                        </div>
                        <div className="relative">
                          <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input
                              autoComplete="username"
                              placeholder="username"
                              value={formData.leetcodeUsername}
                              onChange={(e) => { setFormData({...formData, leetcodeUsername: e.target.value}); clearError(); }}
                              className="bg-[#141416] border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] focus-visible:border-transparent pl-9 h-10 rounded-xl w-full transition-all text-sm hover:border-zinc-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            <Label className="uppercase text-[10px] tracking-wider text-zinc-300 font-semibold">Codeforces</Label>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-normal">optional</span>
                        </div>
                        <div className="relative">
                          <TerminalIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input
                              autoComplete="username"
                              placeholder="handle"
                              value={formData.codeforcesHandle}
                              onChange={(e) => { setFormData({...formData, codeforcesHandle: e.target.value}); clearError(); }}
                              className="bg-[#141416] border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] focus-visible:border-transparent pl-9 h-10 rounded-xl w-full transition-all text-sm hover:border-zinc-700"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Provide your handle for either platform to initialize tracking. You can connect the remaining platform at any time from your dashboard.
                    </p>
                  </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Password</Label>
                  {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setError("Password reset link will be sent to your registered email address.");
                        }}
                        className="text-xs text-[#968fff] hover:text-[#b4afff] transition-colors font-medium cursor-pointer bg-transparent border-none p-0"
                      >
                        Forgot password?
                      </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      minLength={6}
                      value={formData.password}
                      onChange={(e) => { setFormData({...formData, password: e.target.value}); clearError(); }}
                      className="bg-[#18181b] border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] focus-visible:border-transparent h-10 rounded-xl w-full tracking-widest font-mono transition-all px-3.5 pr-10 text-sm hover:border-zinc-700"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                        <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                        <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {!isLogin && (
                    <p className="text-[11px] text-zinc-500">Minimum 6 characters required.</p>
                )}
              </div>
              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-3 bg-transparent border border-zinc-700 text-white text-sm font-medium hover:bg-zinc-800 rounded-xl transition-all duration-200 flex items-center justify-center hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <p className="text-zinc-500 text-xs sm:text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  className="border border-zinc-700 text-white rounded-lg px-3 py-1 text-xs sm:text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-center text-xs">
              <Link
                to="/contact"
                className="text-zinc-500 hover:text-[#968fff] transition-colors font-medium flex items-center gap-1.5"
              >
                <span>Need help? Contact support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}