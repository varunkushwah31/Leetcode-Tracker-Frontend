import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
    UsersIcon as Users,
    SwordIcon as Swords,
    ArrowRightIcon as ArrowRight,
    EyeIcon as Eye,
} from '@phosphor-icons/react';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import type { FriendDTO } from '@/types';
import { isFriendOnline, isFriendBusy } from '../../lib/presenceHelper';
import { SHOW_PVP_DUELS } from '../../config/socialFeatureFlags';

interface QuickSocialWidgetProps {
    onOpenSocialHub: (tab?: 'friends' | 'pvp' | 'leaderboard') => void;
}

function formatLastActive(lastActive?: string): string {
    if (!lastActive) return 'Offline';
    try {
        const date = new Date(lastActive);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        if (Number.isNaN(diffMs) || diffMs < 0) return 'Offline';
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return 'Just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return 'Offline';
    }
}

export function QuickSocialWidget({ onOpenSocialHub }: Readonly<QuickSocialWidgetProps>) {
    const { user } = useAuth();
    const [friends, setFriends] = useState<FriendDTO[]>([]);
    const [activeDuelsCount, setActiveDuelsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [friendsRes, pvpRes] = await Promise.all([
                SocialService.getFriends(),
                SocialService.getPvpMatches()
            ]);
            const rawFriends: FriendDTO[] = friendsRes.data?.friends || [];
            setFriends(rawFriends.filter(f => f.id !== user?.id));
            const active = pvpRes.data?.filter(m => m.status === 'IN_PROGRESS' || m.status === 'INVITED').length || 0;
            setActiveDuelsCount(active);
        } catch (err) {
            console.error('Failed to load quick social widget:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void loadData();
        // Periodic refresh to update live friends presence and duel counts
        const interval = setInterval(() => {
            void loadData();
        }, 15000);
        return () => clearInterval(interval);
    }, [loadData]);

    useEffect(() => {
        // Touch self presence
        void SocialService.pingPresence().catch(() => {});
        const presenceInterval = setInterval(() => {
            void SocialService.pingPresence().catch(() => {});
        }, 30000);
        return () => clearInterval(presenceInterval);
    }, []);

    // Filter to friends who are currently live / online
    const onlineFriends = useMemo(() => friends.filter(isFriendOnline), [friends]);

    // Active friends on top, then last active / offline friends below
    const sortedFriends = useMemo(() => {
        return [...friends].sort((a, b) => {
            const aOnline = isFriendOnline(a);
            const bOnline = isFriendOnline(b);

            // Active / Online friends always come first
            if (aOnline && !bOnline) return -1;
            if (!aOnline && bOnline) return 1;

            // Both online: prioritize free over busy, then by rating / solved
            if (aOnline && bOnline) {
                const aBusy = isFriendBusy(a);
                const bBusy = isFriendBusy(b);
                if (!aBusy && bBusy) return -1;
                if (aBusy && !bBusy) return 1;
                return (b.currentContestRating || 0) - (a.currentContestRating || 0) || (b.totalSolved || 0) - (a.totalSolved || 0);
            }

            // Both offline: sort by lastActive descending (most recent first)
            if (a.lastActive && b.lastActive) {
                const timeA = new Date(a.lastActive).getTime();
                const timeB = new Date(b.lastActive).getTime();
                if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
                    return timeB - timeA;
                }
            }
            if (a.lastActive && !b.lastActive) return -1;
            if (!a.lastActive && b.lastActive) return 1;

            // Fallback: total solved descending
            return (b.totalSolved || 0) - (a.totalSolved || 0) || (b.currentContestRating || 0) - (a.currentContestRating || 0);
        });
    }, [friends]);

    // Display top 5 friends
    const displayedFriends = useMemo(() => sortedFriends.slice(0, 5), [sortedFriends]);

    const renderFriendsContent = () => {
        if (isLoading) {
            return (
                <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center animate-pulse">
                    <p className="text-xs text-zinc-400">Loading friends list...</p>
                </div>
            );
        }

        if (friends.length === 0) {
            return (
                <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No Coding Friends Added Yet</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xs mx-auto leading-relaxed">
                            Connect with peers to track mutual milestones, see presence, and compete in 1v1 duels!
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onOpenSocialHub('friends')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl h-8.5 px-4 cursor-pointer shadow-xs"
                    >
                        Find Coding Friends
                    </Button>
                </div>
            );
        }

        return (
            <>
                {/* Friends List: Active on top, offline below (limited to 5) */}
                <div className="space-y-2">
                    {displayedFriends.map((f) => {
                        const isOnline = isFriendOnline(f);
                        const isBusy = isFriendBusy(f);
                        return (
                        <div
                            key={f.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between group shadow-2xs ${
                                isOnline
                                    ? 'bg-zinc-50/90 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
                                    : 'bg-zinc-50/50 dark:bg-[#141414]/50 border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <Avatar className={`w-9 h-9 border shadow-xs ${
                                        isOnline
                                            ? 'border-zinc-200 dark:border-zinc-700'
                                            : 'border-zinc-200/60 dark:border-zinc-800 opacity-80'
                                    }`}>
                                        <AvatarImage src={f.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-bold">
                                            {f.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Presence Indicator Dot */}
                                    {isOnline ? (
                                        isBusy ? (
                                            <span
                                                data-testid={`presence-dot-${f.id}`}
                                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-[#0c0c0e] ring-2 ring-amber-500/30"
                                                title="In Duel"
                                            />
                                        ) : (
                                            <span
                                                data-testid={`presence-dot-${f.id}`}
                                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c0c0e] ring-2 ring-emerald-500/30"
                                                title="Online"
                                            >
                                                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                                            </span>
                                        )
                                    ) : (
                                        <span
                                            data-testid={`presence-dot-${f.id}`}
                                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 border-2 border-white dark:border-[#0c0c0e]"
                                            title={`Last active ${formatLastActive(f.lastActive)}`}
                                        />
                                    )}
                                </div>
                                <div className="truncate min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                            {f.name}
                                        </p>
                                        {isOnline ? (
                                            isBusy ? (
                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                    In Duel
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                    Live
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                {formatLastActive(f.lastActive)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">{f.totalSolved} solved</span>
                                        {f.currentContestRating ? (
                                            <>
                                                <span>·</span>
                                                <span className="font-mono">Rating: {Math.round(f.currentContestRating)}</span>
                                            </>
                                        ) : f.streak > 0 ? (
                                            <>
                                                <span>·</span>
                                                <span className="text-amber-600 dark:text-amber-400 font-semibold">{f.streak}d streak</span>
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                            </div>

                            {/* Right Action: Duel for online, In Duel badge, or View profile for offline */}
                            {SHOW_PVP_DUELS && f.isOnline ? (
                                f.isBusy ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                                        In Duel
                                    </span>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => onOpenSocialHub(SHOW_PVP_DUELS ? 'pvp' : 'friends')}
                                        className="h-7.5 px-2.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer gap-1 transition-all shadow-2xs shrink-0"
                                        title={`Challenge ${f.name} to 1v1 Duel`}
                                    >
                                        <Swords className="w-3.5 h-3.5" />
                                        <span>Duel</span>
                                    </Button>
                                )
                            ) : (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onOpenSocialHub('friends')}
                                    className="h-7 px-2.5 text-[11px] font-semibold text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer gap-1 transition-colors shrink-0"
                                    title={`View ${f.name}'s profile`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Profile</span>
                                </Button>
                            )}
                        </div>
                    );})}
                </div>

                {/* If more than 5 total friends, show redirect button */}
                {friends.length > 5 && (
                    <Button
                        onClick={() => onOpenSocialHub('friends')}
                        className="w-full text-xs font-bold h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-all flex items-center justify-between px-3.5 cursor-pointer shadow-2xs"
                    >
                        <span className="flex items-center gap-2">
                            {onlineFriends.length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            <span>View All Friends ({friends.length} Total{onlineFriends.length > 0 ? ` · ${onlineFriends.length} Live` : ''})</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                )}
            </>
        );
    };

    return (
        <Card className="relative bg-white/95 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-sm dark:shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
            {/* Header with PVP indicator */}
            <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>{SHOW_PVP_DUELS ? 'Friends & Duels' : 'Coding Friends'}</span>
                        </CardTitle>
                        <p className="text-[11px] text-zinc-400 font-medium">Live community presence</p>
                    </div>
                </div>

                {SHOW_PVP_DUELS && activeDuelsCount > 0 ? (
                    <Badge
                        onClick={() => onOpenSocialHub(SHOW_PVP_DUELS ? 'pvp' : 'friends')}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-2xs animate-pulse"
                    >
                        <Swords className="w-3.5 h-3.5" />
                        <span>{activeDuelsCount} Duel{activeDuelsCount > 1 ? 's' : ''} Active</span>
                    </Badge>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenSocialHub(SHOW_PVP_DUELS ? 'pvp' : 'friends')}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-7.5 px-2.5 rounded-xl cursor-pointer"
                    >
                        {SHOW_PVP_DUELS ? 'Open Arena' : 'Network'}
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Live Friends Presence Counter */}
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 font-semibold">
                        <span className={`w-2 h-2 rounded-full ${onlineFriends.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        <span>{onlineFriends.length > 0 ? `${onlineFriends.length} Live Now` : 'No Friends Live'}</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {friends.length} Connected
                    </span>
                </div>

                {renderFriendsContent()}

                {/* Bottom link to full Friends Network */}
                <Button
                    variant="outline"
                    onClick={() => onOpenSocialHub('friends')}
                    className="w-full text-xs font-bold h-9.5 rounded-xl border-zinc-200/90 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 transition-all flex items-center justify-between px-3.5 cursor-pointer shadow-xs group"
                >
                    <span>Open Friends Network & Hub</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Button>
            </CardContent>
        </Card>
    );
}
