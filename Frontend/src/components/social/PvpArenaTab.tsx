import { useState, useEffect, useCallback } from 'react';
import {
    SwordIcon as Swords,
    TrophyIcon as Trophy,
    ClockIcon as Clock,
    CheckCircleIcon as CheckCircle2,
    ArrowSquareOutIcon as ExternalLink,
    PlayIcon as Play,
    XIcon as X,
    CheckIcon as Check,
    SpinnerIcon as Loader2,
    FlameIcon as Flame
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import type { FriendDTO, PvpMatchDTO, CreatePvpMatchRequest } from '@/types';

interface PvpArenaTabProps {
    initialChallengerTarget?: { friendId: string; friendName: string } | null;
    onClearInitialTarget?: () => void;
}

export function PvpArenaTab({ initialChallengerTarget, onClearInitialTarget }: PvpArenaTabProps) {
    const { user } = useAuth();
    const [matches, setMatches] = useState<PvpMatchDTO[]>([]);
    const [friends, setFriends] = useState<FriendDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create Match Dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedFriendId, setSelectedFriendId] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('Dynamic Programming');
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [customTitle, setCustomTitle] = useState('');
    const [customLink, setCustomLink] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Verification state
    const [verifyingMatchId, setVerifyingMatchId] = useState<string | null>(null);
    const [submissionUrlInput, setSubmissionUrlInput] = useState<{ [key: string]: string }>({});
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Auto-open challenge modal if passed via prop
    useEffect(() => {
        if (initialChallengerTarget) {
            setSelectedFriendId(initialChallengerTarget.friendId);
            setCreateDialogOpen(true);
            onClearInitialTarget?.();
        }
    }, [initialChallengerTarget, onClearInitialTarget]);

    const loadData = useCallback(async () => {
        try {
            const [matchesRes, friendsRes] = await Promise.all([
                SocialService.getPvpMatches(),
                SocialService.getFriends()
            ]);
            setMatches(matchesRes.data || []);
            setFriends(friendsRes.data.friends || []);
        } catch (err) {
            console.error('Failed to load PVP data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
        // Periodic background poll for match updates every 10 seconds during active duels
        const interval = setInterval(() => {
            void loadData();
        }, 10000);
        return () => clearInterval(interval);
    }, [loadData]);

    // Live 1-second countdown ticker for active matches
    useEffect(() => {
        const timer = setInterval(() => {
            setMatches(prevMatches =>
                prevMatches.map(m => {
                    if (m.status === 'IN_PROGRESS' && m.remainingSeconds !== undefined && m.remainingSeconds > 0) {
                        return { ...m, remainingSeconds: m.remainingSeconds - 1 };
                    }
                    return m;
                })
            );
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleCreateDuel = async () => {
        if (!selectedFriendId) {
            setFeedback({ text: 'Please select a friend to duel.', type: 'error' });
            return;
        }

        setIsCreating(true);
        try {
            const req: CreatePvpMatchRequest = {
                opponentId: selectedFriendId,
                problemTopic: selectedTopic,
                problemDifficulty: selectedDifficulty,
                durationMinutes,
                customProblemTitle: customTitle.trim() || undefined,
                customProblemLink: customLink.trim() || undefined
            };

            await SocialService.createPvpChallenge(req);
            setFeedback({ text: 'Challenge sent! Waiting for your friend to accept.', type: 'success' });
            setCreateDialogOpen(false);
            setCustomTitle('');
            setCustomLink('');
            void loadData();
        } catch (err: any) {
            setFeedback({
                text: err.response?.data?.message || 'Failed to create challenge.',
                type: 'error'
            });
        } finally {
            setIsCreating(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    const handleAcceptMatch = async (matchId: string) => {
        try {
            await SocialService.acceptPvpMatch(matchId);
            setFeedback({ text: 'Duel started! Good luck!', type: 'success' });
            void loadData();
        } catch (err: any) {
            setFeedback({
                text: err.response?.data?.message || 'Failed to accept duel.',
                type: 'error'
            });
        }
    };

    const handleDeclineMatch = async (matchId: string) => {
        try {
            await SocialService.declinePvpMatch(matchId);
            void loadData();
        } catch (err: any) {
            console.error('Failed to decline match:', err);
        }
    };

    const handleVerifySubmission = async (matchId: string) => {
        setVerifyingMatchId(matchId);
        const subUrl = submissionUrlInput[matchId];
        try {
            const res = await SocialService.verifyPvpMatch(matchId, subUrl);
            const isWinner = res.data.winnerId === user?.id;
            if (isWinner) {
                setFeedback({ text: '🏆 Victory! You solved the duel problem first!', type: 'success' });
            } else if (res.data.status === 'COMPLETED') {
                setFeedback({ text: 'The match is completed.', type: 'success' });
            } else {
                setFeedback({
                    text: 'Solution not detected yet. Submit on LeetCode first or paste your submission link!',
                    type: 'error'
                });
            }
            void loadData();
        } catch (err: any) {
            setFeedback({
                text: err.response?.data?.message || 'Verification error.',
                type: 'error'
            });
        } finally {
            setVerifyingMatchId(null);
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    const formatSeconds = (sec?: number) => {
        if (sec === undefined || sec === null || sec <= 0) return '00:00';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const activeMatches = matches.filter(m => m.status === 'IN_PROGRESS' || m.status === 'INVITED');
    const pastMatches = matches.filter(m => m.status === 'COMPLETED' || m.status === 'DRAW' || m.status === 'DECLINED' || m.status === 'EXPIRED');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                <p className="text-xs font-medium text-zinc-500">Loading PVP Arena...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {feedback && (
                <div
                    className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                    }`}
                >
                    <span>{feedback.text}</span>
                    <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer text-zinc-400 hover:text-zinc-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* PVP Arena Header Banner */}
            <div className="p-6 rounded-3xl bg-linear-to-r from-[#5b4fff]/15 via-indigo-500/10 to-purple-500/15 border border-[#5b4fff]/20 dark:border-[#5b4fff]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#5b4fff] text-white">
                            <Swords className="w-5 h-5" />
                        </span>
                        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                            PVP Problem-Solving Arena
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl">
                        Challenge friends to 1v1 speed duels. Both get the same problem — the first one to solve and verify wins the duel!
                    </p>
                </div>

                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-5 h-10 shadow-md gap-2 shrink-0 cursor-pointer"
                >
                    <Play className="w-4 h-4" /> Start New Duel
                </Button>
            </div>

            {/* Active Duels Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500" /> Active Duels & Invites ({activeMatches.length})
                    </h3>
                </div>

                {activeMatches.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No active duels right now</p>
                        <p className="text-xs text-zinc-500">Pick a friend and start a duel to test your speed and problem-solving skills!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activeMatches.map((match) => {
                            const isChallenger = match.challengerId === user?.id;
                            const opponentName = isChallenger ? match.opponentName : match.challengerName;
                            const isInvitedPending = match.status === 'INVITED';
                            const needsMyAcceptance = isInvitedPending && !isChallenger;

                            return (
                                <div
                                    key={match.id}
                                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4"
                                >
                                    {/* Match Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                className={
                                                    match.status === 'IN_PROGRESS'
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse'
                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                }
                                            >
                                                {match.status === 'IN_PROGRESS' ? '⚔️ IN PROGRESS' : '📨 INVITATION PENDING'}
                                            </Badge>
                                            <span className="text-xs font-semibold text-zinc-500">
                                                Topic: <strong className="text-zinc-800 dark:text-zinc-200">{match.problemTopic}</strong>
                                            </span>
                                        </div>

                                        {match.status === 'IN_PROGRESS' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-mono font-bold">
                                                <Clock className="w-4 h-4" />
                                                <span>Time Left: {formatSeconds(match.remainingSeconds)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Problem details */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                                                    {match.problemTitle}
                                                </h4>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-bold ${
                                                        match.problemDifficulty === 'Easy'
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : match.problemDifficulty === 'Medium'
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-rose-600 dark:text-rose-400'
                                                    }`}
                                                >
                                                    {match.problemDifficulty}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-zinc-500">Duration: {match.durationMinutes} minutes</p>
                                        </div>

                                        <a
                                            href={match.problemLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-[#5b4fff] border border-zinc-200 dark:border-zinc-700 hover:border-[#5b4fff] shadow-2xs transition-colors shrink-0"
                                        >
                                            Open Problem <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    {/* Both players duel board */}
                                    <div className="grid grid-cols-2 gap-3 text-center">
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                                            <Avatar className="w-8 h-8 mx-auto">
                                                <AvatarImage src={match.challengerAvatarUrl} />
                                                <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                                    {match.challengerName.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {match.challengerName} {isChallenger && '(You)'}
                                            </p>
                                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                                {match.challengerSolved ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" /> Solving...
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                                            <Avatar className="w-8 h-8 mx-auto">
                                                <AvatarImage src={match.opponentAvatarUrl} />
                                                <AvatarFallback className="bg-purple-500/10 text-purple-600 text-xs font-bold">
                                                    {match.opponentName.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {match.opponentName} {!isChallenger && '(You)'}
                                            </p>
                                            <div className="inline-flex items-center gap-1 text-[11px] font-semibold">
                                                {match.opponentSolved ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Solved
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" /> Solving...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action row */}
                                    {needsMyAcceptance && (
                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                onClick={() => handleAcceptMatch(match.id)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer"
                                            >
                                                <Check className="w-4 h-4" /> Accept Duel Challenge
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeclineMatch(match.id)}
                                                className="flex-1 border-zinc-200 dark:border-zinc-700 text-zinc-600 rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" /> Decline
                                            </Button>
                                        </div>
                                    )}

                                    {match.status === 'IN_PROGRESS' && (
                                        <div className="pt-2 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Optional: Paste LeetCode submission link to verify instantly..."
                                                    value={submissionUrlInput[match.id] || ''}
                                                    onChange={(e) =>
                                                        setSubmissionUrlInput(prev => ({ ...prev, [match.id]: e.target.value }))
                                                    }
                                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                                                />
                                                <Button
                                                    onClick={() => handleVerifySubmission(match.id)}
                                                    disabled={verifyingMatchId === match.id}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4 h-9 gap-1.5 shrink-0 cursor-pointer shadow-xs"
                                                >
                                                    {verifyingMatchId === match.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    )}
                                                    Verify My Solution
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-zinc-400">
                                                💡 Tip: Submit on LeetCode first, then click Verify. The server auto-checks your recent submissions!
                                            </p>
                                        </div>
                                    )}

                                    {isInvitedPending && isChallenger && (
                                        <p className="text-xs text-zinc-400 text-center py-1">
                                            Waiting for {opponentName} to accept the duel challenge...
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Match History */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Duel Match History ({pastMatches.length})
                </h3>

                {pastMatches.length === 0 ? (
                    <p className="text-xs text-zinc-500">No completed duels yet.</p>
                ) : (
                    <div className="space-y-2">
                        {pastMatches.slice(0, 10).map((m) => {
                            const isWinner = m.winnerId === user?.id;
                            const isDraw = m.status === 'DRAW';

                            return (
                                <div
                                    key={m.id}
                                    className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Badge
                                            className={
                                                isWinner
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : isDraw
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                            }
                                        >
                                            {isWinner ? 'VICTORY 🏆' : isDraw ? 'DRAW 🤝' : 'DEFEAT'}
                                        </Badge>
                                        <div className="truncate">
                                            <p className="font-bold text-zinc-900 dark:text-white truncate">
                                                {m.problemTitle}
                                            </p>
                                            <p className="text-[10px] text-zinc-400">
                                                vs {m.challengerId === user?.id ? m.opponentName : m.challengerName} · {m.problemDifficulty} · {m.problemTopic}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right text-[11px] text-zinc-400 shrink-0">
                                        {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : 'Completed'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Challenge Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Swords className="w-5 h-5 text-[#5b4fff]" /> Launch 1v1 PVP Duel
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Select a friend and duel settings. Both will compete on the chosen problem in real time!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-3">
                        {/* Select Opponent */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Choose Friend</label>
                            <select
                                value={selectedFriendId}
                                onChange={(e) => setSelectedFriendId(e.target.value)}
                                className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white"
                            >
                                <option value="">Select a friend to challenge...</option>
                                {friends.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name} (@{f.leetcodeUsername || f.codeforcesHandle || 'coder'})
                                    </option>
                                ))}
                            </select>
                            {friends.length === 0 && (
                                <p className="text-[11px] text-amber-600">
                                    You don't have any accepted friends yet. Add a friend first in the Friends tab!
                                </p>
                            )}
                        </div>

                        {/* Topic Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Topic</label>
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white"
                            >
                                <option value="Dynamic Programming">Dynamic Programming</option>
                                <option value="Tree">Tree / Binary Tree</option>
                                <option value="Graph">Graph / BFS / DFS</option>
                                <option value="Binary Search">Binary Search</option>
                                <option value="Two Pointers">Two Pointers</option>
                                <option value="Greedy">Greedy</option>
                                <option value="Any">Random Core Topic</option>
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Difficulty</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['Easy', 'Medium', 'Hard', 'Any'].map((diff) => (
                                    <button
                                        type="button"
                                        key={diff}
                                        onClick={() => setSelectedDifficulty(diff)}
                                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                            selectedDifficulty === diff
                                                ? 'bg-[#5b4fff] text-white border-[#5b4fff]'
                                                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                        }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Time Limit</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[15, 30, 45, 60].map((mins) => (
                                    <button
                                        type="button"
                                        key={mins}
                                        onClick={() => setDurationMinutes(mins)}
                                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                            durationMinutes === mins
                                                ? 'bg-[#5b4fff] text-white border-[#5b4fff]'
                                                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                        }`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom problem optional */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                Optional: Custom Problem
                            </span>
                            <Input
                                placeholder="Problem Title (e.g. Trapping Rain Water)"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                            />
                            <Input
                                placeholder="Problem URL (e.g. https://leetcode.com/problems/...)"
                                value={customLink}
                                onChange={(e) => setCustomLink(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                            />
                        </div>

                        <div className="pt-3 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl text-xs h-9 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateDuel}
                                disabled={isCreating || !selectedFriendId}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4 h-9 gap-1.5 shadow-sm cursor-pointer"
                            >
                                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Issue Challenge
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
