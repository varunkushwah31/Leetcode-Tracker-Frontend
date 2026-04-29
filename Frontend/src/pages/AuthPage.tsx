import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Terminal, Activity, AlertCircle, Users, LayoutDashboard, Globe, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, registerMentor, registerStudent } = useAuth();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', leetcodeUsername: '',
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        if (role === 'student') {
          await registerStudent(formData);
        } else {
          await registerMentor({
            name: formData.name, email: formData.email, password: formData.password
          });
        }
      }

      navigate('/dashboard');

    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex text-white font-sans selection:bg-[#5b4fff] selection:text-white">
      
      {/* Left Panel - Visuals & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#09090e] border-r border-zinc-900 flex-col justify-center p-10 xl:p-16">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg">
              <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">MentorSync</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
            The modern OS for <br />
            <span className="text-[#968fff]">Coding Bootcamps.</span>
          </h1>
          <p className="text-zinc-400 text-[16px] leading-relaxed mb-8 max-w-105">
            Track, assign, and validate your students' LeetCode progress through an automated, data-rich dashboard.
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-3 xl:gap-4">
            <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors">
               <div className="bg-[#1a1b2e] w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                  <Activity className="h-4 w-4 text-[#968fff]" />
               </div>
               <h3 className="text-white font-semibold text-[14px] mb-1 tracking-tight">Live Tracking</h3>
               <p className="text-[13px] text-zinc-500 leading-snug pr-2">Real-time sync with LeetCode API</p>
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
                  <Users className="h-4 w-4 text-[#968fff]" />
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative bg-[#0a0a0a] overflow-hidden">
        
        {/* Unique dot grid texture background */}
        <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none"></div>
        
        {/* Subtle ambient glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-112.5 h-112.5 bg-[#5b4fff] opacity-[0.06] blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-110 relative z-10 bg-[#111111]/85 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-zinc-800/60 shadow-[0_8px_40px_rgb(0,0,0,0.5)] my-auto">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-[#5b4fff] p-2.5 rounded-lg">
              <Terminal className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">MentorSync</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-white tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-zinc-400 text-[15px]">
              {isLogin ? 'Sign in to your account to continue.' : 'Fill in your details to get started.'}
            </p>
          </div>

          {!isLogin && (
            <div className="flex bg-[#1a1a1a] p-1.5 rounded-xl mb-6 border border-zinc-800">
              <button
                type="button"
                className={`flex-1 py-2 text-[14px] font-medium rounded-lg transition-all duration-200 ${
                  role === 'student'
                    ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50'
                    : 'text-zinc-500 hover:text-white'
                }`}
                onClick={() => setRole('student')}
              >
                Student
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-[14px] font-medium rounded-lg transition-all duration-200 ${
                  role === 'mentor'
                    ? 'bg-[#2a2a2a] text-white shadow-md border border-zinc-700/50'
                    : 'text-zinc-500 hover:text-white'
                }`}
                onClick={() => setRole('mentor')}
              >
                Mentor
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="flex items-center space-x-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Full Name</Label>
                <Input 
                  required 
                  placeholder="John Doe" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4" 
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Email Address</Label>
              <Input 
                type="email" 
                required 
                placeholder="you@example.com" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4" 
              />
            </div>

            {!isLogin && role === 'student' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">LeetCode Username</Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    required 
                    placeholder="neetcode123" 
                    value={formData.leetcodeUsername} 
                    onChange={(e) => setFormData({...formData, leetcodeUsername: e.target.value})} 
                    className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] pl-11 h-12 rounded-xl w-full transition-all" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Password</Label>
                {isLogin && (
                  <a href="#" className="text-xs text-[#968fff] hover:text-[#b4afff] transition-colors font-medium">
                    Forgot password?
                  </a>
                )}
              </div>
              <Input 
                type="password" 
                required 
                placeholder="••••••••" 
                minLength={6} 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full tracking-widest font-mono transition-all px-4" 
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-12 mt-6 bg-transparent border border-zinc-700 text-white text-[15px] font-medium hover:bg-zinc-800 rounded-xl transition-all duration-200 flex items-center justify-center hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-3">
            <p className="text-zinc-500 text-[14px]">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="border border-zinc-700 text-white rounded-lg px-4 py-1.5 text-[14px] font-medium hover:bg-zinc-800 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              type="button" 
              onClick={() => navigate('/contact')} 
              className="text-[13px] text-zinc-500 hover:text-[#968fff] transition-colors font-medium"
            >
              Need Help? Contact Us
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}