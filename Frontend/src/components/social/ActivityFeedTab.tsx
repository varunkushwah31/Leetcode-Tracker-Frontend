import { useState, useEffect, useCallback } from 'react';
import {
    ActivityIcon as Activity,
    ArrowSquareOutIcon as ExternalLink,
    SpinnerIcon as Loader2,
    ClockIcon as Clock
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SocialService } from '../../services/endpoints';
import type { FriendActivityDTO } from '@/types';

interface ActivityFeedTabProps {
    onViewFriendDashboard: (friendId: string) => void;
}

export function ActivityFeedTab({ onViewFriendDashboard }: ActivityFeedTabProps) {
    const [activities, setActivities] = useState<FriendActivityDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'SOLVES' | 'DUELS'>('ALL');
    const [reactingActivityId, setReactingActivityId] = useState<string | null>(null);

    const loadActivities = useCallback(async () => {
        try {
            const res = await SocialService.getActivities();
            setActivities(res.data || []);
        } catch (err) {
            console.error('Failed to load activities:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadActivities();
        const interval = setInterval(() => {
            void loadActivities();
        }, 15000);
        return () => clearInterval(interval);
    }, [loadActivities]);

    const handleReact = async (activityId: string, emoji: string) => {
        setReactingActivityId(activityId);
        try {
            const res = await SocialService.reactToActivity(activityId, emoji);
            // Optimistic update
            setActivities(prev =>
                prev.map(a => (a.id === activityId ? res.data : a))
            );
        } catch (err) {
            console.error('Failed to react:', err);
        } finally {
            setReactingActivityId(null);
        }
    };

    const filteredActivities = activities.filter(a => {
        if (filter === 'SOLVES') return a.type === 'PROBLEM_SOLVED';
        if (filter === 'DUELS') return a.type === 'PVP_WIN' || a.type === 'PVP_DRAW';
        return true;
    });

    const reactionEmojis = ['🔥', '🚀', '💡', '👏', '❤️'];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                <p className="text-xs font-medium text-zinc-500">Loading friend activity...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with filter buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#5b4fff]" />
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Live Friends Activity Stream</h3>
                        <p className="text-[11px] text-zinc-500">Track solved problems, streaks, and duel victories in your peer network</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            filter === 'ALL'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('SOLVES')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            filter === 'SOLVES'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        Solves
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('DUELS')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            filter === 'DUELS'
                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        PVP Duels
                    </button>
                </div>
            </div>

            {/* Activities List */}
            {filteredActivities.length === 0 ? (
                <div className="p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No activity yet</p>
                    <p className="text-xs text-zinc-500">Add friends and solve problems or initiate duels to see real-time updates here!</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {filteredActivities.map((act) => {
                        return (
                            <div
                                key={act.id}
                                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:border-[#5b4fff]/30 transition-all space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => onViewFriendDashboard(act.studentId)}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                            <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700">
                                                <AvatarImage src={act.studentAvatarUrl} />
                                                <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                                    {act.studentName.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </button>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewFriendDashboard(act.studentId)}
                                                    className="text-xs font-bold text-zinc-900 dark:text-white hover:text-[#5b4fff] transition-colors truncate text-left cursor-pointer"
                                                >
                                                    {act.studentName}
                                                </button>
                                                <span className="text-[11px] text-zinc-400">@{act.studentHandle || 'coder'}</span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge
                                                    className={
                                                        act.type === 'PVP_WIN'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]'
                                                            : act.type === 'PROBLEM_SOLVED'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                                            : 'bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/20 text-[10px]'
                                                    }
                                                >
                                                    {act.type.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(act.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {act.link && (
                                        <a
                                            href={act.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-zinc-400 hover:text-[#5b4fff] transition-colors p-1"
                                            title="View Problem"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>

                                {/* Content / Description */}
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-800 dark:text-zinc-200">
                                    <p className="font-semibold text-zinc-900 dark:text-white mb-0.5">{act.title}</p>
                                    <p className="text-zinc-600 dark:text-zinc-400">{act.description}</p>
                                </div>

                                {/* Reactions / Kudos Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {reactionEmojis.map((emoji) => {
                                            const count = act.reactionCounts?.[emoji] || 0;
                                            const isSelected = act.myReactions?.includes(emoji);

                                            return (
                                                <button
                                                    type="button"
                                                    key={emoji}
                                                    onClick={() => handleReact(act.id, emoji)}
                                                    disabled={reactingActivityId === act.id}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                                                        isSelected
                                                            ? 'bg-[#5b4fff]/15 text-[#5b4fff] border-[#5b4fff]/30 font-bold scale-105'
                                                            : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    <span>{emoji}</span>
                                                    {count > 0 && <span className="text-[11px]">{count}</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onViewFriendDashboard(act.studentId)}
                                        className="text-[11px] h-7 text-zinc-500 hover:text-[#5b4fff] cursor-pointer"
                                    >
                                        View Dashboard →
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
