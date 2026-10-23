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
            setFeedbackMessage({ text: 'Friend request sent!', type: 'success' });
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
            setFeedbackMessage({ text: `Removed ${name} from friends.`, type: 'success' });
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
                <p className="text-xs font-medium text-zinc-500">Loading your friends list...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {feedbackMessage && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                        feedbackMessage.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                    }`}
                >
                    <span>{feedbackMessage.text}</span>
                    <button type="button" onClick={() => setFeedbackMessage(null)} className="cursor-pointer text-zinc-400 hover:text-zinc-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Find Friends Search Bar */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="w-5 h-5 text-[#5b4fff]" />
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Discover & Add Coding Friends</h3>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search peers by name, email, LeetCode username, or Codeforces handle..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-10 text-xs rounded-xl"
                    />
                    {isSearching && (
                        <Loader2 className="w-4 h-4 text-zinc-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                    )}
                </div>

                {/* Live Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 max-h-72 overflow-y-auto">
                        {searchResults.map((user) => (
                            <div key={user.id} className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                            {user.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-[11px] text-zinc-500 truncate">
                                            @{user.leetcodeUsername || user.codeforcesHandle || 'coder'} · {user.totalSolved} solved
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {user.friendshipStatus === 'ACCEPTED' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                                            Friends
                                        </Badge>
                                    ) : user.friendshipStatus === 'PENDING_OUTGOING' ? (
                                        <Badge variant="secondary" className="text-[11px]">
                                            Request Sent
                                        </Badge>
                                    ) : user.friendshipStatus === 'PENDING_INCOMING' ? (
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                                            onClick={() => user.friendshipId && handleAccept(user.friendshipId)}
                                            disabled={actionLoadingId === user.friendshipId}
                                        >
                                            Accept Request
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-lg gap-1"
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
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                            Friend Requests Received ({incomingRequests.length})
                        </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {incomingRequests.map((req) => (
                            <div
                                key={req.id}
                                className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-200/80 dark:border-indigo-900/40 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={req.requesterAvatarUrl} />
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                                            {req.requesterName.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{req.requesterName}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">@{req.requesterHandle || 'coder'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                        size="icon"
                                        className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                                        onClick={() => handleAccept(req.id)}
                                        disabled={actionLoadingId === req.id}
                                        title="Accept"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7 text-zinc-500 hover:text-rose-600 rounded-lg cursor-pointer"
                                        onClick={() => handleReject(req.id)}
                                        disabled={actionLoadingId === req.id}
                                        title="Decline"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Outgoing Requests */}
            {outgoingRequests.length > 0 && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
                    <span>
                        You have <strong className="text-zinc-700 dark:text-zinc-300">{outgoingRequests.length}</strong> pending outgoing friend request(s).
                    </span>
                    <span className="text-[11px] text-zinc-400">Waiting for response</span>
                </div>
            )}

            {/* Friends Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#5b4fff]" /> My Coding Friends ({friends.length})
                    </h3>
                    <span className="text-xs text-zinc-500">Compete & Learn Together</span>
                </div>

                {friends.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mx-auto">
                            <Users className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No friends added yet</h4>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                            Search for classmates or fellow problem solvers above to add them as friends, compete in 1v1 PVP duels, and view their dashboard!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 hover:border-[#5b4fff]/40 transition-all shadow-xs flex flex-col justify-between space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar className="w-11 h-11 border border-zinc-200 dark:border-zinc-700">
                                            <AvatarImage src={friend.avatarUrl} />
                                            <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] font-bold text-sm">
                                                {friend.name.substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                {friend.name}
                                            </h4>
                                            <p className="text-xs text-zinc-500 truncate">
                                                @{friend.leetcodeUsername || friend.codeforcesHandle || 'coder'}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                        title="Remove Friend"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 text-center">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-medium flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Solved
                                        </p>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">{friend.totalSolved}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-medium flex items-center justify-center gap-1">
                                            <Trophy className="w-3 h-3 text-amber-500" /> Rating
                                        </p>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                                            {Math.round(friend.currentContestRating || 0)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-medium flex items-center justify-center gap-1">
                                            <Flame className="w-3 h-3 text-rose-500" /> Streak
                                        </p>
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">{friend.streak}d</p>
                                    </div>
                                </div>

                                {/* Actions row */}
                                <div className="flex items-center gap-2 pt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 text-xs font-semibold rounded-xl border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer gap-1.5"
                                        onClick={() => onViewDashboard(friend.id)}
                                    >
                                        <Eye className="w-3.5 h-3.5 text-zinc-500" /> View Dashboard
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 h-8 text-xs font-semibold rounded-xl bg-[#5b4fff] hover:bg-[#4d40ef] text-white cursor-pointer gap-1.5"
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
