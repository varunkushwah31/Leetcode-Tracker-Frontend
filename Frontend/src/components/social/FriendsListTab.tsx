import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MagnifyingGlassIcon as Search,
    UserPlusIcon as UserPlus,
    CheckIcon as Check,
    XIcon as X,
    TrashIcon as Trash2,
    EyeIcon as Eye,
    SwordIcon as Swords,
    SpinnerIcon as Loader2,
    UsersIcon as Users,
    ArrowSquareOutIcon as ExternalLink,
    PaperPlaneRightIcon as Send,
    ChartLineUpIcon as ChartLineUp,
    ShieldCheckIcon as ShieldCheck,
    ArrowsDownUpIcon as ArrowsDownUp
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { StreakFlame } from '../ui/StreakFlame';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { getCScoreTier } from '../../lib/cScoreCalculator';
import type { FriendDTO, FriendRequestDTO, SocialSearchStudentDTO } from '@/types';

interface FriendsListTabProps {
    onViewDashboard: (friendId: string) => void;
    onChallengePvp: (friendId: string, friendName: string) => void;
}

function extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } | string } };
        if (typeof axiosErr.response?.data === 'string') return axiosErr.response.data;
        if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}

function getDuelButtonTitle(friend: FriendDTO): string {
    if (friend.isBusy) {
        return `${friend.name} is currently busy in another duel`;
    }
    if (!friend.isOnline) {
        return `${friend.name} is offline. Both players must be live to duel`;
    }
    return `Challenge ${friend.name} to 1v1 Duel`;
}

type FriendFilterType = 'ALL' | 'ONLINE' | 'IN_DUEL';
type FriendSortType = 'CSCORE' | 'SOLVED' | 'RATING' | 'STREAK';

export function FriendsListTab({ onViewDashboard, onChallengePvp }: Readonly<FriendsListTabProps>) {
    const { user } = useAuth();
    const [friends, setFriends] = useState<FriendDTO[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequestDTO[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter & Sort within Friends
    const [friendsFilter, setFriendsFilter] = useState<FriendFilterType>('ALL');
    const [friendsSort, setFriendsSort] = useState<FriendSortType>('CSCORE');
    const [friendSearchQuery, setFriendSearchQuery] = useState('');

    // Global Search / Discover peers state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SocialSearchStudentDTO[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [friendToRemove, setFriendToRemove] = useState<FriendDTO | null>(null);
    const [isRemovingFriend, setIsRemovingFriend] = useState(false);

    const loadFriendsData = useCallback(async () => {
        try {
            const res = await SocialService.getFriends();
            const rawFriends: FriendDTO[] = res.data.friends || [];
            const rawIncoming: FriendRequestDTO[] = res.data.pendingIncoming || [];
            const rawOutgoing: FriendRequestDTO[] = res.data.pendingOutgoing || [];

            setFriends(rawFriends.filter(f => f.id !== user?.id));
            setIncomingRequests(rawIncoming.filter(r => r.requesterId !== user?.id));
            setOutgoingRequests(rawOutgoing.filter(r => r.receiverId !== user?.id));
        } catch (err: unknown) {
            console.error('Failed to load friends:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void loadFriendsData();
    }, [loadFriendsData]);

    // Handle search query with debounce
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await SocialService.searchStudents(searchQuery);
                const rawResults: SocialSearchStudentDTO[] = res.data || [];
                setSearchResults(rawResults.filter(s => s.id !== user?.id && (s.email?.toLowerCase() !== user?.email?.toLowerCase())));
            } catch (err) {
                console.error('Failed to search students:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, user?.id, user?.email]);

    const onlineCount = useMemo(() => friends.filter(f => Boolean(f.isOnline)).length, [friends]);
    const inDuelCount = useMemo(() => friends.filter(f => Boolean(f.isBusy)).length, [friends]);

    // Filtered & Sorted Friends List
    const displayedFriends = useMemo(() => {
        let list = [...friends];

        // 1. Text filter
        if (friendSearchQuery.trim()) {
            const q = friendSearchQuery.toLowerCase();
            list = list.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.leetcodeUsername?.toLowerCase().includes(q) ||
                f.codeforcesHandle?.toLowerCase().includes(q) ||
                f.email?.toLowerCase().includes(q)
            );
        }

        // 2. Status filter
        if (friendsFilter === 'ONLINE') {
            list = list.filter(f => Boolean(f.isOnline));
        } else if (friendsFilter === 'IN_DUEL') {
            list = list.filter(f => Boolean(f.isBusy));
        }

        // 3. Sort
        list.sort((a, b) => {
            // First by online if desired or pure metric
            if (friendsSort === 'CSCORE') {
                return (b.cScore ?? 500) - (a.cScore ?? 500);
            }
            if (friendsSort === 'SOLVED') {
                return (b.totalSolved || 0) - (a.totalSolved || 0);
            }
            if (friendsSort === 'RATING') {
                return (b.currentContestRating || 0) - (a.currentContestRating || 0);
            }
            if (friendsSort === 'STREAK') {
                return (b.streak || 0) - (a.streak || 0);
            }
            return 0;
        });

        return list;
    }, [friends, friendSearchQuery, friendsFilter, friendsSort]);

    const handleSendRequest = async (targetId: string) => {
        if (!targetId || targetId === user?.id) {
            setFeedbackMessage({ text: 'You cannot send a friend request to yourself.', type: 'error' });
            return;
        }
        setActionLoadingId(targetId);
        try {
            await SocialService.sendFriendRequest(targetId);
            setFeedbackMessage({ text: 'Friend request sent successfully!', type: 'success' });
            setSearchResults(prev =>
                prev.map(s => (s.id === targetId ? { ...s, friendshipStatus: 'PENDING_OUTGOING' } : s))
            );
            void loadFriendsData();
        } catch (err: unknown) {
            setFeedbackMessage({
                text: extractErrorMessage(err, 'Failed to send friend request.'),
                type: 'error'
            });
        } finally {
            setActionLoadingId(null);
            setTimeout(() => setFeedbackMessage(null), 4000);
        }
    };

    const handleAccept = async (requestId: string) => {
        setActionLoadingId(requestId);
        try {
            await SocialService.acceptFriendRequest(requestId);
            setFeedbackMessage({ text: 'Friend request accepted! New coding peer added.', type: 'success' });
            void loadFriendsData();
        } catch (err: unknown) {
            setFeedbackMessage({
                text: extractErrorMessage(err, 'Failed to accept request.'),
                type: 'error'
            });
        } finally {
            setActionLoadingId(null);
            setTimeout(() => setFeedbackMessage(null), 4000);
        }
    };

    const handleReject = async (requestId: string) => {
        setActionLoadingId(requestId);
        try {
            await SocialService.rejectFriendRequest(requestId);
            void loadFriendsData();
        } catch (err: unknown) {
            console.error('Failed to decline request:', err);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleConfirmRemove = async () => {
        if (!friendToRemove) return;
        setIsRemovingFriend(true);
        setActionLoadingId(friendToRemove.id);
        try {
            await SocialService.removeFriend(friendToRemove.id);
            setFeedbackMessage({ text: `Removed ${friendToRemove.name} from friends list.`, type: 'success' });
            setFriendToRemove(null);
            void loadFriendsData();
        } catch (err: unknown) {
            console.error('Failed to remove friend:', err);
            setFeedbackMessage({
                text: extractErrorMessage(err, `Failed to remove ${friendToRemove.name}. Please try again.`),
                type: 'error'
            });
        } finally {
            setIsRemovingFriend(false);
            setActionLoadingId(null);
            setTimeout(() => setFeedbackMessage(null), 4000);
        }
    };

    const renderSearchIndicator = () => {
        if (isSearching) {
            return <Loader2 className="w-4 h-4 text-[#5b4fff] animate-spin absolute right-4 top-1/2 -translate-y-1/2" />;
        }
        if (searchQuery) {
            return (
                <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-0.5"
                    title="Clear search"
                >
                    <X className="w-4 h-4" />
                </button>
            );
        }
        return null;
    };

    const renderUserSearchAction = (searchUser: SocialSearchStudentDTO) => {
        if (searchUser.friendshipStatus === 'ACCEPTED') {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1">
                    <Check className="w-3 h-3 mr-1" /> Friends
                </Badge>
            );
        }
        if (searchUser.friendshipStatus === 'PENDING_OUTGOING') {
            return (
                <Badge variant="secondary" className="text-[10px] font-bold px-2.5 py-1">
                    <Send className="w-3 h-3 mr-1 text-zinc-400" /> Pending
                </Badge>
            );
        }
        if (searchUser.friendshipStatus === 'PENDING_INCOMING') {
            return (
                <Button
                    size="sm"
                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs px-3"
                    onClick={() => searchUser.friendshipId && handleAccept(searchUser.friendshipId)}
                    disabled={actionLoadingId === searchUser.friendshipId}
                >
                    <Check className="w-3 h-3 mr-1" /> Accept Request
                </Button>
            );
        }
        return (
            <Button
                size="sm"
                className="h-8 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl shadow-xs px-3 cursor-pointer"
                onClick={() => handleSendRequest(searchUser.id)}
                disabled={actionLoadingId === searchUser.id}
            >
                {actionLoadingId === searchUser.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <>
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Friend
                    </>
                )}
            </Button>
        );
    };

    const renderFriendStatusBadge = (friend: FriendDTO) => {
        if (friend.isBusy) {
            return (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>In Duel</span>
                </span>
            );
        }
        if (friend.isOnline) {
            return (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center text-[10px] text-zinc-400 font-medium shrink-0 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                Offline
            </span>
        );
    };

    const renderFriendHandle = (friend: FriendDTO) => {
        const isVerified = Boolean(friend.leetcodeUsername || friend.codeforcesHandle);
        return (
            <div className="flex items-center gap-1.5">
                {isVerified && (
                    <span title="Verified Coding Platform Sync">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </span>
                )}
                {friend.leetcodeUsername ? (
                    <a
                        href={`https://leetcode.com/${friend.leetcodeUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#ffa116] transition-colors flex items-center gap-0.5 truncate font-medium"
                    >
                        <span>LC: @{friend.leetcodeUsername}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </a>
                ) : friend.codeforcesHandle ? (
                    <a
                        href={`https://codeforces.com/profile/${friend.codeforcesHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors flex items-center gap-0.5 truncate font-medium"
                    >
                        <span>CF: @{friend.codeforcesHandle}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </a>
                ) : (
                    <span className="font-medium text-zinc-400">@{friend.email?.split('@')[0] || 'coder'}</span>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                <p className="text-xs font-bold text-zinc-500">Loading your friends network...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Feedback Notification Banner */}
            {feedbackMessage && (
                <div
                    className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
                        feedbackMessage.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        {feedbackMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <X className="w-4 h-4 text-rose-500 shrink-0" />}
                        {feedbackMessage.text}
                    </span>
                    <button type="button" onClick={() => setFeedbackMessage(null)} className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Find Friends Search Toolbar */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#0c0c0e]/85 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff]">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                                Discover & Connect Peers
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Search coders across campus by full name, campus email, LeetCode handle, or Codeforces handle.
                            </p>
                        </div>
                    </div>

                    {outgoingRequests.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 self-start sm:self-auto shadow-2xs">
                            <Send className="w-3.5 h-3.5 text-[#5b4fff]" />
                            <span><strong>{outgoingRequests.length}</strong> request{outgoingRequests.length > 1 ? 's' : ''} sent</span>
                        </span>
                    )}
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search peers by name, handle, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 h-10 text-xs rounded-xl shadow-2xs focus-visible:ring-[#5b4fff]/30 transition-all"
                    />
                    {renderSearchIndicator()}
                </div>

                {/* Live Search Results Dropdown Overlay */}
                {searchResults.length > 0 && (
                    <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#151518] max-h-80 overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                        {searchResults.map((user) => (
                            <div key={user.id} className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                            {user.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.name}</p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                                            <span>@{user.leetcodeUsername || user.codeforcesHandle || 'coder'}</span>
                                            <span>·</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{user.totalSolved} solved</span>
                                            {user.currentContestRating ? (
                                                <>
                                                    <span>·</span>
                                                    <span>Rating: {Math.round(user.currentContestRating)}</span>
                                                </>
                                            ) : null}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {renderUserSearchAction(user)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Incoming Friend Requests */}
            {incomingRequests.length > 0 && (
                <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/40 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                            Incoming Friend Requests ({incomingRequests.length})
                        </h4>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                            Action Required
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {incomingRequests.map((req) => (
                            <div
                                key={req.id}
                                className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-amber-200 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-11 h-11 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs">
                                        <AvatarImage src={req.requesterAvatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-bold">
                                            {req.requesterName.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">{req.requesterName}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">@{req.requesterHandle || 'coder'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        className="h-8.5 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs gap-1.5"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={actionLoadingId === req.id}
                                    >
                                        <Check className="w-3.5 h-3.5" /> Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8.5 px-3 text-xs font-semibold text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 rounded-xl cursor-pointer border-zinc-200 dark:border-zinc-700"
                                        onClick={() => handleReject(req.id)}
                                        disabled={actionLoadingId === req.id}
                                    >
                                        <X className="w-3.5 h-3.5" /> Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Coding Friends Grid Section with Filter Toolbar */}
            <div className="space-y-4">
                {/* Friends Section Header & Filtering Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>Friends Network</span>
                            <span className="text-xs font-bold text-zinc-400">({friends.length})</span>
                        </h3>
                        {onlineCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {onlineCount} Live Now
                            </span>
                        )}
                    </div>

                    {/* Filter Pills, Search, and Sort */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Inline Friend Filter Search */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Filter list..."
                                value={friendSearchQuery}
                                onChange={(e) => setFriendSearchQuery(e.target.value)}
                                className="pl-7 pr-2.5 h-7.5 w-28 sm:w-36 text-xs bg-zinc-100 dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 rounded-xl"
                            />
                        </div>

                        {/* Quick Status Filter Tabs */}
                        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                            <button
                                type="button"
                                onClick={() => setFriendsFilter('ALL')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                    friendsFilter === 'ALL'
                                        ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                All ({friends.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFriendsFilter('ONLINE')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                    friendsFilter === 'ONLINE'
                                        ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Live ({onlineCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFriendsFilter('IN_DUEL')}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                    friendsFilter === 'IN_DUEL'
                                        ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                In Duel ({inDuelCount})
                            </button>
                        </div>

                        {/* Sort Selector */}
                        <Select
                            value={friendsSort}
                            onValueChange={(val) => setFriendsSort(val as FriendSortType)}
                        >
                            <SelectTrigger
                                size="sm"
                                className="h-8 px-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors gap-1.5 shadow-none focus-visible:ring-1 focus-visible:ring-[#5b4fff] cursor-pointer"
                                aria-label="Sort friends by"
                            >
                                <div className="flex items-center gap-1.5">
                                    <ArrowsDownUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <SelectValue placeholder="Sort friends" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#141417] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-xl p-1 min-w-35 z-50">
                                <SelectItem value="CSCORE" className="text-xs font-semibold rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white">
                                    C-Score
                                </SelectItem>
                                <SelectItem value="SOLVED" className="text-xs font-semibold rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white">
                                    Total Solved
                                </SelectItem>
                                <SelectItem value="RATING" className="text-xs font-semibold rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white">
                                    Contest Rating
                                </SelectItem>
                                <SelectItem value="STREAK" className="text-xs font-semibold rounded-lg cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white">
                                    Streak
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {friends.length === 0 ? (
                    <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mx-auto shadow-inner">
                            <Users className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 max-w-md mx-auto">
                            <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                                No Coding Friends Added Yet
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Connect with your classmates, peers, and fellow algorithm enthusiasts using the search box above to track mutual milestones and battle in 1v1 duels!
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                const inputEl = document.querySelector('input[placeholder*="Search peers"]') as HTMLInputElement;
                                inputEl?.focus();
                            }}
                            className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold h-9.5 px-4 shadow-sm cursor-pointer"
                        >
                            <Search className="w-3.5 h-3.5 mr-1.5" /> Search & Add Peers
                        </Button>
                    </div>
                ) : displayedFriends.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-white dark:bg-[#111114]/90 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                        No friends match the selected filter. Try clearing the filter or search query.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {displayedFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#111114]/90 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 hover:border-[#5b4fff]/50 hover:shadow-xl hover:shadow-[#5b4fff]/5 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group"
                            >
                                {/* Friend Card Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="relative shrink-0">
                                            <Avatar className="w-13 h-13 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm ring-2 ring-[#5b4fff]/10">
                                                <AvatarImage src={friend.avatarUrl} className="object-cover" />
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm">
                                                    {friend.name.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Discord-style Live Online Indicator */}
                                            <span
                                                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111114] z-10 transition-all ${
                                                    friend.isBusy
                                                        ? 'bg-amber-500 ring-2 ring-amber-500/30'
                                                        : friend.isOnline
                                                        ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                                                        : 'bg-zinc-400 dark:bg-zinc-600'
                                                }`}
                                                title={friend.isBusy ? 'In Duel' : friend.isOnline ? 'Online / Live Now' : 'Offline'}
                                            >
                                                {friend.isOnline && !friend.isBusy && (
                                                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                                                )}
                                            </span>
                                            {friend.streak > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-0.5 rounded-full shadow-xs z-10">
                                                    <StreakFlame className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewDashboard(friend.id)}
                                                    className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-[#5b4fff] transition-colors text-left block cursor-pointer"
                                                >
                                                    {friend.name}
                                                </button>
                                                {renderFriendStatusBadge(friend)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                                                {renderFriendHandle(friend)}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl cursor-pointer shrink-0"
                                        onClick={() => setFriendToRemove(friend)}
                                        title={`Remove ${friend.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* C-Score & Core Metrics Grid */}
                                <div className="rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 p-3 space-y-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                                        <div className="flex items-center gap-1.5">
                                            <ChartLineUp className="w-3.5 h-3.5 text-[#5b4fff]" />
                                            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">C-Score</span>
                                            <span className="text-zinc-900 dark:text-zinc-100 font-bold text-sm ml-1">{friend.cScore ?? 500}</span>
                                        </div>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCScoreTier(friend.cScore).badgeClass}`}>
                                            {getCScoreTier(friend.cScore).tier}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1 text-center">
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Solved</p>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{friend.totalSolved}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Rating</p>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                                                {Math.round(friend.currentContestRating || 0) || 'Unrated'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 dark:text-zinc-500">Streak</p>
                                            <p className="text-xs font-bold text-amber-500 mt-0.5">{friend.streak}d</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Head-to-Head & Actions Row */}
                                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                                    <span className="flex items-center gap-1 font-medium">
                                        <Swords className="w-3.5 h-3.5 text-[#5b4fff]" />
                                        <span>vs You:</span>
                                    </span>
                                    <span className="font-semibold">
                                        <span className="text-emerald-600 dark:text-emerald-400">{friend.pvpWins || 0}W</span>
                                        <span className="text-zinc-400 mx-0.5">-</span>
                                        <span className="text-rose-600 dark:text-rose-400">{friend.pvpLosses || 0}L</span>
                                        <span className="text-zinc-400 mx-1">·</span>
                                        <span className="text-zinc-600 dark:text-zinc-300">{friend.pvpRating ?? 1200} Elo</span>
                                    </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer gap-1.5 shadow-xs"
                                        onClick={() => onViewDashboard(friend.id)}
                                    >
                                        <Eye className="w-3.5 h-3.5 text-zinc-500" /> View Profile
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={!friend.isOnline || friend.isBusy}
                                        title={getDuelButtonTitle(friend)}
                                        className="h-9 text-xs font-bold rounded-xl bg-[#5b4fff] hover:bg-[#4d40ef] text-white cursor-pointer gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#5b4fff]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => onChallengePvp(friend.id, friend.name)}
                                    >
                                        <Swords className="w-3.5 h-3.5" />
                                        <span>{friend.isBusy ? 'In Duel' : 'PVP Duel'}</span>
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Companion "Grow Your Network" Card */}
                        {friends.length < 3 && (
                            <div className="p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/90 hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 transition-colors flex flex-col justify-between items-center text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <div className="w-12 h-12 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mt-2 shadow-inner">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                        Grow Your Coding Circle
                                    </h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                                        Add more peers to compete on the leaderboard, view detailed problem overlap, and duel in speed challenges.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                                        inputEl?.focus();
                                    }}
                                    className="h-9 px-4 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:border-[#5b4fff] cursor-pointer gap-1.5"
                                >
                                    <Search className="w-3.5 h-3.5 text-[#5b4fff]" /> Find Peers
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Frontend Confirmation Card for Removing Friend */}
            <Dialog open={!!friendToRemove} onOpenChange={(open) => !open && !isRemovingFriend && setFriendToRemove(null)}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3 ring-4 ring-rose-500/10">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                            Remove from Friends List?
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
                            Are you sure you want to remove this peer? You will no longer see each other on your private friends leaderboard or in your social activity feed.
                        </DialogDescription>
                    </DialogHeader>

                    {friendToRemove && (
                        <div className="my-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                    <AvatarImage src={friendToRemove.avatarUrl} />
                                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-[#5b4fff] font-bold text-xs">
                                        {friendToRemove.name?.substring(0, 2).toUpperCase() || 'FR'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                        {friendToRemove.name}
                                    </p>
                                    <p className="text-xs text-zinc-400 truncate">
                                        @{friendToRemove.leetcodeUsername || friendToRemove.codeforcesHandle || 'student'}
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <span className="text-xs font-bold text-[#5b4fff] dark:text-[#968fff]">
                                    {friendToRemove.cScore ?? 500} C-Score
                                </span>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                    {friendToRemove.totalSolved || 0} solved
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFriendToRemove(null)}
                            disabled={isRemovingFriend}
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-10 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmRemove}
                            disabled={isRemovingFriend}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold h-10 gap-1.5 shadow-xs cursor-pointer"
                        >
                            {isRemovingFriend ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                    <span>Removing...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-1.5" />
                                    <span>Remove Friend</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
