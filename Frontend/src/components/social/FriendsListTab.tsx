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
    UsersIcon as Users
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { SocialService } from '../../services/endpoints';
import type { FriendDTO, FriendRequestDTO, SocialSearchStudentDTO } from '@/types';

interface FriendsListTabProps {
    onViewDashboard: (friendId: string) => void;
    onChallengePvp: (friendId: string, friendName: string) => void;
}

export function FriendsListTab({ onViewDashboard, onChallengePvp }: FriendsListTabProps) {
    const [friends, setFriends] = useState<FriendDTO[]>([]);
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
            setFriends(res.data.friends || []);
            setIncomingRequests(res.data.pendingIncoming || []);
            setOutgoingRequests(res.data.pendingOutgoing || []);
        } catch (err: unknown) {
            console.error('Failed to load friends:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadFriendsData();
    }, [loadFriendsData]);

    // Handle search query
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await SocialService.searchStudents(searchQuery);
                setSearchResults(res.data || []);
            } catch (err) {
                console.error('Failed to search students:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSendRequest = async (targetId: string) => {
        setActionLoadingId(targetId);
        try {
            await SocialService.sendFriendRequest(targetId);
            setFeedbackMessage({ text: 'Friend request sent successfully!', type: 'success' });
            // Update search item status locally
            setSearchResults(prev =>
                prev.map(s => (s.id === targetId ? { ...s, friendshipStatus: 'PENDING_OUTGOING' } : s))
            );
            void loadFriendsData();
        } catch (err: any) {
            setFeedbackMessage({
                text: err.response?.data?.message || 'Failed to send friend request.',
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
        } catch (err: any) {
            setFeedbackMessage({
                text: err.response?.data?.message || 'Failed to accept request.',
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
        if (!window.confirm(`Are you sure you want to remove ${name} from your friends?`)) return;
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                <p className="text-xs font-semibold text-zinc-500">Loading your friends network...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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

            {/* Find Friends Search Bar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-sm relative overflow-hidden space-y-4">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#5b4fff]/50 to-transparent pointer-events-none" />

                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff]">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                            Discover & Add Coding Friends
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Connect with fellow engineers to share non-spoiler hints, compare solved questions, and compete in 1v1 duels
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search peers by name, email, LeetCode username, or Codeforces handle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10.5 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 h-10.5 text-xs rounded-2xl"
                    />
                    {isSearching && (
                        <Loader2 className="w-4 h-4 text-zinc-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                </div>

                {/* Live Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 max-h-72 overflow-y-auto shadow-lg">
                        {searchResults.map((user) => (
                            <div key={user.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                            {user.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">
                                            @{user.leetcodeUsername || user.codeforcesHandle || 'coder'} · {user.totalSolved} solved
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {user.friendshipStatus === 'ACCEPTED' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                            Friends
                                        </Badge>
                                    ) : user.friendshipStatus === 'PENDING_OUTGOING' ? (
                                        <Badge variant="secondary" className="text-[10px] font-bold">
                                            Request Sent
                                        </Badge>
                                    ) : user.friendshipStatus === 'PENDING_INCOMING' ? (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                                            onClick={() => user.friendshipId && handleAccept(user.friendshipId)}
                                            disabled={actionLoadingId === user.friendshipId}
                                        >
                                            Accept Request
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl gap-1.5 shadow-xs"
                                            onClick={() => handleSendRequest(user.id)}
                                            disabled={actionLoadingId === user.id}
                                        >
                                            {actionLoadingId === user.id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <UserPlus className="w-3.5 h-3.5" />
                                            )}
                                            Add Friend
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Incoming Friend Requests Banner */}
            {incomingRequests.length > 0 && (
                <div className="p-5 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3.5">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                            Friend Requests Received ({incomingRequests.length})
                        </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {incomingRequests.map((req) => (
                            <div
                                key={req.id}
                                className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 flex items-center justify-between gap-3 shadow-xs"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarImage src={req.requesterAvatarUrl} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                                            {req.requesterName.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                        <p className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">{req.requesterName}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">@{req.requesterHandle || 'coder'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-xs"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={actionLoadingId === req.id}
                                        title="Accept Friend"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8 text-zinc-500 hover:text-rose-600 rounded-xl cursor-pointer border-zinc-200 dark:border-zinc-700"
                                        onClick={() => handleReject(req.id)}
                                        disabled={actionLoadingId === req.id}
                                        title="Decline"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Outgoing Requests */}
            {outgoingRequests.length > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
                    <span>
                        You have <strong className="text-zinc-900 dark:text-white font-bold">{outgoingRequests.length}</strong> pending outgoing friend request(s).
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">Waiting for response</span>
                </div>
            )}

            {/* Friends Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#5b4fff]" /> My Coding Friends ({friends.length})
                    </h3>
                    <span className="text-xs text-zinc-400">Compete & Learn Together</span>
                </div>

                {friends.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mx-auto">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No friends added yet</h4>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                Search for peers by username above to add them as friends, launch 1v1 PVP duels, and view their dashboard!
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="p-5 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 hover:border-[#5b4fff]/40 transition-all shadow-xs flex flex-col justify-between space-y-3.5 group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <Avatar className="w-12 h-12 border-2 border-zinc-200 dark:border-zinc-700 shadow-sm">
                                            <AvatarImage src={friend.avatarUrl} />
                                            <AvatarFallback className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 text-[#5b4fff] font-bold text-sm">
                                                {friend.name.substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white truncate group-hover:text-[#5b4fff] transition-colors">
                                                {friend.name}
                                            </h4>
                                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                                                @{friend.leetcodeUsername || friend.codeforcesHandle || 'coder'}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-400 hover:text-rose-600 rounded-xl cursor-pointer"
                                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                        title="Remove Friend"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 text-center">
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Solved
                                        </p>
                                        <p className="text-xs font-black text-zinc-900 dark:text-white mt-0.5">{friend.totalSolved}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
                                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rating
                                        </p>
                                        <p className="text-xs font-black text-zinc-900 dark:text-white mt-0.5">
                                            {Math.round(friend.currentContestRating || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-semibold flex items-center justify-center gap-1">
                                            <Flame className="w-3.5 h-3.5 text-rose-500" /> Streak
                                        </p>
                                        <p className="text-xs font-black text-zinc-900 dark:text-white mt-0.5">{friend.streak}d</p>
                                    </div>
                                </div>

                                {/* Actions row */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer gap-1.5"
                                        onClick={() => onViewDashboard(friend.id)}
                                    >
                                        <Eye className="w-3.5 h-3.5 text-zinc-500" /> View Profile
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-9 text-xs font-bold rounded-xl bg-[#5b4fff] hover:bg-[#4d40ef] text-white cursor-pointer gap-1.5 shadow-xs hover:shadow-[#5b4fff]/20 transition-all"
                                        onClick={() => onChallengePvp(friend.id, friend.name)}
                                    >
                                        <Swords className="w-3.5 h-3.5" /> PVP Duel
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
