import { useState, useEffect, useCallback } from 'react';
import {
    MagnifyingGlassIcon as Search,
    UserPlusIcon as UserPlus,
    CheckIcon as Check,
    XIcon as X,
    TrashIcon as Trash2,
    EyeIcon as Eye,
    SwordIcon as Swords,
    SpinnerIcon as Loader2,
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    UsersIcon as Users,
    ArrowSquareOutIcon as ExternalLink,
    PaperPlaneRightIcon as Send
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { StreakFlame } from '../ui/StreakFlame';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
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

export function FriendsListTab({ onViewDashboard, onChallengePvp }: Readonly<FriendsListTabProps>) {
    const { user } = useAuth();
    const [friends, setFriends] = useState<FriendDTO[]>([]);

    const onlineCount = friends.filter(f => Boolean(f.isOnline)).length;
    const sortedFriends = [...friends].sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return (b.totalSolved || 0) - (a.totalSolved || 0);
    });
    const [incomingRequests, setIncomingRequests] = useState<FriendRequestDTO[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SocialSearchStudentDTO[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
            setFeedbackMessage({ text: 'Friend request accepted!', type: 'success' });
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
        } catch (err: any) {
            console.error('Failed to reject request:', err);
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRemoveFriend = async (friendId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to remove ${name} from your friends list?`)) return;
        setActionLoadingId(friendId);
        try {
            await SocialService.removeFriend(friendId);
            setFeedbackMessage({ text: `Removed ${name} from friends list.`, type: 'success' });
            void loadFriendsData();
        } catch (err: any) {
            console.error('Failed to remove friend:', err);
        } finally {
            setActionLoadingId(null);
            setTimeout(() => setFeedbackMessage(null), 4000);
        }
    };


    const renderSearchIndicator = () => {
        if (isSearching) {
            return <Loader2 className="w-4 h-4 text-zinc-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />;
        }
        if (searchQuery) {
            return (
                <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 absolute right-4 top-1/2 -translate-y-1/2"
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
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    Friends
                </Badge>
            );
        }
        if (searchUser.friendshipStatus === 'PENDING_OUTGOING') {
            return (
                <Badge variant="secondary" className="text-[10px] font-bold">
                    Pending
                </Badge>
            );
        }
        if (searchUser.friendshipStatus === 'PENDING_INCOMING') {
            return (
                <Button
                    size="sm"
                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                    onClick={() => searchUser.friendshipId && handleAccept(searchUser.friendshipId)}
                    disabled={actionLoadingId === searchUser.friendshipId}
                >
                    Accept Request
                </Button>
            );
        }
        return (
            <Button
                size="sm"
                className="h-8 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl shadow-xs"
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
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>In Duel</span>
                </span>
            );
        }
        if (friend.isOnline) {
            return (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-full shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                </span>
            );
        }
        return (
            <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                Offline
            </span>
        );
    };

    const renderFriendHandle = (friend: FriendDTO) => {
        if (friend.leetcodeUsername) {
            return (
                <a
                    href={`https://leetcode.com/${friend.leetcodeUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#ffa116] transition-colors flex items-center gap-0.5"
                >
                    <span>LC: @{friend.leetcodeUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            );
        }
        if (friend.codeforcesHandle) {
            return (
                <a
                    href={`https://codeforces.com/profile/${friend.codeforcesHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-400 transition-colors flex items-center gap-0.5"
                >
                    <span>CF: @{friend.codeforcesHandle}</span>
                    <ExternalLink className="w-3 h-3" />
                </a>
            );
        }
        return <span>@{friend.email?.split('@')[0] || 'coder'}</span>;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-9 h-9 animate-spin text-[#5b4fff]" />
                <p className="text-xs font-semibold text-zinc-500">Loading your friends network...</p>
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

            {/* Find Friends Search Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-sm relative overflow-hidden space-y-4">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-[#5b4fff]/50 to-transparent pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff]">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                Discover & Add Coding Peers
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Search peers by full name, campus email, LeetCode handle, or Codeforces handle.
                            </p>
                        </div>
                    </div>

                    {outgoingRequests.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/60 self-start sm:self-auto">
                            <Send className="w-3.5 h-3.5 text-zinc-400" />
                            <span><strong>{outgoingRequests.length}</strong> request{outgoingRequests.length > 1 ? 's' : ''} pending response</span>
                        </span>
                    )}
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Type name, email, LeetCode username, or Codeforces handle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10.5 pr-10 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 h-11 text-xs rounded-2xl shadow-inner focus-visible:ring-[#5b4fff]/30"
                    />
                    {renderSearchIndicator()}
                </div>

                {/* Live Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-[#151518] max-h-72 overflow-y-auto shadow-xl">
                        {searchResults.map((user) => (
                            <div key={user.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                            {user.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1.5 mt-0.5">
                                            <span>@{user.leetcodeUsername || user.codeforcesHandle || 'coder'}</span>
                                            <span>·</span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{user.totalSolved} solved</span>
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
                <div className="p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/90 dark:border-amber-800/40 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            Incoming Friend Requests ({incomingRequests.length})
                        </h4>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Action Required</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {incomingRequests.map((req) => (
                            <div
                                key={req.id}
                                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-10 h-10 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                        <AvatarImage src={req.requesterAvatarUrl} />
                                        <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-bold">
                                            {req.requesterName.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">{req.requesterName}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">@{req.requesterHandle || 'coder'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs gap-1.5"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={actionLoadingId === req.id}
                                    >
                                        <Check className="w-3.5 h-3.5" /> Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 text-xs font-semibold text-zinc-600 hover:text-rose-600 rounded-xl cursor-pointer border-zinc-200 dark:border-zinc-700"
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

            {/* Coding Friends Grid Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#5b4fff]" /> My Coding Friends ({friends.length})
                        </h3>
                        {onlineCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {onlineCount} Live Now
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">Compete, Compare & Duel</span>
                </div>

                {friends.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Coding Friends Added Yet</p>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                Search for your classmates or coding partners using the search box above to compare solutions and duel in real time.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {sortedFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 hover:border-[#5b4fff]/50 hover:shadow-lg hover:shadow-[#5b4fff]/5 transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group"
                            >
                                {/* Gradient top border accent */}
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-[#5b4fff]/30 to-transparent group-hover:via-[#5b4fff]/70 transition-colors" />

                                {/* Friend Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="relative shrink-0">
                                            <Avatar className="w-13 h-13 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm ring-2 ring-[#5b4fff]/10">
                                                <AvatarImage src={friend.avatarUrl} className="object-cover" />
                                                <AvatarFallback className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 text-[#5b4fff] font-bold text-sm">
                                                    {friend.name.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Discord-style Live Online Indicator */}
                                            <span
                                                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#111111] z-10 transition-all ${
                                                    friend.isOnline
                                                        ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                                                        : 'bg-zinc-400/80 dark:bg-zinc-600'
                                                }`}
                                                title={friend.isOnline ? 'Online / Live Now' : 'Offline'}
                                            >
                                                {friend.isOnline && (
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
                                                    className="text-sm font-extrabold text-zinc-900 dark:text-white truncate group-hover:text-[#5b4fff] transition-colors text-left block cursor-pointer"
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
                                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                        title="Remove Friend"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Stats metric pill box */}
                                <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-center">
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Solved
                                        </p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">{friend.totalSolved}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
                                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rating
                                        </p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
                                            {Math.round(friend.currentContestRating || 0) || 'Unrated'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
                                            <Flame className="w-3.5 h-3.5 text-rose-500" /> Streak
                                        </p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">{friend.streak}d</p>
                                    </div>
                                </div>

                                {/* Head-to-Head duel record pill */}
                                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-100/60 dark:bg-zinc-800/40 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <span className="flex items-center gap-1 font-medium">
                                        <Swords className="w-3.5 h-3.5 text-[#5b4fff]" /> Head-to-Head
                                    </span>
                                    <span className="font-bold">
                                        <span className="text-emerald-600 dark:text-emerald-400">{friend.pvpWins || 0}W</span>
                                        <span className="text-zinc-400 mx-1">-</span>
                                        <span className="text-rose-600 dark:text-rose-400">{friend.pvpLosses || 0}L</span>
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

                        {/* Companion "Invite / Add More Friends" Card (Fills out grid balance when friends count is low) */}
                        {friends.length < 3 && (
                            <div className="p-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/90 hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 transition-colors flex flex-col justify-between items-center text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <div className="w-12 h-12 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mt-2">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                        Grow Your Coding Circle
                                    </h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
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
        </div>
    );
}
