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
import { formatProblemTitle } from '@/lib/problemFormatter';
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
        // Periodic background poll for match updates every 8 seconds during active duels
        const interval = setInterval(() => {
            void loadData();
        }, 8000);
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
            setFeedback({ text: '⚔️ Challenge sent! Waiting for your friend to accept.', type: 'success' });
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
            setFeedback({ text: '⚔️ Duel started! Both clocks are ticking. Good luck!', type: 'success' });
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
                setFeedback({ text: '🏆 VICTORY! You solved the duel problem first! Congratulations!', type: 'success' });
            } else if (res.data.status === 'COMPLETED') {
                setFeedback({ text: 'The match has been completed.', type: 'success' });
            } else {
                setFeedback({
                    text: 'Solution not detected yet. Submit on LeetCode first, or paste your submission link!',
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
            setTimeout(() => setFeedback(null), 6000);
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
                <p className="text-xs font-semibold text-zinc-500">Loading PVP Arena...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {feedback && (
                <div
                    className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <X className="w-4 h-4 text-rose-500 shrink-0" />}
                        {feedback.text}
                    </span>
                    <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer text-zinc-400 hover:text-zinc-600 p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* PVP Arena Header Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#5b4fff]/20 via-indigo-600/15 to-purple-600/20 border border-[#5b4fff]/30 dark:border-[#5b4fff]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#5b4fff]/20 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2.5 rounded-2xl bg-[#5b4fff] text-white shadow-md">
                            <Swords className="w-6 h-6" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                                    PVP Problem-Solving Arena
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 animate-pulse">
                                    <Flame className="w-3 h-3" /> Live Duels
                                </span>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl">
                                Challenge your peers to 1v1 speed duels. Both receive the same problem — the first one to solve and verify wins the match and climbs the leaderboard!
                            </p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-2xl text-xs font-extrabold px-6 h-11 shadow-lg hover:shadow-xl hover:shadow-[#5b4fff]/25 transition-all gap-2 shrink-0 cursor-pointer relative z-10"
                >
                    <Play className="w-4 h-4" /> Launch 1v1 Duel
                </Button>
            </div>

            {/* Active Duels Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-rose-500" /> Active Duels & In-Progress Battles ({activeMatches.length})
                    </h3>
                </div>

                {activeMatches.length === 0 ? (
                    <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                            <Swords className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No active duels right now</p>
                            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                Pick a friend from your network, set the difficulty and time limit, and battle in real time!
                            </p>
                        </div>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            variant="outline"
                            className="rounded-xl text-xs font-bold mt-2"
                        >
                            <Play className="w-4 h-4 mr-1.5" /> Start First Duel
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {activeMatches.map((match) => {
                            const isChallenger = match.challengerId === user?.id;
                            const opponentName = isChallenger ? match.opponentName : match.challengerName;
                            const isInvitedPending = match.status === 'INVITED';
                            const needsMyAcceptance = isInvitedPending && !isChallenger;
                            const remaining = match.remainingSeconds ?? 0;
                            const isClockRunningOut = remaining < 300 && remaining > 0;
                            const formattedTitle = match.problemTitle ? formatProblemTitle(match.problemTitle) : 'Duel Problem';

                            return (
                                <div
                                    key={match.id}
                                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-sm space-y-4 hover:border-[#5b4fff]/40 transition-all"
                                >
                                    {/* Match Status Bar & Timer */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2.5">
                                            <Badge
                                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
                                                    match.status === 'IN_PROGRESS'
                                                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 animate-pulse'
                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                                }`}
                                            >
                                                {match.status === 'IN_PROGRESS' ? '⚔️ DUEL IN PROGRESS' : '📨 INVITATION PENDING'}
                                            </Badge>
                                            <span className="text-xs font-medium text-zinc-500">
                                                Topic: <strong className="text-zinc-900 dark:text-white font-bold">{match.problemTopic}</strong>
                                            </span>
                                        </div>

                                        {match.status === 'IN_PROGRESS' && (
                                            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-extrabold shadow-2xs border ${
                                                isClockRunningOut
                                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-bounce'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                                            }`}>
                                                <Clock className="w-4 h-4 text-rose-500" />
                                                <span>Time Left: {formatSeconds(match.remainingSeconds)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* VS Coder Dual Face-off */}
                                    <div className="grid grid-cols-3 items-center gap-2 py-2">
                                        {/* Challenger */}
                                        <div className="text-center space-y-1.5">
                                            <Avatar className="w-12 h-12 mx-auto border-2 border-[#5b4fff]/40 shadow-sm">
                                                <AvatarImage src={match.challengerAvatarUrl} />
                                                <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] font-bold text-sm">
                                                    {match.challengerName.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {match.challengerName} {isChallenger && <span className="text-[#5b4fff]">(You)</span>}
                                            </p>
                                            <div>
                                                {match.challengerSolved ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                        <CheckCircle2 className="w-3 h-3" /> SOLVED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                                                        <Clock className="w-3 h-3" /> Solving...
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* VS Badge */}
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-rose-500 via-purple-600 to-[#5b4fff] text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-500/20">
                                                VS
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                                                {match.durationMinutes}m Duel
                                            </span>
                                        </div>

                                        {/* Opponent */}
                                        <div className="text-center space-y-1.5">
                                            <Avatar className="w-12 h-12 mx-auto border-2 border-purple-500/40 shadow-sm">
                                                <AvatarImage src={match.opponentAvatarUrl} />
                                                <AvatarFallback className="bg-purple-500/10 text-purple-600 font-bold text-sm">
                                                    {match.opponentName.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {match.opponentName} {!isChallenger && <span className="text-[#5b4fff]">(You)</span>}
                                            </p>
                                            <div>
                                                {match.opponentSolved ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                        <CheckCircle2 className="w-3 h-3" /> SOLVED
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                                                        <Clock className="w-3 h-3" /> Solving...
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Problem Target Box */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                                    {formattedTitle}
                                                </h4>
                                                <Badge
                                                    className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${
                                                        match.problemDifficulty === 'Easy'
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                            : match.problemDifficulty === 'Medium'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    }`}
                                                >
                                                    {match.problemDifficulty}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-zinc-500">
                                                First coder to submit and verify takes the victory crown.
                                            </p>
                                        </div>

                                        <a
                                            href={match.problemLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white shadow-xs hover:shadow-md hover:shadow-[#5b4fff]/20 transition-all shrink-0"
                                        >
                                            <span>Open Problem on LeetCode</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    {/* Action Row */}
                                    {needsMyAcceptance && (
                                        <div className="flex items-center gap-3 pt-2">
                                            <Button
                                                onClick={() => handleAcceptMatch(match.id)}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 gap-2 cursor-pointer shadow-sm"
                                            >
                                                <Check className="w-4 h-4" /> Accept Duel Challenge
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeclineMatch(match.id)}
                                                className="flex-1 border-zinc-200 dark:border-zinc-700 text-zinc-600 rounded-xl text-xs font-bold h-10 gap-2 cursor-pointer"
                                            >
                                                <X className="w-4 h-4" /> Decline
                                            </Button>
                                        </div>
                                    )}

                                    {match.status === 'IN_PROGRESS' && (
                                        <div className="pt-2 space-y-2">
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Optional: Paste LeetCode submission link to verify instantly..."
                                                    value={submissionUrlInput[match.id] || ''}
                                                    onChange={(e) =>
                                                        setSubmissionUrlInput(prev => ({ ...prev, [match.id]: e.target.value }))
                                                    }
                                                    className="bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700 h-10 text-xs rounded-xl flex-1"
                                                />
                                                <Button
                                                    onClick={() => handleVerifySubmission(match.id)}
                                                    disabled={verifyingMatchId === match.id}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-5 h-10 gap-2 shrink-0 cursor-pointer shadow-md hover:shadow-lg transition-all"
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
                                                💡 Tip: Submit on LeetCode, then click Verify. MentorSync will scan your recent submissions or verify your URL in seconds!
                                            </p>
                                        </div>
                                    )}

                                    {isInvitedPending && isChallenger && (
                                        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 text-center">
                                            Waiting for {opponentName} to accept your duel invitation...
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Match History */}
            <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Duel Match History & Past Battles ({pastMatches.length})
                </h3>

                {pastMatches.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs text-zinc-500">
                        No completed duels yet. Complete your first match to build your head-to-head record!
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {pastMatches.slice(0, 10).map((m) => {
                            const isWinner = m.winnerId === user?.id;
                            const isDraw = m.status === 'DRAW';
                            const title = m.problemTitle ? formatProblemTitle(m.problemTitle) : 'Duel Problem';

                            return (
                                <div
                                    key={m.id}
                                    className="p-4 rounded-2xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 flex items-center justify-between gap-3 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Badge
                                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${
                                                isWinner
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : isDraw
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                            }`}
                                        >
                                            {isWinner ? 'VICTORY 🏆' : isDraw ? 'DRAW 🤝' : 'DEFEAT'}
                                        </Badge>
                                        <div className="truncate">
                                            <p className="font-bold text-zinc-900 dark:text-white truncate">
                                                {title}
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
                <DialogContent className="max-w-md bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Swords className="w-5 h-5 text-[#5b4fff]" /> Launch 1v1 PVP Duel
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Select a friend and battle parameters. Both receive the same problem simultaneously!
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
                                <p className="text-[11px] text-amber-600 font-medium">
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
                                className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9.5 text-xs rounded-xl"
                            />
                            <Input
                                placeholder="Problem URL (e.g. https://leetcode.com/problems/...)"
                                value={customLink}
                                onChange={(e) => setCustomLink(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9.5 text-xs rounded-xl"
                            />
                        </div>

                        <div className="pt-3 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl text-xs h-10 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateDuel}
                                disabled={isCreating || !selectedFriendId}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-5 h-10 gap-2 shadow-md cursor-pointer"
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
