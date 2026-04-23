import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export function LoginForm() {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(formData);
            navigate('/dashboard');
        } catch (err) {
            setError(axios.isAxiosError(err) && err.response?.data?.message 
                ? err.response.data.message 
                : 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            {error && (
                <div className="mb-4 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
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
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
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