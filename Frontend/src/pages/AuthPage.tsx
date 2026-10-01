import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TerminalIcon, PulseIcon as Activity, WarningCircleIcon as AlertCircle, UsersIcon, SquaresFourIcon as LayoutDashboard, GlobeIcon, SpinnerIcon as Loader2, ArrowLeftIcon } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';

export function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <div className="flex items-center gap-3 mb-8">
              <Link to="/" className="flex items-center gap-3 group w-max">
                <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                  <TerminalIcon className="h-5 w-5 text-white" weight="bold" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">MentorSync</span>
              </Link>
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
              <div className="flex items-center gap-2.5">
                <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg">
                  <TerminalIcon className="h-5 w-5 text-white" weight="bold" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">MentorSync</span>
              </div>
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
                <div className="flex bg-[#1a1a1a] p-1 rounded-xl mb-4 border border-zinc-800">
                  <button
                      type="button"
                      className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                          role === 'student'
                              ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50'
                              : 'text-zinc-500 hover:text-white'
                      }`}
                      onClick={() => { setRole('student'); clearError(); }}
                  >
                    Student
                  </button>
                  <button
                      type="button"
                      className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                          role === 'mentor'
                              ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50'
                              : 'text-zinc-500 hover:text-white'
                      }`}
                      onClick={() => { setRole('mentor'); clearError(); }}
                  >
                    Mentor
                  </button>
                </div>
            )}
            <form onSubmit={handleAuth} className="space-y-3">
              {!isLogin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Full Name</Label>
                      <Input
                          required
                          autoComplete="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => { setFormData({...formData, name: e.target.value}); clearError(); }}
                          className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full transition-all px-3.5 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Email Address</Label>
                      <Input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                          className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full transition-all px-3.5 text-sm"
                      />
                    </div>
                  </div>
              ) : (
                  <div className="space-y-1">
                    <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Email Address</Label>
                    <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                        className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full transition-all px-3.5 text-sm"
                    />
                  </div>
              )}

              {!isLogin && role === 'student' && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="py-2 px-3 rounded-xl bg-[#5b4fff]/10 border border-[#5b4fff]/20 text-[11px] sm:text-xs text-zinc-300 flex items-center gap-2">
                      <span>💡</span>
                      <span>Enter your <strong className="text-white">LeetCode</strong> or <strong className="text-white">Codeforces</strong> handle (or both).</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">LeetCode</Label>
                          <span className="text-[10px] text-zinc-500 font-normal">optional</span>
                        </div>
                        <div className="relative">
                          <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input
                              autoComplete="username"
                              placeholder="neetcode123"
                              value={formData.leetcodeUsername}
                              onChange={(e) => { setFormData({...formData, leetcodeUsername: e.target.value}); clearError(); }}
                              className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] pl-9 h-10 rounded-xl w-full transition-all text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Codeforces</Label>
                          <span className="text-[10px] text-zinc-500 font-normal">optional</span>
                        </div>
                        <div className="relative">
                          <TerminalIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                          <Input
                              autoComplete="username"
                              placeholder="tourist"
                              value={formData.codeforcesHandle}
                              onChange={(e) => { setFormData({...formData, codeforcesHandle: e.target.value}); clearError(); }}
                              className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] pl-9 h-10 rounded-xl w-full transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              <div className="space-y-1">
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
                <Input
                    type="password"
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => { setFormData({...formData, password: e.target.value}); clearError(); }}
                    className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full tracking-widest font-mono transition-all px-3.5 text-sm"
                />
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

            <div className="relative my-3.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111111] px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
                const serverRoot = apiBase.startsWith('http') ? apiBase.replace(/\/api\/?$/, '') : '';
                window.location.href = `${serverRoot}/oauth2/authorization/google`;
              }}
              className="w-full h-10 bg-transparent hover:bg-zinc-800 border border-zinc-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
            <div className="mt-4 flex items-center justify-center gap-2.5">
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