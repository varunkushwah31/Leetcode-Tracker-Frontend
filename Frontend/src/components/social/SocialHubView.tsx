import { useState, useEffect } from 'react';
import {
    UsersIcon as Users,
    SwordIcon as Swords,
    ActivityIcon as Activity,
    TrophyIcon as Trophy,
    BookOpenIcon as BookOpen,
    SparkleIcon as Sparkles
} from '@phosphor-icons/react';
import { FriendsListTab } from './FriendsListTab';
import { PvpArenaTab } from './PvpArenaTab';
import { ActivityFeedTab } from './ActivityFeedTab';
import { FriendsLeaderboardTab } from './FriendsLeaderboardTab';
import { PeerStudyTab } from './PeerStudyTab';
import { FriendDashboardModal } from './FriendDashboardModal';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import type { PvpMatchDTO } from '@/types';

export type SocialTabType = 'friends' | 'pvp' | 'activity' | 'leaderboard' | 'peer';

interface SocialHubViewProps {
    initialTab?: SocialTabType;
}

export function SocialHubView({ initialTab = 'friends' }: Readonly<SocialHubViewProps>) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SocialTabType>(initialTab);

    // Selected friend for modal viewer
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
    const [dashboardModalOpen, setDashboardModalOpen] = useState(false);

    // Target friend when initiating a PVP challenge from another tab
    const [challengeTarget, setChallengeTarget] = useState<{ friendId: string; friendName: string } | null>(null);

    // Summary counters
    const [friendsCount, setFriendsCount] = useState(0);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [activeDuelsCount, setActiveDuelsCount] = useState(0);

    // PVP Match Record Stats
    const [pvpStats, setPvpStats] = useState<{
        wins: number;
        losses: number;
        draws: number;
        total: number;
        winRate: number;
    }>({ wins: 0, losses: 0, draws: 0, total: 0, winRate: 0 });

    useEffect(() => {
        const loadCounters = async () => {
            try {
                const [friendsRes, pvpRes] = await Promise.all([
                    SocialService.getFriends(),
                    SocialService.getPvpMatches()
                ]);

                const friendsList = friendsRes.data.friends || [];
                setFriendsCount(friendsList.length);
                setPendingRequestsCount(friendsRes.data.pendingIncoming?.length || 0);

                const matches: PvpMatchDTO[] = pvpRes.data || [];
                const active = matches.filter(m => m.status === 'IN_PROGRESS' || m.status === 'INVITED').length;
                setActiveDuelsCount(active);

                // Compute PVP record
                if (user?.id) {
                    const completed = matches.filter(m => m.status === 'COMPLETED');
                    let wins = 0;
                    let losses = 0;
                    let draws = 0;

                    completed.forEach(m => {
                        if (m.winnerId === user.id) {
                            wins++;
                        } else if (m.winnerId) {
                            losses++;
                        } else {
                            draws++;
                        }
                    });

                    const total = wins + losses + draws;
                    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                    setPvpStats({ wins, losses, draws, total, winRate });
                }
            } catch (err) {
                console.error('Failed to load social hub counters:', err);
            }
        };
        void loadCounters();
    }, [user?.id]);

    const handleViewFriendDashboard = (friendId: string) => {
        setSelectedFriendId(friendId);
        setDashboardModalOpen(true);
    };

    const handleChallengePvp = (friendId?: string, friendName?: string) => {
        if (friendId && friendName) {
            setChallengeTarget({ friendId, friendName });
        }
        setActiveTab('pvp');
    };

    return (
        <div className="space-y-6">
            {/* Social Hub Hero Command Center Banner */}
            <div className="relative group">
                <div className="hidden dark:block">
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 bg-[#5b4fff] opacity-15 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-72 h-72 bg-amber-500 opacity-10 blur-[100px] rounded-full pointer-events-none" />
                </div>

                <div className="relative z-10 bg-white dark:bg-[#111111]/70 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/60 shadow-md dark:shadow-2xl overflow-hidden rounded-[2rem] p-6 sm:p-8">
                    {/* Subtle gradient accent top line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#5b4fff]/60 to-transparent pointer-events-none" />

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        {/* Title & Description */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-[#5b4fff]/20 to-indigo-600/10 border border-[#5b4fff]/30 flex items-center justify-center text-[#5b4fff] dark:text-[#968fff] shadow-lg shadow-[#5b4fff]/10 shrink-0">
                                <Swords className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>

                            <div>
                                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                        Social Hub & Competitive Arena
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/25">
                                        Live PVP
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                                    Challenge friends to 1v1 live coding duels, climb friend leaderboards, and share non-spoiler algorithmic insights.
                                </p>
                            </div>
                        </div>

                        {/* Summary Metrics Bar */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-inner w-full lg:w-auto">
                            {/* Friends Count */}
                            <div className="text-center px-3 min-w-[70px]">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 flex items-center justify-center gap-1">
                                    <Users className="w-3 h-3 text-[#5b4fff]" /> Friends
                                </p>
                                <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white mt-0.5">
                                    {friendsCount}
                                </p>
                                <p className="text-[10px] text-zinc-400">Connected</p>
                            </div>

                            {/* PVP Record */}
                            <div className="text-center px-3 min-w-[85px] border-l border-zinc-200 dark:border-zinc-800">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 flex items-center justify-center gap-1">
                                    <Swords className="w-3 h-3 text-[#5b4fff]" /> Duel Record
                                </p>
                                <p className="text-xl sm:text-2xl font-extrabold flex items-center justify-center gap-1 mt-0.5">
                                    <span className="text-emerald-600 dark:text-emerald-400">{pvpStats.wins}W</span>
                                    <span className="text-zinc-400 text-xs font-normal">-</span>
                                    <span className="text-rose-600 dark:text-rose-400">{pvpStats.losses}L</span>
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                    {pvpStats.total > 0 ? `${pvpStats.winRate}% Win Rate` : 'No Duels Yet'}
                                </p>
                            </div>

                            {/* Live Duels */}
                            <div className="text-center px-3 min-w-[75px] border-l border-zinc-200 dark:border-zinc-800">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 flex items-center justify-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" /> Active Duels
                                </p>
                                <p className="text-xl sm:text-2xl font-extrabold text-amber-500 mt-0.5">
                                    {activeDuelsCount}
                                </p>
                                <p className="text-[10px] text-zinc-400">In Progress</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Hub Top Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 rounded-2xl shadow-xs custom-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveTab('friends')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'friends'
                            ? 'bg-[#5b4fff] text-white shadow-md ring-2 ring-[#5b4fff]/20'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Friends Network</span>
                    {friendsCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === 'friends' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}>
                            {friendsCount}
                        </span>
                    )}
                    {pendingRequestsCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('pvp')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'pvp'
                            ? 'bg-[#5b4fff] text-white shadow-md ring-2 ring-[#5b4fff]/20'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                >
                    <Swords className="w-4 h-4" />
                    <span>PVP Duels</span>
                    {activeDuelsCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            activeTab === 'pvp' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                        }`}>
                            {activeDuelsCount} Live
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'activity'
                            ? 'bg-[#5b4fff] text-white shadow-md ring-2 ring-[#5b4fff]/20'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    <span>Activity Feed</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'leaderboard'
                            ? 'bg-[#5b4fff] text-white shadow-md ring-2 ring-[#5b4fff]/20'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                >
                    <Trophy className="w-4 h-4" />
                    <span>Friends Leaderboard</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('peer')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'peer'
                            ? 'bg-[#5b4fff] text-white shadow-md ring-2 ring-[#5b4fff]/20'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Peer Learning Hub</span>
                </button>
            </div>

            {/* Active Sub-tab Content */}
            <div className="animate-in fade-in duration-200">
                {activeTab === 'friends' && (
                    <FriendsListTab
                        onViewDashboard={handleViewFriendDashboard}
                        onChallengePvp={handleChallengePvp}
                    />
                )}

                {activeTab === 'pvp' && (
                    <PvpArenaTab
                        initialChallengerTarget={challengeTarget}
                        onClearInitialTarget={() => setChallengeTarget(null)}
                    />
                )}

                {activeTab === 'activity' && (
                    <ActivityFeedTab onViewFriendDashboard={handleViewFriendDashboard} />
                )}

                {activeTab === 'leaderboard' && (
                    <FriendsLeaderboardTab onViewDashboard={handleViewFriendDashboard} />
                )}

                {activeTab === 'peer' && (
                    <PeerStudyTab onChallengePvp={handleChallengePvp} />
                )}
            </div>

            {/* Friend Dashboard Modal */}
            <FriendDashboardModal
                friendId={selectedFriendId}
                open={dashboardModalOpen}
                onClose={() => {
                    setDashboardModalOpen(false);
                    setSelectedFriendId(null);
                }}
                onChallengePvp={handleChallengePvp}
            />
        </div>
    );
}
