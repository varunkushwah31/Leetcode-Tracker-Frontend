import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { AuthService } from '@/services/endpoints';
import {
    KeyIcon,
    EnvelopeSimpleIcon as Envelope,
    EyeIcon,
    EyeSlashIcon,
    SpinnerIcon as Loader2,
    CheckCircleIcon as CheckCircle,
    ShieldCheckIcon as ShieldCheck,
    ArrowLeftIcon,
    PaperPlaneTiltIcon as PaperPlaneTilt,
    LockKeyIcon as LockKey
} from '@phosphor-icons/react';

interface ForgotPasswordModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultEmail?: string;
    trigger?: React.ReactNode;
}

type Step = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export function ForgotPasswordModal({
    open,
    onOpenChange,
    defaultEmail = '',
    trigger
}: Readonly<ForgotPasswordModalProps>) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const setIsOpen = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetForm();
        }
        if (isControlled) {
            onOpenChange?.(nextOpen);
        } else {
            setInternalOpen(nextOpen);
        }
    };

    const [step, setStep] = useState<Step>('EMAIL');
    const [email, setEmail] = useState(defaultEmail);
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Sync defaultEmail when modal opens
    useEffect(() => {
        if (isOpen && defaultEmail && !email) {
            setEmail(defaultEmail);
        }
    }, [isOpen, defaultEmail, email]);

    // Resend countdown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const resetForm = () => {
        setStep('EMAIL');
        setEmail(defaultEmail);
        setOtp('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setError(null);
        setSuccessMessage(null);
        setIsLoading(false);
        setResendCooldown(0);
    };

    // STEP 1: Request OTP
    const handleSendOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setError('Please enter your registered email address.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await AuthService.forgotPassword(trimmedEmail);
            setSuccessMessage(res.data?.message || 'Verification code sent to your email.');
            setStep('OTP');
            setResendCooldown(60); // 60 seconds cooldown
        } catch (err: unknown) {
            handleApiError(err, 'Failed to send OTP. Please verify your email.');
        } finally {
            setIsLoading(false);
        }
    };

    // STEP 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const trimmedOtp = otp.trim();
        if (!trimmedOtp || trimmedOtp.length !== 6) {
            setError('Please enter the complete 6-digit OTP sent to your email.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await AuthService.verifyOtp(email.trim().toLowerCase(), trimmedOtp);
            setResetToken(res.data.resetToken);
            setSuccessMessage('Code verified successfully!');
            setStep('PASSWORD');
        } catch (err: unknown) {
            handleApiError(err, 'Invalid or expired OTP. Please check and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // STEP 3: Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!newPassword || newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation password do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await AuthService.resetPassword({
                email: email.trim().toLowerCase(),
                resetToken,
                otp: otp.trim(),
                newPassword,
                confirmPassword,
            });

            setSuccessMessage(res.data?.message || 'Password reset successfully!');
            setStep('SUCCESS');
            setTimeout(() => {
                setIsOpen(false);
            }, 2500);
        } catch (err: unknown) {
            handleApiError(err, 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApiError = (err: unknown, defaultFallback: string) => {
        let msg = defaultFallback;
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
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-2xl p-6 sm:p-7">
                {/* Header */}
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                            {step === 'PASSWORD' || step === 'SUCCESS' ? (
                                <LockKey className="w-5 h-5" weight="bold" />
                            ) : (
                                <KeyIcon className="w-5 h-5" weight="bold" />
                            )}
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                                {step === 'EMAIL' && 'Reset Password'}
                                {step === 'OTP' && 'Verify Email OTP'}
                                {step === 'PASSWORD' && 'Create New Password'}
                                {step === 'SUCCESS' && 'Password Updated!'}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {step === 'EMAIL' && 'Enter your registered email to receive a 6-digit OTP.'}
                                {step === 'OTP' && `Enter the 6-digit verification code sent to ${email}.`}
                                {step === 'PASSWORD' && 'Enter and confirm your new secure password.'}
                                {step === 'SUCCESS' && 'Your password has been changed. You can now log in.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Step Progress Pills */}
                {step !== 'SUCCESS' && (
                    <div className="flex items-center justify-between gap-2 pt-1 pb-1">
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step === 'EMAIL' || step === 'OTP' || step === 'PASSWORD' ? 'bg-[#5b4fff]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step === 'OTP' || step === 'PASSWORD' ? 'bg-[#5b4fff]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step === 'PASSWORD' ? 'bg-[#5b4fff]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                    </div>
                )}

                <div className="pt-2">
                    <ErrorBanner message={error} className="mb-3" />

                    {successMessage && step !== 'SUCCESS' && (
                        <div
                            role="status"
                            className="flex items-center space-x-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/90 dark:bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 backdrop-blur-md transition-all shadow-xs mb-3 text-xs font-medium"
                        >
                            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" weight="fill" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* STEP 1: EMAIL */}
                    {step === 'EMAIL' && (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="forgot-email" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Envelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                    <Input
                                        id="forgot-email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                        disabled={isLoading}
                                        className="pl-10 bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl text-sm h-10"
                                    />
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    We will dispatch a secure 6-digit OTP code directly to this email via Resend.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    disabled={isLoading}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold h-10 px-4"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !email.trim()}
                                    className="rounded-xl bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-xs font-semibold h-10 px-5 shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Sending Code...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PaperPlaneTilt className="w-4 h-4" weight="bold" />
                                            <span>Send OTP</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: OTP VERIFICATION */}
                    {step === 'OTP' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="forgot-otp" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                        6-Digit Verification Code
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={() => { setStep('EMAIL'); setError(null); }}
                                        className="text-[11px] text-[#5b4fff] dark:text-[#968fff] hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
                                    >
                                        <ArrowLeftIcon className="w-3 h-3" /> Change email
                                    </button>
                                </div>
                                <Input
                                    id="forgot-otp"
                                    type="text"
                                    required
                                    autoFocus
                                    maxLength={6}
                                    pattern="\d{6}"
                                    placeholder="••••••"
                                    value={otp}
                                    onChange={(e) => {
                                        // Numeric only
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                        setError(null);
                                    }}
                                    disabled={isLoading}
                                    className="text-center font-mono text-xl tracking-[0.35em] bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl h-12"
                                />
                                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                                    <span>Code expires in 10 minutes</span>
                                    {resendCooldown > 0 ? (
                                        <span className="text-zinc-400">Resend in {resendCooldown}s</span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSendOtp()}
                                            disabled={isLoading}
                                            className="text-[#5b4fff] dark:text-[#968fff] font-medium hover:underline cursor-pointer bg-transparent border-none p-0"
                                        >
                                            Resend Code
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setStep('EMAIL'); setError(null); }}
                                    disabled={isLoading}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold h-10 px-3.5"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || otp.length !== 6}
                                    className="rounded-xl bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-xs font-semibold h-10 px-5 shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-4 h-4" weight="bold" />
                                            <span>Verify Code</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: NEW PASSWORD */}
                    {step === 'PASSWORD' && (
                        <form onSubmit={handleResetPassword} className="space-y-3.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="reset-new-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="reset-new-password"
                                        type={showNewPassword ? 'text' : 'password'}
                                        required
                                        autoFocus
                                        minLength={6}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                                        disabled={isLoading}
                                        className="pr-10 bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl text-sm h-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="reset-confirm-password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="reset-confirm-password"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                        disabled={isLoading}
                                        className="pr-10 bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl text-sm h-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Validation indicators */}
                            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181f] border border-zinc-200/80 dark:border-zinc-800/80 space-y-1 text-[11px]">
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck
                                        className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-500' : 'text-zinc-400'}`}
                                        weight={newPassword.length >= 6 ? 'fill' : 'regular'}
                                    />
                                    <span className={newPassword.length >= 6 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500'}>
                                        At least 6 characters
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ShieldCheck
                                        className={`w-3.5 h-3.5 ${confirmPassword && newPassword === confirmPassword ? 'text-emerald-500' : 'text-zinc-400'}`}
                                        weight={confirmPassword && newPassword === confirmPassword ? 'fill' : 'regular'}
                                    />
                                    <span className={confirmPassword && newPassword === confirmPassword ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-zinc-500'}>
                                        Passwords match
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setStep('OTP'); setError(null); }}
                                    disabled={isLoading}
                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold h-10 px-3.5"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                                    className="rounded-xl bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-xs font-semibold h-10 px-5 shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <span>Reset Password</span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 'SUCCESS' && (
                        <div className="py-6 text-center space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
                                <CheckCircle className="w-8 h-8" weight="fill" />
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                                Password Reset Successfully!
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                                You can now sign in to your MentorSync account with your new password.
                            </p>
                            <div className="pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-xl bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-xs font-semibold h-10 px-6 shadow-sm"
                                >
                                    Proceed to Sign In
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
