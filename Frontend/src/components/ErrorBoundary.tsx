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

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <div className="flex h-screen items-center justify-center bg-slate-50" role="alert">
                        <div className="text-center">
                            <h1 className="text-xl font-semibold text-slate-900">Something went wrong.</h1>
                            <p className="mt-2 text-sm text-slate-500">Please refresh the page or try again later.</p>
                            <button
                                type="button"
                                aria-label="Reload page"
                                onClick={() => window.location.reload()}
                                className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
                            >
                                Reload
                            </button>
                        </div>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}
