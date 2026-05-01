import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorBanner } from '../ui/ErrorBanner'; // <-- 1. Import your new reusable component!

export function LoginForm() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();

        // 2. Clear any previous errors
        setError(null);
        setIsLoading(true);

        try {
            await login(formData);
            navigate('/dashboard');
        } catch (err: any) {
            // 3. MAGIC: No more Axios parsing needed!
            // Our api.ts interceptor guarantees err.message is a clean, formatted string.
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">

            {/* 4. Drop in your clean, reusable Error Banner */}
            <ErrorBanner message={error} />

            <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (error) setError(null); // Optional UX: Clear error when user starts typing again
                    }}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (error) setError(null);
                    }}
                    required
                />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
        </form>
    );
}