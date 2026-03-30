import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import axios from "axios";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login(){
    const navigate = useNavigate();
    const {login} = useAuth();

    const [error,setError] = useState('');
    const [isLoading,setIsLoading] = useState(false);

    const [email,setEmail] = useState('');
    const [password,setPassword] = useState('');

    const handleSubmit = async (e : React.SubmitEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try{
            // This calls Spring Boot /api/v1/auth/login endpoint
            await login({ email, password });

            // If successful, the AuthContext updates and send them to the dashboard
            navigate('/dashboard');
        } catch(err) {
            // Catch the exact ErrorResponse DTO from backend
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Unable to connect to the server. Please try again later.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5">
                {/* Header Section */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Welcome Back
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Sign in to your LeetCode Tracker account
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 border-slate-200">
                        {/* Email Input */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="johnsmith@gmail.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Authenticating...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Registration Link Placeholder */}
                <p className="mt-4 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <a href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
                        Create one now
                    </a>
                </p>
            </div>
        </div>
    );

}