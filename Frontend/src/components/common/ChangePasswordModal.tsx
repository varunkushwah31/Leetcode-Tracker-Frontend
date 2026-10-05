import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
    EyeIcon,
    EyeSlashIcon,
    SpinnerIcon as Loader2,
    CheckCircleIcon as CheckCircle,
    ShieldCheckIcon as ShieldCheck
} from '@phosphor-icons/react';

interface ChangePasswordModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ChangePasswordModal({ open, onOpenChange, trigger }: Readonly<ChangePasswordModalProps>) {
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

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
        setError(null);
        setSuccessMessage(null);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!currentPassword) {
            setError('Please enter your current password.');
            return;
        }

        if (!newPassword) {
            setError('Please enter a new password.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword === currentPassword) {
            setError('New password cannot be the same as your current password.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await AuthService.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setSuccessMessage(response.data?.message || 'Password changed successfully!');
            setTimeout(() => {
                setIsOpen(false);
            }, 1800);
        } catch (err: unknown) {
            let msg = 'Failed to change password. Please check your current password.';
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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#111116] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl rounded-2xl">
                <DialogHeader className="gap-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                            <KeyIcon className="w-5 h-5" weight="bold" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                                Change Password
                            </DialogTitle>
                            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Enter your current password and choose a secure new one.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    <ErrorBanner message={error} className="mb-3" />

                    {successMessage && (
                        <div
                            role="status"
                            className="flex items-center space-x-3 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/90 dark:bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 backdrop-blur-md transition-all shadow-xs mb-3"
                        >
                            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" weight="fill" />
                            <p className="text-sm font-medium leading-snug">{successMessage}</p>
                        </div>
                    )}

                    {/* Current Password */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="current-password"
                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                        >
                            Current Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                disabled={isLoading || !!successMessage}
                                required
                                className="pr-10 bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                            >
                                {showCurrent ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="new-password"
                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                        >
                            New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                disabled={isLoading || !!successMessage}
                                required
                                className="pr-10 bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                aria-label={showNew ? "Hide new password" : "Show new password"}
                            >
                                {showNew ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="confirm-password"
                            className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                        >
                            Confirm New Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                disabled={isLoading || !!successMessage}
                                required
                                className="pr-10 bg-zinc-50 dark:bg-[#18181f] border-zinc-200 dark:border-zinc-800 focus:border-[#5b4fff] rounded-xl text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                tabIndex={-1}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirm ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Validation hints */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#18181f] border border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                            <ShieldCheck
                                className={`w-3.5 h-3.5 ${
                                    newPassword.length >= 6
                                        ? 'text-emerald-500'
                                        : 'text-zinc-400 dark:text-zinc-500'
                                }`}
                                weight={newPassword.length >= 6 ? 'fill' : 'regular'}
                            />
                            <span
                                className={
                                    newPassword.length >= 6
                                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                }
                            >
                                At least 6 characters
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                            <ShieldCheck
                                className={`w-3.5 h-3.5 ${
                                    confirmPassword && newPassword === confirmPassword
                                        ? 'text-emerald-500'
                                        : 'text-zinc-400 dark:text-zinc-500'
                                }`}
                                weight={confirmPassword && newPassword === confirmPassword ? 'fill' : 'regular'}
                            />
                            <span
                                className={
                                    confirmPassword && newPassword === confirmPassword
                                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                }
                            >
                                Passwords match
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 sm:justify-end gap-2">
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
                            disabled={isLoading || !!successMessage}
                            className="rounded-xl bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-xs font-semibold h-10 px-5 shadow-sm transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    Updating...
                                </>
                            ) : successMessage ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-1.5" weight="fill" />
                                    Updated
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
