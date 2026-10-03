import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const [mounted] = useState(true);

    if (!mounted) return null;

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10 transition-all flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5b4fff] focus-visible:ring-offset-2 ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                <SunIcon className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" weight="bold" />
            ) : (
                <MoonIcon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" weight="bold" />
            )}
        </button>
    );
}