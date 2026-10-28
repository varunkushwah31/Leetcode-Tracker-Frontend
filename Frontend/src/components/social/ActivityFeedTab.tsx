import { useState, useEffect, useCallback } from 'react';
import {
    ActivityIcon as Activity,
    ArrowSquareOutIcon as ExternalLink,
    SpinnerIcon as Loader2,
    ClockIcon as Clock,
    TrophyIcon as Trophy,
    CheckCircleIcon as CheckCircle2,
    FireIcon as Flame,
    RocketLaunchIcon as RocketLaunch,
    LightbulbIcon as Lightbulb,
    HandsClappingIcon as HandsClapping,
    HeartIcon as Heart,
    UsersIcon as Users,
    SwordIcon as Swords
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { formatProblemTitle } from '@/lib/problemFormatter';
import type { FriendActivityDTO } from '@/types';

interface ActivityFeedTabProps {
    onViewFriendDashboard: (friendId: string) => void;
}

const reactionDefinitions = [
    { key: 'fire', label: 'Fire', Icon: Flame, legacy: 'fire' },
    { key: 'rocket', label: 'Rocket', Icon: RocketLaunch, legacy: 'rocket' },
    { key: 'insight', label: 'Idea', Icon: Lightbulb, legacy: 'insight' },
    { key: 'clap', label: 'Clap', Icon: HandsClapping, legacy: 'clap' },
    { key: 'heart', label: 'Kudos', Icon: Heart, legacy: 'heart' }
];

function getActivityBadgeClass(type: string): string {
    if (type === 'PVP_WIN') {
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25';
    }
    if (type === 'PROBLEM_SOLVED') {
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25';
    }
    if (type === 'NEW_FRIEND') {
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25';
    }
    if (type === 'PVP_DRAW') {
        return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25';
    }
    return 'bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/25';
}

function getActivityTypeIcon(type: string) {
    if (type === 'PVP_WIN') return Trophy;
    if (type === 'PROBLEM_SOLVED') return CheckCircle2;
    if (type === 'NEW_FRIEND') return Users;
    if (type === 'PVP_DRAW') return Swords;
    return Activity;
}

function formatRelativeTime(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        if (diffSecs < 60) return 'Just now';
        const diffMins = Math.floor(diffSecs / 60);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return 'Recently';
    }
}

export function ActivityFeedTab({ onViewFriendDashboard }: Readonly<ActivityFeedTabProps>) {
    const { user } = useAuth();
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
        }, 12000);
        return () => clearInterval(interval);
    }, [loadActivities]);

    const handleReact = async (activityId: string, reactionKey: string) => {
        setReactingActivityId(activityId);
        try {
            const res = await SocialService.reactToActivity(activityId, reactionKey);
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                <p className="text-xs font-bold text-zinc-500">Loading friend activity stream...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with filter buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#0c0c0e]/85 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] flex items-center justify-center shrink-0 ring-4 ring-[#5b4fff]/10">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                Live Peer Activity Feed
                            </h3>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Stream
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Real-time solved problems, duel victories, and milestones from your friend network.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/90 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shrink-0 shadow-2xs">
                    <button
                        type="button"
                        onClick={() => setFilter('ALL')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            filter === 'ALL'
                                ? 'bg-white dark:bg-zinc-800 text-[#5b4fff] dark:text-[#968fff] shadow-xs font-black border border-zinc-200/60 dark:border-zinc-700/60'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        All Activity
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('SOLVES')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            filter === 'SOLVES'
                                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-zinc-200/60 dark:border-zinc-700/60'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Solves
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('DUELS')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                            filter === 'DUELS'
                                ? 'bg-white dark:bg-zinc-800 text-[#5b4fff] dark:text-[#968fff] shadow-xs font-black border border-zinc-200/60 dark:border-zinc-700/60'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5" /> PVP Duels
                    </button>
                </div>
            </div>

            {/* Activities List */}
            {filteredActivities.length === 0 ? (
                <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mx-auto shadow-inner">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                        <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">No Activity Logged Yet</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Add friends and solve problems or complete 1v1 duels to see real-time algorithmic updates and celebrate victories here!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredActivities.map((act) => {
                        const formattedTitle = act.title ? formatProblemTitle(act.title) : 'Activity';

                        const isNewFriend = act.type === 'NEW_FRIEND';
                        const isSelf = Boolean(user?.id && act.studentId === user.id);

                        // For NEW_FRIEND activities: whenever user became friends with another user,
                        // show the profile pic, name, and details of the friend they have made friends with:
                        const displayStudentId = (isNewFriend && isSelf && act.targetStudentId)
                            ? act.targetStudentId
                            : act.studentId;
                        const displayStudentName = (isNewFriend && isSelf && act.targetStudentName)
                            ? act.targetStudentName
                            : act.studentName;
                        const displayStudentHandle = (isNewFriend && isSelf && act.targetStudentHandle)
                            ? act.targetStudentHandle
                            : act.studentHandle;
                        const displayStudentAvatarUrl = (isNewFriend && isSelf && act.targetStudentAvatarUrl)
                            ? act.targetStudentAvatarUrl
                            : act.studentAvatarUrl;

                        const isDisplayUserSelf = Boolean(user?.id && displayStudentId === user.id);
                        const TypeIcon = getActivityTypeIcon(act.type);

                        return (
                            <div
                                key={act.id}
                                className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#111114]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs hover:border-[#5b4fff]/40 hover:shadow-lg dark:hover:shadow-[#5b4fff]/5 transition-all space-y-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => onViewFriendDashboard(displayStudentId)}
                                            className="cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                                            title={isDisplayUserSelf ? "Your profile notice" : `View ${displayStudentName}'s profile`}
                                        >
                                            <Avatar className={`w-12 h-12 border-2 ${isDisplayUserSelf ? 'border-[#5b4fff]/40 ring-2 ring-[#5b4fff]/20' : 'border-zinc-200 dark:border-zinc-700'} shadow-sm`}>
                                                <AvatarImage src={displayStudentAvatarUrl} />
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                                                    {displayStudentName.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </button>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewFriendDashboard(displayStudentId)}
                                                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight hover:text-[#5b4fff] transition-colors truncate text-left cursor-pointer"
                                                    title={isDisplayUserSelf ? "Your profile notice" : `View ${displayStudentName}'s profile`}
                                                >
                                                    {displayStudentName}
                                                </button>
                                                {isDisplayUserSelf && (
                                                    <span className="text-[#5b4fff] text-xs font-bold">(You)</span>
                                                )}
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    @{displayStudentHandle || 'coder'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                    className={`text-[9px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${getActivityBadgeClass(act.type)}`}
                                                >
                                                    <TypeIcon className="w-3 h-3" />
                                                    <span>{act.type.replaceAll('_', ' ')}</span>
                                                </Badge>
                                                <span
                                                    className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 tabular-nums font-medium"
                                                    title={`${new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${new Date(act.createdAt).toLocaleDateString()}`}
                                                >
                                                    <Clock className="w-3 h-3 text-zinc-400" />
                                                    {formatRelativeTime(act.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {act.link && (
                                        <a
                                            href={act.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-zinc-400 hover:text-[#5b4fff] transition-colors p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:border-zinc-700"
                                            title="View Problem on Platform"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>

                                {/* Content / Description Box */}
                                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/60 space-y-1 text-xs">
                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm tracking-tight leading-snug">
                                        {formattedTitle}
                                    </p>
                                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-xs">
                                        {act.description}
                                    </p>
                                </div>

                                {/* Reactions / Kudos Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/70">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {reactionDefinitions.map((item) => {
                                            const count = (act.reactionCounts?.[item.key] || 0) + (act.reactionCounts?.[item.legacy] || 0);
                                            const isSelected = act.myReactions?.includes(item.key) || act.myReactions?.includes(item.legacy);

                                            return (
                                                <button
                                                    type="button"
                                                    key={item.key}
                                                    onClick={() => handleReact(act.id, item.key)}
                                                    disabled={reactingActivityId === act.id}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                                                        isSelected
                                                            ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/40 font-bold scale-105 shadow-xs'
                                                            : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    <item.Icon className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold">{item.label}</span>
                                                    {count > 0 && <span className="text-[11px] tabular-nums font-bold">({count})</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {isDisplayUserSelf ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewFriendDashboard(displayStudentId)}
                                            className="text-xs h-8 text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer rounded-xl font-bold"
                                            title="View activity notice"
                                        >
                                            Your Activity (You) →
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewFriendDashboard(displayStudentId)}
                                            className="text-xs h-8 text-zinc-500 hover:text-[#5b4fff] hover:bg-[#5b4fff]/10 cursor-pointer rounded-xl font-bold"
                                        >
                                            {isNewFriend ? 'View Friend Profile →' : 'View Profile & Overlap →'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
