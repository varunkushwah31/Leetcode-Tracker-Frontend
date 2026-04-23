import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Terminal, Activity, Target, Globe, AlertCircle, Loader2 } from 'lucide-react';
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

      // Because we used AuthContext to update the state, React Router's
      // <PublicRoute> in App.tsx will automatically teleport you to the dashboard!
      // But we include navigate here as a safe fallback.
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
      <div className="min-h-screen flex bg-zinc-50 dark:bg-[#09090B] transition-colors duration-300">
        {/* Left Branding Panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-zinc-700 via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 text-white mb-8">
              <Terminal className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold tracking-tight">LeetTracker</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              The modern OS for <br/><span className="text-zinc-400">Coding Bootcamps.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md font-light">
              Seamlessly track, assign, and validate your students' LeetCode progress via an automated, data-rich dashboard.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur rounded-xl p-4 shadow-none">
              <Activity className="h-6 w-6 text-zinc-300 mb-2" />
              <h4 className="text-white font-medium">Live Tracking</h4>
              <p className="text-zinc-500 text-sm mt-1">Real-time sync with LeetCode API.</p>
            </Card>
            <Card className="bg-zinc-900/40 border-zinc-800/80 backdrop-blur rounded-xl p-4 shadow-none">
              <Target className="h-6 w-6 text-zinc-300 mb-2" />
              <h4 className="text-white font-medium">Smart Assignments</h4>
              <p className="text-zinc-500 text-sm mt-1">Automated validation & leaderboards.</p>
            </Card>
          </div>
        </div>

        {/* Right Auth Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="lg:hidden flex justify-center mb-6">
                <Terminal className="h-10 w-10 text-zinc-900 dark:text-white" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                {isLogin ? 'Log in to your account to continue.' : 'Enter your details to get started.'}
              </p>
            </div>

            {!isLogin && (
                <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg flex mb-6 border border-zinc-200 dark:border-zinc-800">
                  <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'student' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm dark:border dark:border-zinc-700/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                      onClick={() => setRole('student')}
                  >
                    I am a Student
                  </button>
                  <button
                      type="button"
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'mentor' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm dark:border dark:border-zinc-700/50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                      onClick={() => setRole('mentor')}
                  >
                    I am a Mentor
                  </button>
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                  <div className="mb-4 flex items-center space-x-3 rounded-lg border border-red-200 dark:border-rose-900/50 bg-red-50 dark:bg-rose-500/10 p-3 text-sm text-red-700 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
              )}

              {!isLogin && (
                  <div className="space-y-1.5">
                    <Label className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                    <Input required placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-500" />
                  </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
                <Input type="email" required placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-500" />
              </div>

              {!isLogin && role === 'student' && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-1.5 pt-1">
                    <Label className="text-zinc-700 dark:text-zinc-300">LeetCode Username</Label>
                    <Input required placeholder="e.g. neetcode123" value={formData.leetcodeUsername} onChange={(e) => setFormData({...formData, leetcodeUsername: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-500" />
                    <p className="text-xs text-zinc-500 mt-2 flex items-center">
                      <Globe className="h-3 w-3 mr-1 inline" /> We use this to auto-sync your progress.
                    </p>
                  </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300">Password</Label>
                <Input type="password" required placeholder="••••••••" minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-blue-500" />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white border-transparent">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isLogin ? 'Sign In' : `Register as ${role === 'student' ? 'Student' : 'Mentor'}`}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-zinc-900 dark:text-white font-medium hover:underline">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}