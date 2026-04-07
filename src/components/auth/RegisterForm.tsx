import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { AuthService } from '../../services/endpoints';
import axios from 'axios';

export function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRole, setSelectedRole] = useState<'student' | 'mentor'>('student');
    
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', leetcodeUsername: '',
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            let response;
            if (selectedRole === 'student') {
                response = await AuthService.registerStudent(formData);
            } else {
                response = await AuthService.registerMentor({ 
                    name: formData.name, email: formData.email, password: formData.password 
                });
            }

            const { accessToken, mentorId, name: userName, role: userRole } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify({ id: mentorId, name: userName, role: userRole }));
            window.location.href = '/dashboard';
        } catch (err) {
            setError(axios.isAxiosError(err) && err.response?.data?.message 
                ? err.response.data.message 
                : 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            {error && (
                <div className="mb-4 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}
            
            <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={selectedRole === 'student' ? 'default' : 'outline'} onClick={() => setSelectedRole('student')} className="w-full">Student</Button>
                    <Button type="button" variant={selectedRole === 'mentor' ? 'default' : 'outline'} onClick={() => setSelectedRole('mentor')} className="w-full">Mentor</Button>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input id="register-name" type="text" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input id="register-email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            
            {selectedRole === 'student' && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="leetcode-username">LeetCode Username</Label>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Your public LeetCode username is required to sync your progress.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Input id="leetcode-username" type="text" placeholder="your_leetcode_username" value={formData.leetcodeUsername} onChange={(e) => setFormData({ ...formData, leetcodeUsername: e.target.value })} required />
                </div>
            )}
            
            <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input id="register-password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
        </form>
    );
}