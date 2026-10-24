import { useState, useEffect } from 'react';
import {
    UsersIcon as Users,
    SwordIcon as Swords,
    ActivityIcon as Activity,
    TrophyIcon as Trophy,
    BookOpenIcon as BookOpen,
    SparkleIcon as Sparkles,
    WarningCircleIcon as AlertCircle,
    XIcon as X
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
            {/* Social Hub Command Center Header */}
            <div className="bg-white dark:bg-[#0c0c0e]/80 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/60 shadow-xs rounded-2xl p-5 sm:p-6 transition-all duration-200 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Title & Description */}
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 border border-[#5b4fff]/25 flex items-center justify-center text-[#5b4fff] dark:text-[#968fff] shadow-2xs shrink-0">
                            <Swords className="w-5 h-5" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                    Social Hub & Competitive Arena
                                </h1>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                                    Live Arena
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Challenge peers to 1v1 speed duels, climb competitive leaderboards, and share algorithmic insights.
                            </p>
                        </div>
                    </div>

                    {/* Summary Metric Chips */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                        {/* Friends Count */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-2 text-xs">
                            <Users className="w-3.5 h-3.5 text-[#5b4fff]" />
                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Friends:</span>
                            <span className="font-bold text-zinc-900 dark:text-white font-mono">{friendsCount}</span>
                        </div>

                        {/* PVP Record */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-2 text-xs">
                            <Swords className="w-3.5 h-3.5 text-[#5b4fff]" />
                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Record:</span>
                            <span className="font-bold font-mono">
                                <span className="text-emerald-600 dark:text-emerald-400">{pvpStats.wins}W</span>
                                <span className="text-zinc-400 mx-0.5 font-normal">-</span>
                                <span className="text-rose-600 dark:text-rose-400">{pvpStats.losses}L</span>
                            </span>
                        </div>

                        {/* Live Duels */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/60 flex items-center gap-2 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Duels:</span>
                            <span className={`font-bold font-mono ${activeDuelsCount > 0 ? 'text-rose-500 animate-pulse' : 'text-zinc-900 dark:text-white'}`}>
                                {activeDuelsCount} Live
                            </span>
                        </div>
                    </div>
                </div>

                {/* Integrated Navigation Tabs Bar */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/70 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('friends')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'friends'
                                ? 'bg-[#5b4fff] text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>Friends Network</span>
                        {friendsCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                activeTab === 'friends' ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'pvp'
                                ? 'bg-[#5b4fff] text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Swords className="w-3.5 h-3.5" />
                        <span>PVP Duels</span>
                        {activeDuelsCount > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                activeTab === 'pvp' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                            }`}>
                                {activeDuelsCount} Live
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('activity')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'activity'
                                ? 'bg-[#5b4fff] text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Activity Feed</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'leaderboard'
                                ? 'bg-[#5b4fff] text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Friends Leaderboard</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('peer')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                            activeTab === 'peer'
                                ? 'bg-[#5b4fff] text-white shadow-xs'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Peer Learning Hub</span>
                    </button>
                </div>
            </div>

            {/* Self-Profile View Warning Banner */}
            {selfViewWarning && (
                <div
                    role="alert"
                    className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-600/40 shadow-sm flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
                            <AlertCircle className="w-4 h-4" weight="fill" />
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300">
                            {selfViewWarning}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSelfViewWarning(null)}
                        className="p-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                        title="Dismiss warning"
                        aria-label="Dismiss warning"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}



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
