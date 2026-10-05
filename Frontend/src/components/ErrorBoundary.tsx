import React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0e] px-4" role="alert">
                        <div className="text-center max-w-md">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                                <span className="text-xl font-bold">!</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong.</h1>
                            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Please refresh the page or return to the dashboard.</p>
                            <div className="mt-5 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        this.setState({ hasError: false });
                                        window.location.href = '/dashboard';
                                    }}
                                    className="rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#181820] text-slate-700 dark:text-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    Dashboard
                                </button>
                                <button
                                    type="button"
                                    aria-label="Reload page"
                                    onClick={() => window.location.reload()}
                                    className="rounded-xl bg-[#5b4fff] hover:bg-[#4a3fdf] text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}
