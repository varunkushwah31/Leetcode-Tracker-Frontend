import { useState, useEffect } from 'react';
import {
    UsersIcon as Users,
    SwordIcon as Swords,
    ActivityIcon as Activity,
    TrophyIcon as Trophy,
    BookOpenIcon as BookOpen,
    WarningCircleIcon as AlertCircle,
    XIcon as X,
    LightningIcon as Lightning,
    ShieldSlashIcon
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
    const [challengeTarget, setChallengeTarget] = useState<{
        friendId: string;
        friendName: string;
        customProblemTitle?: string;
        customProblemLink?: string;
    } | null>(null);

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
        void SocialService.pingPresence().catch(() => {});
        const presenceInterval = setInterval(() => {
            void SocialService.pingPresence().catch(() => {});
        }, 30000);
        return () => clearInterval(presenceInterval);
    }, []);

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

    // Warning state when attempting to view own profile
    const [selfViewWarning, setSelfViewWarning] = useState<string | null>(null);

    useEffect(() => {
        if (!selfViewWarning) return;
        const timer = setTimeout(() => {
            setSelfViewWarning(null);
        }, 6000);
        return () => clearTimeout(timer);
    }, [selfViewWarning]);

    const handleViewFriendDashboard = (friendId: string) => {
        if (!friendId) return;
        if (friendId === user?.id) {
            setSelfViewWarning('You cannot view your own profile in Social Hub. Please view your personal dashboard in the Overview tab.');
            return;
        }
        setSelectedFriendId(friendId);
        setDashboardModalOpen(true);
    };

    const handleChallengePvp = (
        friendId?: string,
        friendName?: string,
        customProblemTitle?: string,
        customProblemLink?: string
    ) => {
        if (friendId && friendName) {
            setChallengeTarget({ friendId, friendName, customProblemTitle, customProblemLink });
        } else if (customProblemTitle || customProblemLink) {
            setChallengeTarget({
                friendId: '',
                friendName: '',
                customProblemTitle,
                customProblemLink
            });
        }
        setActiveTab('pvp');
    };

    return (
        <div className="space-y-6">
            {/* Social Hub Command Center Hero Bar */}
            <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm dark:shadow-xl p-5 sm:p-6 transition-all duration-300">
                {/* Decorative Subtle Gradient Glow Overlay */}
                <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-linear-to-br from-[#5b4fff]/10 via-[#968fff]/5 to-transparent blur-3xl dark:from-[#5b4fff]/15" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-linear-to-tr from-amber-500/5 via-rose-500/5 to-transparent blur-3xl" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Title, Badge & Subtitle */}
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#5b4fff] to-[#4335e6] text-white flex items-center justify-center shadow-md shadow-[#5b4fff]/25 shrink-0 ring-4 ring-[#5b4fff]/10">
                            <Swords className="w-6 h-6" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                                    Social Hub & Competitive Arena
                                </h1>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                                    <Lightning className="w-3 h-3 text-[#5b4fff] dark:text-[#968fff]" />
                                    Live Arena
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                                Challenge peers to 1v1 speed duels, track real-time standings, collaborate on non-spoiler hints, and celebrate daily problem milestones.
                            </p>
                        </div>
                    </div>

                    {/* Summary Metric Chips */}
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
                        {/* Friends Count Chip */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('friends')}
                            className="px-3.5 py-2 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 text-xs transition-all cursor-pointer shadow-2xs group"
                            title="View Friends Network"
                        >
                            <div className="w-6 h-6 rounded-lg bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block tracking-wider leading-none mb-0.5">Friends</span>
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs tabular-nums">{friendsCount} Connected</span>
                            </div>
                        </button>

                        {/* PVP Combat Record Chip */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('pvp')}
                            className="px-3.5 py-2 rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-2.5 text-xs transition-all cursor-pointer shadow-2xs group"
                            title="View PVP Duels & Career Record"
                        >
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Swords className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block tracking-wider leading-none mb-0.5">PVP Record</span>
                                <span className="font-bold text-xs tabular-nums">
                                    <span className="text-emerald-600 dark:text-emerald-400">{pvpStats.wins}W</span>
                                    <span className="text-zinc-400 mx-0.5">-</span>
                                    <span className="text-rose-600 dark:text-rose-400">{pvpStats.losses}L</span>
                                    {pvpStats.total > 0 && (
                                        <span className="text-zinc-500 dark:text-zinc-400 font-normal text-[10px] ml-1">({pvpStats.winRate}%)</span>
                                    )}
                                </span>
                            </div>
                        </button>

                        {/* Live Duels Status Chip */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('pvp')}
                            className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2.5 text-xs transition-all cursor-pointer shadow-2xs ${
                                activeDuelsCount > 0
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                    : 'bg-zinc-50/90 dark:bg-zinc-900/60 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
                            }`}
                            title="View Live Duels"
                        >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${activeDuelsCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500/10 text-amber-500'}`}>
                                <ShieldSlashIcon  className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-left">
                                <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block tracking-wider leading-none mb-0.5">Live Duels</span>
                                <span className={`font-bold text-xs tabular-nums ${activeDuelsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {activeDuelsCount > 0 ? `${activeDuelsCount} Active Battle${activeDuelsCount > 1 ? 's' : ''}` : '0 Active'}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Segmented Tab Navigation Bar */}
                <div className="relative z-10 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('friends')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'friends'
                                ? 'bg-[#5b4fff] text-white shadow-sm shadow-[#5b4fff]/25 ring-2 ring-[#5b4fff]/20'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Friends Network</span>
                        {friendsCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold ${
                                activeTab === 'friends' ? 'bg-white/20 text-white' : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                                {friendsCount}
                            </span>
                        )}
                        {pendingRequestsCount > 0 && (
                            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-bold bg-rose-500 text-white animate-pulse">
                                {pendingRequestsCount} new
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('pvp')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'pvp'
                                ? 'bg-[#5b4fff] text-white shadow-sm shadow-[#5b4fff]/25 ring-2 ring-[#5b4fff]/20'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Swords className="w-4 h-4" />
                        <span>PVP Duels</span>
                        {activeDuelsCount > 0 && (
                            <span className={`px-2 py-0.2 rounded-full text-[10px] tabular-nums font-bold ${
                                activeTab === 'pvp' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 animate-pulse'
                            }`}>
                                {activeDuelsCount} Live
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('activity')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'activity'
                                ? 'bg-[#5b4fff] text-white shadow-sm shadow-[#5b4fff]/25 ring-2 ring-[#5b4fff]/20'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Activity className="w-4 h-4" />
                        <span>Activity Feed</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'leaderboard'
                                ? 'bg-[#5b4fff] text-white shadow-sm shadow-[#5b4fff]/25 ring-2 ring-[#5b4fff]/20'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Trophy className="w-4 h-4" />
                        <span>Friends Leaderboard</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('peer')}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'peer'
                                ? 'bg-[#5b4fff] text-white shadow-sm shadow-[#5b4fff]/25 ring-2 ring-[#5b4fff]/20'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Peer Learning Hub</span>
                    </button>
                </div>
            </div>

            {/* Self-Profile View Warning Banner */}
            {selfViewWarning && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-600/40 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
                            <AlertCircle className="w-5 h-5" weight="fill" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                            {selfViewWarning}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSelfViewWarning(null)}
                        className="p-1.5 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                        title="Dismiss warning"
                        aria-label="Dismiss warning"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Active Sub-tab Content with Smooth Transition */}
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
                    <FriendsLeaderboardTab
                        onViewDashboard={handleViewFriendDashboard}
                        onChallengePvp={handleChallengePvp}
                    />
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
