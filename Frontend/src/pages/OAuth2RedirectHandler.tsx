import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';
import { BrandLogo } from '@/components/common/BrandLogo';
import { CircleNotchIcon as Loader2, ShieldCheckIcon } from '@phosphor-icons/react';
import { AmbientGlow } from '@/components/ui/AmbientGlow';

export const OAuth2RedirectHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const role = searchParams.get('role');

    if (error) {
      const decodedError = decodeURIComponent(error);
      navigate('/login', {
        replace: true,
        state: { error: decodedError }
      });
      return;
    }

    if (!token) {
      navigate('/login', {
        replace: true,
        state: { error: 'No authentication token received from social login.' }
      });
      return;
    }

    try {
      loginWithToken(token, {
        id: userId || undefined,
        name: name || undefined,
        role: (role as Role) || undefined,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finalize social authentication.';
      navigate('/login', {
        replace: true,
        state: { error: message }
      });
    }
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f3f7] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white relative p-6 select-none transition-colors duration-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(91,79,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(91,79,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(150,143,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,143,255,0.04)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>
      <div className="hidden dark:block">
        <AmbientGlow variant="center" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111111] p-8 sm:p-10 rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <BrandLogo size="md" theme="auto" asLink={false} />
        </div>

        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-indigo-50 dark:bg-[#5b4fff]/10 border border-indigo-100 dark:border-[#5b4fff]/20 flex items-center justify-center text-[#5b4fff] dark:text-[#968fff] shadow-sm">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>

        <h2 className="text-xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white">
          Authenticating
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
          Completing secure authentication and redirecting to your dashboard...
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span>Encrypted OAuth 2.0 handshake</span>
        </div>
      </div>
    </div>
  );
};
export default OAuth2RedirectHandler;
