import { useEffect, useState } from 'react';
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

export function QuickSocialWidget({ onOpenSocialHub }: QuickSocialWidgetProps) {
    const { user } = useAuth();
    const [friends, setFriends] = useState<FriendDTO[]>([]);
    const [activeDuelsCount, setActiveDuelsCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const [friendsRes, pvpRes] = await Promise.all([
                    SocialService.getFriends(),
                    SocialService.getPvpMatches()
                ]);
                const rawFriends: FriendDTO[] = friendsRes.data.friends || [];
                setFriends(rawFriends.filter(f => f.id !== user?.id));
                const active = pvpRes.data?.filter(m => m.status === 'IN_PROGRESS' || m.status === 'INVITED').length || 0;
                setActiveDuelsCount(active);
            } catch (err) {
                console.error('Failed to load quick social widget:', err);
            }
        };
        void load();
    }, [user?.id]);

    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-3.5 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#5b4fff]" /> Friends & PVP
                </CardTitle>
                {activeDuelsCount > 0 && (
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] animate-pulse">
                        {activeDuelsCount} Live Duel
                    </Badge>
                )}
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {friends.length === 0 ? (
                    <div className="text-center py-2 space-y-2">
                        <p className="text-xs text-zinc-500">Connect with peers to compare stats and duel in 1v1 challenges!</p>
                        <Button
                            size="sm"
                            onClick={() => onOpenSocialHub('friends')}
                            className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white text-xs rounded-xl h-8 px-3 cursor-pointer"
                        >
                            Find Friends
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
                            <span>Top Active Friends</span>
                            <span className="text-[#5b4fff] font-bold">{friends.length} Connected</span>
                        </div>

                        <div className="space-y-2">
                            {friends.slice(0, 3).map((f) => (
                                <div
                                    key={f.id}
                                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="w-7 h-7">
                                            <AvatarImage src={f.avatarUrl} />
                                            <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-[10px] font-bold">
                                                {f.name.substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{f.name}</p>
                                            <p className="text-[10px] text-zinc-400 truncate">{f.totalSolved} solved</p>
                                        </div>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => onOpenSocialHub('pvp')}
                                        className="h-7 w-7 text-zinc-400 hover:text-[#5b4fff] rounded-lg cursor-pointer"
                                        title="PVP Duel"
                                    >
                                        <Swords className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => onOpenSocialHub('friends')}
                            className="w-full text-xs font-semibold h-8.5 rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer justify-between"
                        >
                            <span>Open Social Hub</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
