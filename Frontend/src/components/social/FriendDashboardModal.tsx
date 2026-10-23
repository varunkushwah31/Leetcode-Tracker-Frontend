import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import {
    SwordIcon as Swords,
    TrophyIcon as Trophy,
    FlameIcon as Flame,
    CheckCircleIcon as CheckCircle2,
    BookOpenIcon as BookOpen,
    ArrowSquareOutIcon as ExternalLink,
    SpinnerIcon as Loader2,
    UsersIcon as Users,
    ClockIcon as Clock,
    SparkleIcon as Sparkles
} from '@phosphor-icons/react';
import { SocialService } from '../../services/endpoints';
import type { FriendComparisonDTO } from '@/types';

interface FriendDashboardModalProps {
    friendId: string | null;
    open: boolean;
    onClose: () => void;
    onChallengePvp?: (friendId: string, friendName: string) => void;
}

export function FriendDashboardModal({ friendId, open, onClose, onChallengePvp }: FriendDashboardModalProps) {
    const [comparison, setComparison] = useState<FriendComparisonDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'overview' | 'submissions' | 'comparison'>('overview');

    useEffect(() => {
        if (!open || !friendId) return;

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        SocialService.getFriendDashboard(friendId)
            .then(res => {
                if (isMounted) setComparison(res.data);
            })
            .catch(err => {
                if (isMounted) setError(err.response?.data?.message || 'Failed to load friend dashboard.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, [open, friendId]);

    const profile = comparison?.friendProfile;

    const easyCount = profile?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = profile?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = profile?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = profile?.totalSolved ?? (easyCount + medCount + hardCount);
    const progressTotal = Math.max(totalSolved, 1);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <Avatar className="w-13 h-13 border-2 border-[#5b4fff]/30 shadow-md">
                                <AvatarImage src={profile?.avatarUrl} />
                                <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] font-bold text-lg">
                                    {profile?.name?.substring(0, 2) || 'FR'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="flex items-center gap-2">
                                    <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                                        {profile?.name || 'Friend Profile'}
                                    </DialogTitle>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                                        Friend
                                    </Badge>
                                </div>
                                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    @{profile?.leetcodeUsername || profile?.codeforcesHandle || 'coder'}
                                    {profile?.rank && <span className="ml-2 font-medium text-zinc-400">· Rank {profile.rank}</span>}
                                </DialogDescription>
                            </div>
                        </div>

                        {onChallengePvp && profile && (
                            <Button
                                onClick={() => {
                                    onClose();
                                    onChallengePvp(profile.id!, profile.name);
                                }}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-semibold px-4 py-2 gap-1.5 shadow-sm"
                            >
                                <Swords className="w-4 h-4" /> Challenge to Duel
                            </Button>
                        )}
                    </div>

                    {/* Section Switcher */}
                    <div className="flex items-center gap-2 mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                        <button
                            type="button"
                            onClick={() => setActiveSection('overview')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                activeSection === 'overview'
                                    ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff]'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Overview & Stats
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('comparison')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeSection === 'comparison'
                                    ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff]'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Peer Learning & Overlap
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('submissions')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                activeSection === 'submissions'
                                    ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff]'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Recent Submissions
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                            <p className="text-xs font-medium text-zinc-500">Loading friend profile...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                            {error}
                        </div>
                    )}

                    {!isLoading && comparison && activeSection === 'overview' && (
                        <div className="space-y-6">
                            {/* Key Performance Indicators */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Solved
                                    </div>
                                    <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{totalSolved}</p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">LeetCode & Codeforces</p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        <Trophy className="w-4 h-4 text-amber-500" /> Contest Rating
                                    </div>
                                    <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                                        {Math.round(profile?.currentContestRating || 0)}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                        CF: {profile?.codeforcesRating || 'N/A'}
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        <Flame className="w-4 h-4 text-rose-500" /> Streak
                                    </div>
                                    <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                                        {profile?.consistencyStreak || 0}d
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">Consecutive solving</p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                                        <Swords className="w-4 h-4 text-[#5b4fff]" /> Head-to-Head
                                    </div>
                                    <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                                        {comparison.userPvpWinsAgainstFriend}W - {comparison.friendPvpWinsAgainstUser}L
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">{comparison.pvpDraws} draws</p>
                                </div>
                            </div>

                            {/* Difficulty Breakdown */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Problem Breakdown
                                </h4>
                                <div className="space-y-2.5">
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-emerald-600 dark:text-emerald-400">Easy</span>
                                            <span>{easyCount} problems</span>
                                        </div>
                                        <Progress value={(easyCount / progressTotal) * 100} className="h-2 bg-emerald-100 dark:bg-emerald-950/40 [&>div]:bg-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-amber-600 dark:text-amber-400">Medium</span>
                                            <span>{medCount} problems</span>
                                        </div>
                                        <Progress value={(medCount / progressTotal) * 100} className="h-2 bg-amber-100 dark:bg-amber-950/40 [&>div]:bg-amber-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-rose-600 dark:text-rose-400">Hard</span>
                                            <span>{hardCount} problems</span>
                                        </div>
                                        <Progress value={(hardCount / progressTotal) * 100} className="h-2 bg-rose-100 dark:bg-rose-950/40 [&>div]:bg-rose-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Badges preview */}
                            {profile?.badges && profile.badges.length > 0 && (
                                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                                        Earned Badges ({profile.badges.length})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.badges.map(b => (
                                            <span
                                                key={b.title}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                            >
                                                🏆 {b.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!isLoading && comparison && activeSection === 'comparison' && (
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-[#5b4fff]/10 border border-[#5b4fff]/20 text-xs text-zinc-700 dark:text-zinc-300">
                                <span className="font-bold text-[#5b4fff] dark:text-[#968fff]">Peer-to-Peer Learning Insight: </span>
                                Compare what your friend has mastered that you haven't solved yet. Ask them for hints or study approaches together!
                            </div>

                            {/* Mutual Solved */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4" /> Both Solved ({comparison.mutualSolved.length})
                                    </h4>
                                    <span className="text-[11px] text-zinc-500">Shared solutions to discuss</span>
                                </div>
                                {comparison.mutualSolved.length === 0 ? (
                                    <p className="text-xs text-zinc-500">No mutual solved questions recorded in recent activity.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                                        {comparison.mutualSolved.map(slug => (
                                            <Badge key={slug} variant="outline" className="text-xs font-normal capitalize">
                                                {slug.replace(/-/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Friend Solved, You Haven't */}
                            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4" /> Solved by {profile?.name?.split(' ')[0]} (Learn from Friend)
                                    </h4>
                                    <Badge className="bg-indigo-600 text-white text-[10px]">
                                        {comparison.friendOnlySolved.length} to try
                                    </Badge>
                                </div>
                                {comparison.friendOnlySolved.length === 0 ? (
                                    <p className="text-xs text-zinc-500">You have solved everything in their recent list!</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                                        {comparison.friendOnlySolved.map(slug => (
                                            <a
                                                key={slug}
                                                href={`https://leetcode.com/problems/${slug}/`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 transition-colors capitalize"
                                            >
                                                {slug.replace(/-/g, ' ')} <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* You Solved, Friend Hasn't */}
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                                        <Users className="w-4 h-4" /> You Solved (Help Your Friend)
                                    </h4>
                                    <span className="text-[11px] text-zinc-500">{comparison.userOnlySolved.length} problems</span>
                                </div>
                                {comparison.userOnlySolved.length === 0 ? (
                                    <p className="text-xs text-zinc-500">No extra problems recorded.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                                        {comparison.userOnlySolved.map(slug => (
                                            <Badge key={slug} variant="secondary" className="text-xs font-normal capitalize">
                                                {slug.replace(/-/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!isLoading && comparison && activeSection === 'submissions' && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Latest Submissions
                            </h4>
                            <ScrollArea className="h-72 pr-3">
                                <div className="space-y-2.5">
                                    {(!profile?.recentSubmissions || profile.recentSubmissions.length === 0) ? (
                                        <p className="text-xs text-zinc-500 py-8 text-center">No recent submissions found.</p>
                                    ) : (
                                        profile.recentSubmissions.map((sub, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    <div className="truncate">
                                                        <a
                                                            href={sub.questionLink || `https://leetcode.com/problems/${sub.titleSlug}/`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-semibold text-zinc-900 dark:text-white hover:text-[#5b4fff] transition-colors truncate block"
                                                        >
                                                            {sub.title}
                                                        </a>
                                                        <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                                            <Clock className="w-3 h-3" />
                                                            {sub.timestamp ? new Date(sub.timestamp * 1000).toLocaleDateString() : 'Recent'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 shrink-0">
                                                    {sub.platform || 'LC'}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
