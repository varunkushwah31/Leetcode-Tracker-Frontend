import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TerminalIcon, PulseIcon as Activity, WarningCircleIcon as AlertCircle, UsersIcon, SquaresFourIcon as LayoutDashboard, GlobeIcon, SpinnerIcon as Loader2, ArrowLeftIcon, CodeIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { useAuth } from '../hooks/useAuth';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import {
  extractLeetcodeUsername,
  extractCodeforcesHandle,
  isLeetCodeUrl,
  isCodeforcesUrl,
  sanitizePlatformHandles
} from '../lib/handleExtractor';

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = location.pathname === '/register';
  const [isLogin, setIsLogin] = useState(!isRegisterRoute);
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Keep isLogin aligned if route changes via browser history or navigation
  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const toggleAuthMode = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    setError(null);
    navigate(newIsLogin ? '/login' : '/register');
  };

  const { login, registerMentor, registerStudent } = useAuth();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', leetcodeUsername: '', codeforcesHandle: '',
  });

  const handleLeetcodeChange = (val: string) => {
    clearError();
    if (isCodeforcesUrl(val)) {
      const extractedCf = extractCodeforcesHandle(val);
      setFormData(prev => ({
        ...prev,
        codeforcesHandle: extractedCf,
        leetcodeUsername: isCodeforcesUrl(prev.leetcodeUsername) ? '' : prev.leetcodeUsername
      }));
      return;
    }
    setFormData(prev => ({ ...prev, leetcodeUsername: val }));
  };

  const handleLeetcodeBlur = () => {
    if (formData.leetcodeUsername && isLeetCodeUrl(formData.leetcodeUsername)) {
      setFormData(prev => ({
        ...prev,
        leetcodeUsername: extractLeetcodeUsername(prev.leetcodeUsername)
      }));
    }
  };

  const handleLeetcodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (isCodeforcesUrl(text)) {
      e.preventDefault();
      clearError();
      const extractedCf = extractCodeforcesHandle(text);
      setFormData(prev => ({ ...prev, codeforcesHandle: extractedCf }));
    } else if (isLeetCodeUrl(text)) {
      e.preventDefault();
      clearError();
      const extractedLc = extractLeetcodeUsername(text);
      setFormData(prev => ({ ...prev, leetcodeUsername: extractedLc }));
    }
  };

  const handleCodeforcesChange = (val: string) => {
    clearError();
    if (isLeetCodeUrl(val)) {
      const extractedLc = extractLeetcodeUsername(val);
      setFormData(prev => ({
        ...prev,
        leetcodeUsername: extractedLc,
        codeforcesHandle: isLeetCodeUrl(prev.codeforcesHandle) ? '' : prev.codeforcesHandle
      }));
      return;
    }
    setFormData(prev => ({ ...prev, codeforcesHandle: val }));
  };

  const handleCodeforcesBlur = () => {
    if (formData.codeforcesHandle && isCodeforcesUrl(formData.codeforcesHandle)) {
      setFormData(prev => ({
        ...prev,
        codeforcesHandle: extractCodeforcesHandle(prev.codeforcesHandle)
      }));
    }
  };

  const handleCodeforcesPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (isLeetCodeUrl(text)) {
      e.preventDefault();
      clearError();
      const extractedLc = extractLeetcodeUsername(text);
      setFormData(prev => ({ ...prev, leetcodeUsername: extractedLc }));
    } else if (isCodeforcesUrl(text)) {
      e.preventDefault();
      clearError();
      const extractedCf = extractCodeforcesHandle(text);
      setFormData(prev => ({ ...prev, codeforcesHandle: extractedCf }));
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else if (role === 'student') {
        const { leetcodeUsername: cleanLc, codeforcesHandle: cleanCf } = sanitizePlatformHandles(
          formData.leetcodeUsername,
          formData.codeforcesHandle
        );
        if (!cleanLc && !cleanCf) {
          setError("Please provide at least one platform username (LeetCode or Codeforces).");
          setIsLoading(false);
          return;
        }
        await registerStudent({
          ...formData,
          leetcodeUsername: cleanLc || undefined,
          codeforcesHandle: cleanCf || undefined,
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
      <div className="min-h-screen flex bg-[#f1f3f7] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white font-sans selection:bg-[#5b4fff] selection:text-white relative transition-colors duration-200">
        {/* Navigation & Controls */}
        <Link
          to="/"
          className="fixed top-5 left-5 sm:top-6 sm:left-6 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 text-xs font-semibold transition-all hover:-translate-x-0.5 shadow-md backdrop-blur-md"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="fixed top-5 right-5 sm:top-6 sm:right-6 z-30 flex items-center gap-2.5">
          <ThemeToggle className="bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 shadow-md backdrop-blur-md" />
        </div>

        {/* Left Panel - Visuals & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-50 dark:bg-[#09090e] border-r border-zinc-200 dark:border-zinc-900 flex-col justify-center p-10 xl:p-16 transition-colors duration-200">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
          <div className="relative z-10 w-full max-w-lg mx-auto">
            <div className="mb-8">
              <BrandLogo size="md" theme="auto" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-zinc-900 dark:text-white">
              The modern OS for <br />
              <span className="text-[#5b4fff] dark:text-[#968fff]">Coding Bootcamps.</span>
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-[16px] leading-relaxed mb-8 max-w-105">
              Track, assign, and validate your students' LeetCode & Codeforces progress through an automated, data-rich dashboard.
            </p>
            <div className="grid grid-cols-2 gap-3 xl:gap-4">
              <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors shadow-xs">
                <div className="bg-indigo-50 dark:bg-[#1a1b2e] border border-indigo-100 dark:border-[#5b4fff]/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <Activity className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                </div>
                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-1 tracking-tight">Live Tracking</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Real-time sync with LeetCode & Codeforces</p>
              </div>
              <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors shadow-xs">
                <div className="bg-indigo-50 dark:bg-[#1a1b2e] border border-indigo-100 dark:border-[#5b4fff]/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <AlertCircle className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                </div>
                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-1 tracking-tight">Smart Assignments</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Automated validation & scoring</p>
              </div>
              <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors shadow-xs">
                <div className="bg-indigo-50 dark:bg-[#1a1b2e] border border-indigo-100 dark:border-[#5b4fff]/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <UsersIcon className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                </div>
                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-1 tracking-tight">Leaderboards</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Gamified cohort rankings</p>
              </div>
              <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors shadow-xs">
                <div className="bg-indigo-50 dark:bg-[#1a1b2e] border border-indigo-100 dark:border-[#5b4fff]/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <LayoutDashboard className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                </div>
                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-1 tracking-tight">Analytics</h3>
                <p className="text-[13px] text-zinc-500 leading-snug pr-2">Progress heatmaps & reports</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-[#f8fafc] dark:bg-[#0a0a0a] min-h-screen overflow-y-auto transition-colors duration-200">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none"></div>
          <div className="hidden dark:block">
            <AmbientGlow variant="center" />
          </div>

          <div className="w-full max-w-lg relative z-10 bg-white/95 dark:bg-[#111111]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-xl my-auto mt-14 sm:my-auto">
            {/* Mobile Header with Logo */}
            <div className="flex items-center mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800/60 lg:hidden">
              <BrandLogo size="sm" theme="auto" />
            </div>
            <div className="mb-4 sm:mb-5">
              <h2 className="text-2xl sm:text-[26px] font-bold text-zinc-900 dark:text-white tracking-tight mb-1">
                {isLogin ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
                {isLogin ? 'Sign in to your account to continue.' : 'Fill in your details to get started.'}
              </p>
            </div>
            <ErrorBanner message={error} />

            {/* Standard Login / Register Form */}
            {!isLogin && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950/60 rounded-xl mb-4 border border-zinc-200 dark:border-zinc-800/80">
                  <button
                      type="button"
                      className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                          role === 'student'
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700/60'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      onClick={() => { setRole('student'); clearError(); }}
                  >
                    Student
                  </button>
                  <button
                      type="button"
                      className={`py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                          role === 'mentor'
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700/60'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
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
                      <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Full Name</Label>
                      <Input
                          required
                          autoComplete="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => { setFormData({...formData, name: e.target.value}); clearError(); }}
                          className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full transition-all px-3.5 text-sm hover:border-zinc-400 dark:hover:border-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Email Address</Label>
                      <Input
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                          className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full transition-all px-3.5 text-sm hover:border-zinc-400 dark:hover:border-zinc-700"
                      />
                    </div>
                  </div>
              ) : (
                  <div className="space-y-1.5">
                    <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Email Address</Label>
                    <Input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                        className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full transition-all px-3.5 text-sm hover:border-zinc-400 dark:hover:border-zinc-700"
                    />
                  </div>
              )}

              {!isLogin && role === 'student' && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <CodeIcon className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" weight="bold" />
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-wide uppercase">Coding Platforms</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/60">
                        At least 1 required
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffa116]" />
                            <Label className="uppercase text-[10px] tracking-wider text-zinc-700 dark:text-zinc-300 font-semibold">LeetCode</Label>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-normal">optional</span>
                        </div>
                        <div className="relative">
                          <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                          <Input
                              autoComplete="username"
                              placeholder="username or profile URL"
                              value={formData.leetcodeUsername}
                              onChange={(e) => handleLeetcodeChange(e.target.value)}
                              onBlur={handleLeetcodeBlur}
                              onPaste={handleLeetcodePaste}
                              className="bg-white dark:bg-[#141416] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] pl-9 h-10 rounded-xl w-full transition-all text-sm hover:border-zinc-400 dark:hover:border-zinc-700"
                          />
                        </div>
                        {isLeetCodeUrl(formData.leetcodeUsername) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                            <span className="font-semibold text-zinc-500">Auto-extracted:</span>
                            <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 text-[#ffa116] px-1.5 py-0.5 rounded text-[10px] border border-zinc-300 dark:border-zinc-700/60 font-bold">
                              @{extractLeetcodeUsername(formData.leetcodeUsername)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <Label className="uppercase text-[10px] tracking-wider text-zinc-700 dark:text-zinc-300 font-semibold">Codeforces</Label>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-normal">optional</span>
                        </div>
                        <div className="relative">
                          <TerminalIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                          <Input
                              autoComplete="username"
                              placeholder="handle or profile URL"
                              value={formData.codeforcesHandle}
                              onChange={(e) => handleCodeforcesChange(e.target.value)}
                              onBlur={handleCodeforcesBlur}
                              onPaste={handleCodeforcesPaste}
                              className="bg-white dark:bg-[#141416] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] pl-9 h-10 rounded-xl w-full transition-all text-sm hover:border-zinc-400 dark:hover:border-zinc-700"
                          />
                        </div>
                        {isCodeforcesUrl(formData.codeforcesHandle) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                            <span className="font-semibold text-zinc-500">Auto-extracted:</span>
                            <span className="font-mono bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded text-[10px] border border-cyan-200 dark:border-cyan-800/60 font-bold">
                              @{extractCodeforcesHandle(formData.codeforcesHandle)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      Provide your username, handle, or paste your profile URL for either platform. URLs are automatically converted.
                    </p>
                  </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Password</Label>
                  {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setError("Password reset link will be sent to your registered email address.");
                        }}
                        className="text-xs text-[#5b4fff] dark:text-[#968fff] hover:text-[#4d40ea] dark:hover:text-[#b4afff] transition-colors font-medium cursor-pointer bg-transparent border-none p-0"
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
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => { setFormData({...formData, password: e.target.value}); clearError(); }}
                      className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-10 rounded-xl w-full tracking-widest font-mono transition-all px-3.5 pr-10 text-sm hover:border-zinc-400 dark:hover:border-zinc-700"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 cursor-pointer focus:outline-none"
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
                    <p className="text-[11px] text-zinc-500">Minimum 8 characters required.</p>
                )}
              </div>
              <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-3 bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shimmer-sweep interactive-press"
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
                  onClick={() => toggleAuthMode(!isLogin)}
                  className="border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-white rounded-lg px-3 py-1 text-xs sm:text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer interactive-press"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            <div className="mt-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-center text-xs">
              <Link
                to="/contact"
                className="text-zinc-500 hover:text-[#5b4fff] dark:hover:text-[#968fff] transition-colors font-medium flex items-center gap-1.5"
              >
                <span>Need help? Contact support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}