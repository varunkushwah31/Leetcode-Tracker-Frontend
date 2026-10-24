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

function validatePasswordChange(currentPassword: string, newPassword: string, confirmPassword: string): string | null {
    if (!currentPassword) return 'Please enter your current password.';
    if (!newPassword) return 'Please enter a new password.';
    if (newPassword.length < 6) return 'New password must be at least 6 characters long.';
    if (newPassword === currentPassword) return 'New password cannot be the same as your current password.';
    if (newPassword !== confirmPassword) return 'New password and confirmation do not match.';
    return null;
}

function extractErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } | string } };
        if (typeof axiosErr.response?.data === 'string') return axiosErr.response.data;
        if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
    }
    if (err instanceof Error) return err.message;
    return 'Failed to change password. Please check your current password.';
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

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const validationError = validatePasswordChange(currentPassword, newPassword, confirmPassword);
        if (validationError) {
            setError(validationError);
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
            setError(extractErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const renderSubmitContent = () => {
        if (isLoading) {
            return (
                <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Updating...
                </>
            );
        }
        if (successMessage) {
            return (
                <>
                    <CheckCircle className="w-4 h-4 mr-1.5" weight="fill" />
                    Updated
                </>
            );
        }
        return 'Update Password';
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden">
                {/* Luminous Top Horizon Beam */}
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-[#5b4fff]/40 to-transparent pointer-events-none" />

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
                        <output
                            className="flex items-center space-x-3 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-emerald-50/90 dark:bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 backdrop-blur-md transition-all shadow-xs mb-3 block"
                        >
                            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" weight="fill" />
                            <p className="text-sm font-medium leading-snug">{successMessage}</p>
                        </output>
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
                                name="current-password"
                                type={showCurrent ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                disabled={isLoading || !!successMessage}
                                required
                                className="pr-10 bg-zinc-100/90 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#5b4fff] rounded-xl transition-all h-10 text-sm"
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
                                name="new-password"
                                type={showNew ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                disabled={isLoading || !!successMessage}
                                required
                                className="pr-10 bg-zinc-100/90 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#5b4fff] rounded-xl transition-all h-10 text-sm"
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
                                name="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                disabled={isLoading || !!successMessage}
                                required
                                className="pr-10 bg-zinc-100/90 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-[#5b4fff] rounded-xl transition-all h-10 text-sm"
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
                    <div className="p-2.5 rounded-xl bg-zinc-50/80 dark:bg-[#18181b]/70 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
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
                            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold h-10 px-4 transition-colors cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !!successMessage}
                            className="rounded-xl bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white text-xs font-semibold h-10 px-5 shadow-lg shadow-[#5b4fff]/25 transition-all cursor-pointer"
                        >
                            {renderSubmitContent()}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
