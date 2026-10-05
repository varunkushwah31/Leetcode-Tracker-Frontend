import { WarningCircleIcon as AlertCircle } from '@phosphor-icons/react';

interface ErrorBannerProps {
    message: string | null;
    className?: string; // Optional prop to add custom margins if needed
}

export function ErrorBanner({ message, className = "mb-4" }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <div
            role="alert"
            className={`flex items-center space-x-3 rounded-xl border border-red-200 dark:border-red-500/25 bg-red-50/90 dark:bg-red-500/10 p-3 text-red-700 dark:text-red-300 backdrop-blur-md transition-all shadow-xs ${className}`}
        >
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium leading-snug break-words">{message}</p>
        </div>
    );
}