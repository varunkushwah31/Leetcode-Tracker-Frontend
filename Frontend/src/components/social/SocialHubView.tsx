import { useState, useEffect } from 'react';
import {
    UsersIcon as Users,
    SwordIcon as Swords,
    ActivityIcon as Activity,
    TrophyIcon as Trophy,
    BookOpenIcon as BookOpen
} from '@phosphor-icons/react';
import { FriendsListTab } from './FriendsListTab';
import { PvpArenaTab } from './PvpArenaTab';
import { ActivityFeedTab } from './ActivityFeedTab';
import { FriendsLeaderboardTab } from './FriendsLeaderboardTab';
import { PeerStudyTab } from './PeerStudyTab';
import { FriendDashboardModal } from './FriendDashboardModal';
import { SocialService } from '../../services/endpoints';

export type SocialTabType = 'friends' | 'pvp' | 'activity' | 'leaderboard' | 'peer';

interface SocialHubViewProps {
    initialTab?: SocialTabType;
}

export function SocialHubView({ initialTab = 'friends' }: SocialHubViewProps) {
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

    useEffect(() => {
        const loadCounters = async () => {
            try {
                const [friendsRes, pvpRes] = await Promise.all([
                    SocialService.getFriends(),
                    SocialService.getPvpMatches()
                ]);
                setFriendsCount(friendsRes.data.friends?.length || 0);
                setPendingRequestsCount(friendsRes.data.pendingIncoming?.length || 0);
                const active = pvpRes.data?.filter(m => m.status === 'IN_PROGRESS' || m.status === 'INVITED').length || 0;
                setActiveDuelsCount(active);
            } catch (err) {
                console.error('Failed to load social hub counters:', err);
            }
        };
        void loadCounters();
    }, []);

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
            {/* Social Hub Top Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200/90 dark:border-zinc-800 custom-scrollbar">
                <button
                    type="button"
                    onClick={() => setActiveTab('friends')}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                        activeTab === 'friends'
                            ? 'bg-[#5b4fff] text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Friends Network</span>
                    {friendsCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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
                            ? 'bg-[#5b4fff] text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800'
                    }`}
                >
                    <Swords className="w-4 h-4" />
                    <span>PVP Duels</span>
                    {activeDuelsCount > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            activeTab === 'pvp' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
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
                            ? 'bg-[#5b4fff] text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800'
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
                            ? 'bg-[#5b4fff] text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800'
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
                            ? 'bg-[#5b4fff] text-white shadow-sm'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-800'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Peer Learning Hub</span>
                </button>
            </div>

            {/* Active Tab Content */}
            <div className="transition-all duration-200">
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
