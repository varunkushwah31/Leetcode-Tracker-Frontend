import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import {
    EnvelopeSimpleIcon as Envelope,
    ShieldCheckIcon as ShieldCheck,
    SpinnerIcon as Loader2,
    ArrowCounterClockwiseIcon as ArrowCounterClockwise,
    CheckCircleIcon as CheckCircle,
} from '@phosphor-icons/react';

interface StudentEmailVerificationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
    studentName?: string;
    onVerifyAndRegister: (otp: string) => Promise<void>;
    onResendOtp: () => Promise<void>;
}

export function StudentEmailVerificationModal({
    open,
    onOpenChange,
    email,
    studentName,
    onVerifyAndRegister,
    onResendOtp,
}: Readonly<StudentEmailVerificationModalProps>) {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    // Reset state whenever modal opens
    useEffect(() => {
        if (open) {
            setOtp('');
            setError(null);
            setInfoMessage(`We've sent a 6-digit verification code to ${email}`);
            setResendCooldown(60);
        }
    }, [open, email]);

    // Countdown timer for resend button
    useEffect(() => {
        if (!open || resendCooldown <= 0) return;
        const interval = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [open, resendCooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanOtp = otp.trim();
        if (!cleanOtp || cleanOtp.length !== 6) {
            setError('Please enter the complete 6-digit verification code.');
            return;
        }

        setIsLoading(true);
        try {
            await onVerifyAndRegister(cleanOtp);
        } catch (err: unknown) {
            let msg = 'Invalid or expired verification code. Please check and try again.';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } | string } };
                if (typeof axiosErr.response?.data === 'string') {
                    msg = axiosErr.response.data;
                } else if (axiosErr.response?.data?.message) {
                    msg = axiosErr.response.data.message;
                }
            } else if (err instanceof Error) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setError(null);
        setIsResending(true);
        try {
            await onResendOtp();
            setInfoMessage('A fresh verification code has been dispatched to your email.');
            setResendCooldown(60);
        } catch (err: unknown) {
            let msg = 'Failed to resend verification code. Please try again.';
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } | string } };
                if (typeof axiosErr.response?.data === 'string') {
                    msg = axiosErr.response.data;
                } else if (axiosErr.response?.data?.message) {
                    msg = axiosErr.response.data.message;
                }
            } else if (err instanceof Error) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-2xl p-6 sm:p-7">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                            <ShieldCheck className="w-5 h-5" weight="bold" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                                Verify Your Email Address
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {studentName ? `Hi ${studentName}! ` : ''}Confirm ownership of your student email to activate your account.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="pt-2">
                    <ErrorBanner message={error} className="mb-3" />

                    {infoMessage && (
                        <div className="mb-4 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2.5 text-xs text-indigo-700 dark:text-indigo-300">
                            <Envelope className="w-4 h-4 shrink-0 mt-0.5 text-[#5b4fff]" weight="fill" />
                            <div className="leading-relaxed">
                                <span>{infoMessage}</span>
                                <div className="mt-1 font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                    {email}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="student-otp-input" className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold">
                                    6-Digit Verification Code
                                </Label>
                                <span className="text-[10px] text-zinc-500 font-normal">
                                    Valid for 10 minutes
                                </span>
                            </div>
                            <Input
                                id="student-otp-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                placeholder="123456"
                                autoFocus
                                required
                                value={otp}
                                onChange={(e) => {
                                    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setOtp(digitsOnly);
                                    if (error) setError(null);
                                }}
                                className="font-mono text-center text-2xl tracking-[0.4em] font-bold h-12 rounded-xl bg-zinc-50 dark:bg-[#18181b] border-zinc-300 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-[#5b4fff]"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || otp.trim().length !== 6}
                            className="w-full h-10 bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-sm font-medium rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Verifying & Creating Account...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-1.5" weight="bold" />
                                    Verify & Complete Registration
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors font-medium cursor-pointer"
                        >
                            Change email address
                        </button>

                        <button
                            type="button"
                            disabled={resendCooldown > 0 || isResending}
                            onClick={handleResend}
                            className={`flex items-center gap-1 font-medium transition-colors ${
                                resendCooldown > 0 || isResending
                                    ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                                    : 'text-[#5b4fff] dark:text-[#968fff] hover:underline cursor-pointer'
                            }`}
                        >
                            {isResending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <ArrowCounterClockwise className="w-3.5 h-3.5" />
                            )}
                            <span>
                                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                            </span>
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
