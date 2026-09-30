import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SpinnerIcon as Loader2, WarningCircleIcon as AlertCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import type { Role } from '@/types';

export function OAuth2RedirectHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const role = searchParams.get('role');

    const [error, setError] = useState<string | null>(() =>
        !searchParams.get('token') ? 'Authentication token missing from Google redirect.' : null
    );

    useEffect(() => {
        if (!token) return;

        let isMounted = true;
        const completeLogin = async () => {
            try {
                loginWithToken(token, {
                    id: userId || undefined,
                    name: name || undefined,
                    role: (role as Role) || undefined,
                });
                navigate('/dashboard', { replace: true });
            } catch (err: unknown) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to complete Google authentication.');
                }
            }
        };

        void completeLogin();

        return () => {
            isMounted = false;
        };
    }, [token, userId, name, role, loginWithToken, navigate]);

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a] p-4 text-white">
                <div className="max-w-md w-full bg-[#111111] border border-zinc-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
                    <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">Authentication Failed</h2>
                    <p className="text-sm text-zinc-400">{error}</p>
                    <Button
                        onClick={() => navigate('/login', { replace: true })}
                        className="w-full bg-[#5b4fff] hover:bg-[#4a3ecc] text-white rounded-xl"
                    >
                        Return to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-[#0a0a0a]" role="status" aria-live="polite">
            <div className="flex flex-col items-center space-y-4 text-white">
                <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                <p className="text-sm text-zinc-400 font-medium">Completing Google Authentication...</p>
            </div>
        </div>
    );
}

export default OAuth2RedirectHandler;
