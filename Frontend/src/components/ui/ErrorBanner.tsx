import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
    message: string | null;
    className?: string; // Optional prop to add custom margins if needed
}

export function ErrorBanner({ message, className = "mb-4" }: ErrorBannerProps) {
    if (!message) return null;

    return (
        <div className={`flex items-center space-x-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400 backdrop-blur-md transition-all ${className}`}>
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{message}</p>
        </div>
    );
}