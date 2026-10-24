import { useState, useEffect, useCallback, useMemo } from 'react';
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
    FlameIcon as Flame,
    SparkleIcon as Sparkles,
    ShieldCheckIcon as ShieldCheck,
    SignOutIcon as SignOut,
    WarningCircleIcon as AlertCircle
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { SocialService } from '../../services/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { usePvpWebSocket } from '../../hooks/usePvpWebSocket';
import { formatProblemTitle } from '@/lib/problemFormatter';
import type { FriendDTO, PvpMatchDTO, CreatePvpMatchRequest } from '@/types';

interface PvpArenaTabProps {
    initialChallengerTarget?: { friendId: string; friendName: string } | null;
    onClearInitialTarget?: () => void;
}


function extractPvpErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } | string } };
        if (typeof axiosErr.response?.data === 'string') return axiosErr.response.data;
        if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}

function getDifficultyBadgeClass(difficulty?: string): string {
    if (difficulty === 'Easy') {
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (difficulty === 'Medium') {
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
}

function getMatchResultClass(isWinner: boolean, isDraw: boolean): string {
    if (isWinner) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (isDraw) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
}

function getMatchResultText(isWinner: boolean, isDraw: boolean): string {
    if (isWinner) return 'VICTORY';
    if (isDraw) return 'DRAW';
    return 'DEFEAT';
}

function getFriendStatusSuffix(f: FriendDTO): string {
    if (f.isBusy) return '(Busy in Duel)';
    if (f.isOnline) return '(Live & Ready)';
    return '(Offline)';
}

export function PvpArenaTab({ initialChallengerTarget, onClearInitialTarget }: Readonly<PvpArenaTabProps>) {
    const { user } = useAuth();
    const [matches, setMatches] = useState<PvpMatchDTO[]>([]);
    const [friends, setFriends] = useState<FriendDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create Match Dialog / Quick Challenge State
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedFriendId, setSelectedFriendId] = useState('');
    const [selectedTopic, setSelectedTopic] = useState('Dynamic Programming');
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [customTitle, setCustomTitle] = useState('');
    const [customLink, setCustomLink] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Match history filter
    const [historyFilter, setHistoryFilter] = useState<'ALL' | 'WON' | 'LOST' | 'DRAWS'>('ALL');

    // Verification & Ending state
    const [verifyingMatchId, setVerifyingMatchId] = useState<string | null>(null);
    const [confirmEndMatchId, setConfirmEndMatchId] = useState<string | null>(null);
    const [isEndingDuel, setIsEndingDuel] = useState(false);
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
            const rawFriends: FriendDTO[] = friendsRes.data.friends || [];
            setFriends(rawFriends.filter(f => f.id !== user?.id));
        } catch (err) {
            console.error('Failed to load PVP data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        void loadData();
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

    const activeMatches = matches.filter(m => m.status === 'IN_PROGRESS' || m.status === 'INVITED');
    const isCurrentUserBusy = activeMatches.some(m => m.status === 'IN_PROGRESS');

    const activeMatchIds = useMemo(() => activeMatches.map(m => m.id), [activeMatches]);
    usePvpWebSocket(
        activeMatchIds,
        useCallback((event) => {
            void loadData();
            if (event?.action === 'SEVERED') {
                setFeedback({
                    text: event.message || 'PvP duel connection severed.',
                    type: 'success'
                });
                setTimeout(() => setFeedback(null), 6000);
            } else if (event?.action === 'COMPLETED') {
                setFeedback({
                    text: event.message || 'PvP duel completed!',
                    type: 'success'
                });
                setTimeout(() => setFeedback(null), 6000);
            }
        }, [loadData])
    );

    const handleCreateDuel = async () => {
        if (!selectedFriendId) {
            setFeedback({ text: 'Please select a friend to duel.', type: 'error' });
            return;
        }

        if (isCurrentUserBusy) {
            setFeedback({
                text: 'You are already in an active PvP duel. You cannot enter another PvP duel until your current duel is completed.',
                type: 'error'
            });
            return;
        }

        const target = friends.find(f => f.id === selectedFriendId);
        if (!target?.isOnline) {
            setFeedback({
                text: 'PvP duel can only happen when both users are live and active. Your friend is currently offline.',
                type: 'error'
            });
            return;
        }

        if (target?.isBusy) {
            setFeedback({
                text: `${target.name} is currently busy in another PvP duel. Please wait until their duel finishes.`,
                type: 'error'
            });
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
        } catch (err: unknown) {
            setFeedback({
                text: extractPvpErrorMessage(err, 'Failed to create challenge.'),
                type: 'error'
            });
        } finally {
            setIsCreating(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    };

    const handleAcceptMatch = async (matchId: string) => {
        if (isCurrentUserBusy) {
            setFeedback({
                text: 'You are already in an active PvP duel. You cannot enter another PvP duel until your current duel is completed.',
                type: 'error'
            });
            return;
        }

        try {
            await SocialService.acceptPvpMatch(matchId);
            setFeedback({ text: 'Duel started! Both clocks are ticking. Good luck!', type: 'success' });
            void loadData();
        } catch (err: unknown) {
            setFeedback({
                text: extractPvpErrorMessage(err, 'Failed to accept duel.'),
                type: 'error'
            });
        }
    };

    const handleDeclineMatch = async (matchId: string) => {
        try {
            await SocialService.declinePvpMatch(matchId);
            void loadData();
        } catch (err: unknown) {
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
                setFeedback({ text: 'VICTORY! You solved the duel problem first! Congratulations!', type: 'success' });
            } else if (res.data.status === 'COMPLETED') {
                setFeedback({ text: 'The match has been completed.', type: 'success' });
            } else {
                setFeedback({
                    text: 'Solution not detected yet. Submit on LeetCode first, or paste your submission link!',
                    type: 'error'
                });
            }
            void loadData();
        } catch (err: unknown) {
            setFeedback({
                text: extractPvpErrorMessage(err, 'Verification error.'),
                type: 'error'
            });
        } finally {
            setVerifyingMatchId(null);
            setTimeout(() => setFeedback(null), 6000);
        }
    };

    const handleEndDuelPreemptively = async (matchId: string) => {
        setIsEndingDuel(true);
        try {
            await SocialService.endPvpMatch(matchId);
            setFeedback({
                text: 'PvP duel ended preemptively. The duel connection has been severed.',
                type: 'success'
            });
            setConfirmEndMatchId(null);
            void loadData();
        } catch (err: unknown) {
            setFeedback({
                text: extractPvpErrorMessage(err, 'Failed to end PvP duel.'),
                type: 'error'
            });
        } finally {
            setIsEndingDuel(false);
            setTimeout(() => setFeedback(null), 6000);
        }
    };

    const formatSeconds = (sec?: number) => {
        if (sec === undefined || sec === null || sec <= 0) return '00:00';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const pastMatches = matches.filter(m => m.status === 'COMPLETED' || m.status === 'DRAW' || m.status === 'DECLINED' || m.status === 'EXPIRED');

    const wonMatchesCount = pastMatches.filter(m => m.winnerId === user?.id).length;
    const lostMatchesCount = pastMatches.filter(m => m.status === 'COMPLETED' && m.winnerId && m.winnerId !== user?.id).length;
    const drawMatchesCount = pastMatches.filter(m => m.status === 'DRAW').length;

    const filteredPastMatches = useMemo(() => {
        switch (historyFilter) {
            case 'WON':
                return pastMatches.filter(m => m.winnerId === user?.id);
            case 'LOST':
                return pastMatches.filter(m => m.status === 'COMPLETED' && m.winnerId && m.winnerId !== user?.id);
            case 'DRAWS':
                return pastMatches.filter(m => m.status === 'DRAW');
            case 'ALL':
            default:
                return pastMatches;
        }
    }, [pastMatches, historyFilter, user?.id]);

    const combatStats = useMemo(() => {
        const total = wonMatchesCount + lostMatchesCount + drawMatchesCount;
        const winRate = total > 0 ? Math.round((wonMatchesCount / total) * 100) : 0;
        return { total, winRate, won: wonMatchesCount, lost: lostMatchesCount, draws: drawMatchesCount };
    }, [wonMatchesCount, lostMatchesCount, drawMatchesCount]);

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
                    className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
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

            {/* PVP Arena Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 border border-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] flex items-center justify-center shrink-0 shadow-sm">
                        <Swords className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                PVP Problem-Solving Arena
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <Flame className="w-3 h-3" /> Live Duels
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Challenge your peers to 1v1 speed duels on identical algorithmic problems.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-semibold px-4 h-9 shadow-sm hover:shadow-md transition-all gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                    <Play className="w-3.5 h-3.5" /> Launch 1v1 Duel
                </Button>
            </div>

            {/* Balanced 2-Column + 1-Column Responsive Grid matching StudentDashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Duels Card */}
                    <div className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6 transition-colors duration-200">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-rose-500/40 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Active Duels & In-Progress Battles
                                </h3>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                {activeMatches.length} Active
                            </span>
                        </div>

                        {activeMatches.length === 0 ? (
                            <div className="p-8 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
                                    <Swords className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No active duels right now</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                                        Pick a friend from your network, set the difficulty and time limit, and battle in real time!
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-xs font-semibold mt-1 border-zinc-200 dark:border-zinc-700 hover:border-[#5b4fff]"
                                >
                                    <Play className="w-3.5 h-3.5 mr-1 text-[#5b4fff]" /> Start First Duel
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
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
                                            className="p-5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 shadow-xs space-y-4 hover:border-[#5b4fff]/40 transition-all"
                                        >
                                            {/* Match Status Bar & Timer */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                                                <div className="flex items-center gap-2.5">
                                                    <Badge
                                                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                                                            match.status === 'IN_PROGRESS'
                                                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 animate-pulse'
                                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                                                        }`}
                                                    >
                                                        {match.status === 'IN_PROGRESS' ? 'DUEL IN PROGRESS' : 'INVITATION PENDING'}
                                                    </Badge>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        Topic: <strong className="text-zinc-900 dark:text-white font-semibold">{match.problemTopic}</strong>
                                                    </span>
                                                </div>

                                                {match.status === 'IN_PROGRESS' && (
                                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${
                                                        isClockRunningOut
                                                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                                                    }`}>
                                                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                                                        <span>Time Left: {formatSeconds(match.remainingSeconds)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* VS Coder Dual Face-off */}
                                            <div className="grid grid-cols-3 items-center gap-2 py-1">
                                                {/* Challenger */}
                                                <div className="text-center space-y-1">
                                                    <Avatar className="w-11 h-11 mx-auto border-2 border-[#5b4fff]/40 shadow-xs">
                                                        <AvatarImage src={match.challengerAvatarUrl} />
                                                        <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] font-bold text-xs">
                                                            {match.challengerName.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                        {match.challengerName} {isChallenger && <span className="text-[#5b4fff]">(You)</span>}
                                                    </p>
                                                    <div>
                                                        {match.challengerSolved ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                <CheckCircle2 className="w-3 h-3" /> SOLVED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                                                                <Clock className="w-3 h-3" /> Solving...
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* VS Badge */}
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-rose-500 via-purple-600 to-[#5b4fff] text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                                                        VS
                                                    </div>
                                                    <span className="text-[10px] font-medium text-zinc-400 mt-1 uppercase tracking-wider">
                                                        {match.durationMinutes}m Duel
                                                    </span>
                                                </div>

                                                {/* Opponent */}
                                                <div className="text-center space-y-1">
                                                    <Avatar className="w-11 h-11 mx-auto border-2 border-purple-500/40 shadow-xs">
                                                        <AvatarImage src={match.opponentAvatarUrl} />
                                                        <AvatarFallback className="bg-purple-500/10 text-purple-600 font-bold text-xs">
                                                            {match.opponentName.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                        {match.opponentName} {!isChallenger && <span className="text-[#5b4fff]">(You)</span>}
                                                    </p>
                                                    <div>
                                                        {match.opponentSolved ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                <CheckCircle2 className="w-3 h-3" /> SOLVED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                                                                <Clock className="w-3 h-3" /> Solving...
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Problem Target Box */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#111111]/80 border border-zinc-200/80 dark:border-zinc-800">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                                                            {formattedTitle}
                                                        </h4>
                                                        <Badge
                                                             className={`text-[10px] font-semibold px-2 py-0.2 rounded-md border ${getDifficultyBadgeClass(match.problemDifficulty)}`}
                                                        >
                                                            {match.problemDifficulty}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        First coder to submit on LeetCode and verify claims victory.
                                                    </p>
                                                </div>

                                                <a
                                                    href={match.problemLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5b4fff] hover:bg-[#4d40ef] text-white shadow-xs transition-all shrink-0"
                                                >
                                                    <span>Open Problem</span>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </div>

                                            {/* Action Row */}
                                            {needsMyAcceptance && (
                                                <div className="flex items-center gap-2.5 pt-1">
                                                    <Button
                                                        onClick={() => handleAcceptMatch(match.id)}
                                                        disabled={isCurrentUserBusy}
                                                        title={isCurrentUserBusy ? "Cannot accept while already in an active duel" : ""}
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Accept Duel Challenge
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleDeclineMatch(match.id)}
                                                        className="flex-1 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" /> Decline
                                                    </Button>
                                                </div>
                                            )}

                                            {match.status === 'IN_PROGRESS' && (
                                                <div className="pt-1 space-y-1.5">
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Optional: Paste LeetCode submission link to verify instantly..."
                                                            value={submissionUrlInput[match.id] || ''}
                                                            onChange={(e) =>
                                                                setSubmissionUrlInput(prev => ({ ...prev, [match.id]: e.target.value }))
                                                            }
                                                            className="bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl flex-1"
                                                        />
                                                        <Button
                                                            onClick={() => handleVerifySubmission(match.id)}
                                                            disabled={verifyingMatchId === match.id || isEndingDuel}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 h-9 gap-1.5 shrink-0 cursor-pointer shadow-xs"
                                                        >
                                                            {verifyingMatchId === match.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            )}
                                                            Verify My Solution
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setConfirmEndMatchId(match.id)}
                                                            disabled={isEndingDuel || verifyingMatchId === match.id}
                                                            className="border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold px-3 h-9 gap-1.5 shrink-0 cursor-pointer"
                                                            title="End this PvP duel preemptively and sever connection"
                                                        >
                                                            <SignOut className="w-3.5 h-3.5" />
                                                            End Duel
                                                        </Button>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-400">
                                                        Tip: Submit on LeetCode, then click Verify. You can also end the duel preemptively if you wish to forfeit and sever the connection.
                                                    </p>
                                                </div>
                                            )}

                                            {isInvitedPending && isChallenger && (
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500">
                                                    <span>Waiting for {opponentName} to accept your duel invitation...</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeclineMatch(match.id)}
                                                        className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-7 px-2.5 rounded-lg cursor-pointer"
                                                    >
                                                        Cancel Invitation
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Duel Match History Card */}
                    <div className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6 transition-colors duration-200">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                                    <Trophy className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                        Duel Match History & Past Battles
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Complete match records and head-to-head duel results.
                                    </p>
                                </div>
                            </div>

                            {/* History Filter Pills */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setHistoryFilter('ALL')}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                        historyFilter === 'ALL'
                                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    All ({pastMatches.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHistoryFilter('WON')}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                        historyFilter === 'WON'
                                            ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    Won ({wonMatchesCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHistoryFilter('LOST')}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                        historyFilter === 'LOST'
                                            ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    Lost ({lostMatchesCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setHistoryFilter('DRAWS')}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                                        historyFilter === 'DRAWS'
                                            ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    Draws ({drawMatchesCount})
                                </button>
                            </div>
                        </div>

                        {filteredPastMatches.length === 0 ? (
                            <div className="p-8 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
                                No completed duels yet. Complete your first match to build your head-to-head record!
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {filteredPastMatches.slice(0, 10).map((m) => {
                                    const isWinner = m.winnerId === user?.id;
                                    const isDraw = m.status === 'DRAW';
                                    const title = m.problemTitle ? formatProblemTitle(m.problemTitle) : 'Duel Problem';
                                    const opponentName = m.challengerId === user?.id ? m.opponentName : m.challengerName;
                                    const opponentAvatar = m.challengerId === user?.id ? m.opponentAvatarUrl : m.challengerAvatarUrl;

                                    return (
                                        <div
                                            key={m.id}
                                            className="p-3.5 rounded-xl bg-zinc-50/60 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60 flex items-center justify-between gap-3 text-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Badge
                                                     className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${getMatchResultClass(isWinner, isDraw)}`}
                                                >
                                                     {getMatchResultText(isWinner, isDraw)}
                                                </Badge>

                                                <Avatar className="w-7 h-7 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                                    <AvatarImage src={opponentAvatar} />
                                                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                                                        {opponentName?.substring(0, 2) || 'OP'}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="truncate">
                                                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                                                        {title}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400">
                                                        vs {opponentName} · {m.problemDifficulty} · {m.problemTopic}
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
                </div>

                {/* Sidebar Column (Right) */}
                <div className="space-y-8">
                    {/* Instant Challenge Widget */}
                    <div className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6 transition-colors duration-200">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#5b4fff]/40 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#5b4fff]/10 text-[#5b4fff] border border-[#5b4fff]/20 flex items-center justify-center">
                                <Swords className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    Instant 1v1 Challenge
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Pick parameters and challenge a peer
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3.5">
                            {isCurrentUserBusy && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                                    <Clock className="w-4 h-4 shrink-0" />
                                    <span>You are currently in an active duel. Complete your duel before challenging others!</span>
                                </div>
                            )}

                            {/* Choose Friend */}
                            <div className="space-y-1">
                                <label htmlFor="pvp-friend-select" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Friend (Live & Ready)</label>
                                <select id="pvp-friend-select"
                                    value={selectedFriendId}
                                    onChange={(e) => setSelectedFriendId(e.target.value)}
                                    disabled={isCurrentUserBusy}
                                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#5b4fff] disabled:opacity-50"
                                >
                                    <option value="">Select a friend to challenge...</option>
                                    {friends.map((f) => (
                                        <option key={f.id} value={f.id} disabled={!f.isOnline || f.isBusy}>
                                            {f.name} {getFriendStatusSuffix(f)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Choose Topic */}
                            <div className="space-y-1">
                                <label htmlFor="pvp-topic-select" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">Topic</label>
                                <select id="pvp-topic-select"
                                    value={selectedTopic}
                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                    className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#5b4fff]"
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
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">Difficulty</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {['Easy', 'Medium', 'Hard', 'Any'].map((diff) => (
                                        <button
                                            type="button"
                                            key={diff}
                                            onClick={() => setSelectedDifficulty(diff)}
                                            className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                                selectedDifficulty === diff
                                                    ? 'bg-[#5b4fff] text-white border-[#5b4fff] shadow-2xs'
                                                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {diff}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 block">Time Limit</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[15, 30, 45, 60].map((mins) => (
                                        <button
                                            type="button"
                                            key={mins}
                                            onClick={() => setDurationMinutes(mins)}
                                            className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                                durationMinutes === mins
                                                    ? 'bg-[#5b4fff] text-white border-[#5b4fff] shadow-2xs'
                                                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                                            }`}
                                        >
                                            {mins}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleCreateDuel}
                                disabled={isCreating || !selectedFriendId || isCurrentUserBusy}
                                className="w-full bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold h-9.5 gap-1.5 shadow-sm cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                Send 1v1 Challenge
                            </Button>
                        </div>
                    </div>

                    {/* Combat Career Stats Card */}
                    <div className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6 transition-colors duration-200">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                    PVP Combat Record
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Head-to-head performance ratio
                                </p>
                            </div>
                        </div>

                        {/* Win Rate Bar */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-zinc-500">Win Rate</span>
                                <span className="text-indigo-600 dark:text-indigo-400">{combatStats.winRate}%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-[#5b4fff] to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${combatStats.winRate}%` }}
                                />
                            </div>
                        </div>

                        {/* 3 Metric Tiles */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60">
                                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Wins</p>
                                <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{combatStats.won}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60">
                                <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Losses</p>
                                <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{combatStats.lost}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/60">
                                <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Draws</p>
                                <p className="text-base font-bold text-zinc-900 dark:text-white mt-0.5">{combatStats.draws}</p>
                            </div>
                        </div>
                    </div>

                    {/* PVP Rules & Protocol Card */}
                    <div className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden p-6 transition-colors duration-200">
                        <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="w-4 h-4 text-[#5b4fff]" />
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                How 1v1 Duels Work
                            </h4>
                        </div>
                        <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5b4fff] mt-1.5 shrink-0" />
                                <span>Both coders receive the exact same problem simultaneously.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5b4fff] mt-1.5 shrink-0" />
                                <span>First coder to submit on LeetCode and click Verify wins the match.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5b4fff] mt-1.5 shrink-0" />
                                <span>Duel outcomes climb your rank on the Friends Leaderboard.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Create Challenge Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Swords className="w-4 h-4 text-[#5b4fff]" /> Launch 1v1 PVP Duel
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Select a friend and battle parameters. Both receive the same problem simultaneously!
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 pt-2">
                        {isCurrentUserBusy && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span>You are currently in an active duel. Complete your duel before issuing new challenges!</span>
                            </div>
                        )}

                        {/* Select Opponent */}
                        <div className="space-y-1">
                            <label htmlFor="pvp-rematch-friend-select" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Choose Friend (Live & Ready)</label>
                            <select id="pvp-rematch-friend-select"
                                value={selectedFriendId}
                                onChange={(e) => setSelectedFriendId(e.target.value)}
                                disabled={isCurrentUserBusy}
                                className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white focus:outline-none disabled:opacity-50"
                            >
                                <option value="">Select a friend to challenge...</option>
                                {friends.map((f) => (
                                    <option key={f.id} value={f.id} disabled={!f.isOnline || f.isBusy}>
                                        {f.name} {getFriendStatusSuffix(f)}
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
                        <div className="space-y-1">
                            <label htmlFor="pvp-rematch-topic-select" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Topic</label>
                            <select id="pvp-rematch-topic-select"
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-medium text-zinc-900 dark:text-white focus:outline-none"
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
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Difficulty</span>
                            <div className="grid grid-cols-4 gap-1.5">
                                {['Easy', 'Medium', 'Hard', 'Any'].map((diff) => (
                                    <button
                                        type="button"
                                        key={diff}
                                        onClick={() => setSelectedDifficulty(diff)}
                                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                            selectedDifficulty === diff
                                                ? 'bg-[#5b4fff] text-white border-[#5b4fff]'
                                                : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                        }`}
                                    >
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Time Limit</span>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[15, 30, 45, 60].map((mins) => (
                                    <button
                                        type="button"
                                        key={mins}
                                        onClick={() => setDurationMinutes(mins)}
                                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                            durationMinutes === mins
                                                ? 'bg-[#5b4fff] text-white border-[#5b4fff]'
                                                : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
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

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl text-xs h-9 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateDuel}
                                disabled={isCreating || !selectedFriendId || isCurrentUserBusy}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4 h-9 gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                Issue Challenge
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Ending PvP Duel Preemptively */}
            <Dialog open={!!confirmEndMatchId} onOpenChange={(open) => !open && setConfirmEndMatchId(null)}>
                <DialogContent className="sm:max-w-110 bg-white dark:bg-[#0d0d0d] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-2">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
                            End PvP Duel Preemptively?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
                            Ending the PvP duel preemptively will immediately sever the live match connection between both users. Your opponent will be awarded the victory by forfeit, and both participants will be released from active duel status.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmEndMatchId(null)}
                            disabled={isEndingDuel}
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold h-9 cursor-pointer"
                        >
                            Keep Playing
                        </Button>
                        <Button
                            type="button"
                            onClick={() => confirmEndMatchId && handleEndDuelPreemptively(confirmEndMatchId)}
                            disabled={isEndingDuel}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5 shadow-xs cursor-pointer"
                        >
                            {isEndingDuel ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <SignOut className="w-3.5 h-3.5" />
                            )}
                            Yes, End Duel & Sever Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
