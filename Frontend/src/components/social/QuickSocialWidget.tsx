import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
    UsersIcon as Users,
    SwordIcon as Swords,
    ArrowRightIcon as ArrowRight
} from '@phosphor-icons/react';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import type { FriendDTO } from '@/types';

interface QuickSocialWidgetProps {
    onOpenSocialHub: (tab?: 'friends' | 'pvp' | 'leaderboard') => void;
}

function getEmptyFriendsMessage(friendsCount: number): string {
    if (friendsCount <= 0) {
        return 'Connect with peers to see real-time presence and compete in 1v1 duels!';
    }
    const plural = friendsCount > 1 ? 's' : '';
    return `${friendsCount} friend${plural} in your network. Check their activity or invite them to a live duel!`;
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
    const onlineFriends = friends.filter(f => Boolean(f.isOnline));
    // Display up to 5 live friends as per requirement
    const displayedLiveFriends = onlineFriends.slice(0, 5);

    const renderLiveFriendsContent = () => {
        if (isLoading) {
            return (
                <div className="p-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center animate-pulse">
                    <p className="text-xs text-zinc-400">Loading live friends...</p>
                </div>
            );
        }

        if (onlineFriends.length === 0) {
            return (
                <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No Friends Live Right Now</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xs mx-auto">
                            {getEmptyFriendsMessage(friends.length)}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => onOpenSocialHub('friends')}
                        className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-xs font-bold rounded-xl h-8 px-3.5 cursor-pointer shadow-xs"
                    >
                        {friends.length > 0 ? 'View Friends Network' : 'Find Coding Friends'}
                    </Button>
                </div>
            );
        }

        return (
            <>
                {/* Live Friends List: Limited to 5 */}
                <div className="space-y-2">
                    {displayedLiveFriends.map((f) => (
                        <div
                            key={f.id}
                            className="p-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/80 hover:border-[#5b4fff]/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50 transition-all flex items-center justify-between group shadow-2xs"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="relative shrink-0">
                                    <Avatar className="w-8 h-8 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarImage src={f.avatarUrl} className="object-cover" />
                                        <AvatarFallback className="bg-indigo-50 dark:bg-zinc-800 text-[#5b4fff] text-[10px] font-bold">
                                            {f.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Live indicator dot */}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a] ring-2 ring-emerald-500/30">
                                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                                    </span>
                                </div>
                                <div className="truncate min-w-0">
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#5b4fff] transition-colors">
                                        {f.name}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{f.totalSolved} solved</span>
                                        {f.currentContestRating ? (
                                            <>
                                                <span>·</span>
                                                <span>Rating: {Math.round(f.currentContestRating)}</span>
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                            </div>

                            {f.isBusy ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 shrink-0">
                                    In Duel
                                </span>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onOpenSocialHub('pvp')}
                                    className="h-7 px-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-white hover:bg-[#5b4fff] rounded-xl cursor-pointer gap-1 transition-all"
                                    title={`Challenge ${f.name} to 1v1 Duel`}
                                >
                                    <Swords className="w-3.5 h-3.5" />
                                    <span>Duel</span>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* If more than 5 friends are live, show redirect button to Friends Network */}
                {onlineFriends.length > 5 && (
                    <Button
                        onClick={() => onOpenSocialHub('friends')}
                        className="w-full text-xs font-bold h-8.5 rounded-xl bg-[#5b4fff]/10 hover:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/30 transition-all flex items-center justify-between px-3 cursor-pointer"
                    >
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>View All Friends ({onlineFriends.length} Live)</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                )}
            </>
        );
    };

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
            {/* Header with PVP indicator */}
            <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#5b4fff]/10 flex items-center justify-center text-[#5b4fff]">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>Friends & Duels</span>
                        </CardTitle>
                        <p className="text-[11px] text-zinc-400">Live community activity</p>
                    </div>
                </div>

                {activeDuelsCount > 0 ? (
                    <Badge
                        onClick={() => onOpenSocialHub('pvp')}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                    >
                        <Swords className="w-3.5 h-3.5 animate-spin" />
                        <span>{activeDuelsCount} Duel{activeDuelsCount > 1 ? 's' : ''} Active</span>
                    </Badge>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenSocialHub('pvp')}
                        className="text-xs font-bold text-[#5b4fff] hover:bg-[#5b4fff]/10 h-7 px-2.5 rounded-lg cursor-pointer"
                    >
                        Open Arena
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Live Friends Presence Counter */}
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Live Friends ({onlineFriends.length})</span>
                    </span>
                    <span className="text-[#5b4fff] dark:text-[#968fff] font-bold">
                        {friends.length} Connected
                    </span>
                </div>

                {renderLiveFriendsContent()}

                {/* Bottom link to full Friends Network */}
                <Button
                    variant="outline"
                    onClick={() => onOpenSocialHub('friends')}
                    className="w-full text-xs font-bold h-9 rounded-xl border-zinc-200/90 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 transition-all flex items-center justify-between px-3.5 cursor-pointer shadow-xs"
                >
                    <span>Open Friends Network & Hub</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Button>
            </CardContent>
        </Card>
    );
}
