import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import {
    ArrowLeftIcon,
    CheckCircleIcon as CheckCircle2,
    ArrowSquareOutIcon as ExternalLink,
    SpinnerIcon as Loader2,
    BrainIcon as BrainCircuit,
    ClockIcon,
    MedalIcon as Award,
    SwordIcon as Swords,
    WarningIcon as AlertTriangle,
    SparkleIcon as Sparkles,
    MagnifyingGlassIcon as Search,
    UsersIcon as Users,
    ChartLineIcon,
    BookOpenIcon as BookOpen,
    XIcon,
    ShieldCheckIcon as ShieldCheck,
    CopyIcon,
    CheckIcon as Check,
    IdentificationCardIcon as IdCard,
    ScalesIcon as Scales,
    TrophyIcon as Trophy
} from '@phosphor-icons/react';
import { SocialService } from '../../services/endpoints';
import { StreakFlame } from '../ui/StreakFlame';
import { ActivityHeatmap } from '@/components/dashboard/student/ActivityHeatmap';
import { ContestRatingsSection } from '@/components/dashboard/student/ContestRatingsSection';
import { UnifiedContestHistory } from '@/components/dashboard/student/UnifiedContestHistory';
import { formatProblemTitle, getProblemPlatform } from '@/lib/problemFormatter';
import { getCScoreTier } from '../../lib/cScoreCalculator';
import { useAuth } from '../../hooks/useAuth';
import type { FriendComparisonDTO, StudentExtendedDTO, SkillStat, Badge, RecentSubmission } from '@/types';

interface FriendDashboardModalProps {
    friendId: string | null;
    open: boolean;
    onClose: () => void;
    onChallengePvp?: (friendId: string, friendName: string, customProblemTitle?: string, customProblemLink?: string) => void;
}

interface FriendProfileHeaderProps {
    profile: StudentExtendedDTO;
    cScore: number;
    totalSolved: number;
    lcSolved: number;
    cfSolved: number;
    maxRating: number;
    lcRating: number;
    cfRating: number;
    userWins: number;
    friendWins: number;
    pvpDraws: number;
    cardClasses: string;
}

function FriendProfileHeader({
    profile,
    cScore,
    totalSolved,
    lcSolved,
    cfSolved,
    maxRating,
    lcRating,
    cfRating,
    userWins,
    friendWins,
    pvpDraws,
    cardClasses
}: Readonly<FriendProfileHeaderProps>) {
    const cScoreTier = getCScoreTier(cScore);
    const hasLinkedAccount = Boolean(profile.leetcodeUsername || profile.codeforcesHandle);

    return (
        <Card className={`p-4 sm:p-8 ${cardClasses}`}>
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                    <Avatar className="w-16 h-16 sm:w-24 sm:h-24 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-full shrink-0">
                        <AvatarImage src={profile.avatarUrl} />
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-[#5b4fff] dark:text-[#968fff] text-xl sm:text-3xl font-bold">
                            {profile.name?.substring(0, 2).toUpperCase() || 'FR'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap mb-1">
                            <h1 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                {profile.name}
                            </h1>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Friend
                            </span>
                            {hasLinkedAccount && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/25"
                                    title="Verified Coding Platform Sync"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#5b4fff] dark:text-[#968fff]" />
                                    <span>Verified Sync</span>
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                            {profile.leetcodeUsername ? (
                                <a
                                    href={`https://leetcode.com/${profile.leetcodeUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-600 dark:text-zinc-400 hover:text-[#5b4fff] dark:hover:text-[#b4afff] transition-colors inline-flex items-center text-xs font-medium bg-zinc-100 dark:bg-zinc-900/60 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800"
                                >
                                    LC: @{profile.leetcodeUsername} ({lcSolved} solved • {lcRating > 0 ? `${lcRating} rating` : 'Unrated'}) <ExternalLink className="h-3 w-3 ml-1.5" />
                                </a>
                            ) : (
                                <span className="text-zinc-400 dark:text-zinc-500 inline-flex items-center text-xs font-medium bg-zinc-100/60 dark:bg-zinc-900/30 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    LC: Not linked
                                </span>
                            )}
                            {profile.codeforcesHandle ? (
                                <a
                                    href={`https://codeforces.com/profile/${profile.codeforcesHandle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors inline-flex items-center text-xs font-medium bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                                >
                                    CF: @{profile.codeforcesHandle} ({cfSolved} solved • {cfRating > 0 ? `${cfRating} rating` : 'Unrated'}) <ExternalLink className="h-3 w-3 ml-1.5" />
                                </a>
                            ) : (
                                <span className="text-zinc-400 dark:text-zinc-500 inline-flex items-center text-xs font-medium bg-zinc-100/60 dark:bg-zinc-900/30 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    CF: Not linked
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stat Metric Summary Pill */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 bg-zinc-50/80 dark:bg-zinc-900/40 p-4 sm:p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-inner w-full xl:w-auto">
                    <div className="text-center min-w-18">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">C-Score</p>
                        <p className="text-2xl font-black text-[#5b4fff] dark:text-[#968fff]">{cScore}</p>
                        <p className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${cScoreTier.badgeClass}`}>
                            {cScoreTier.tier}
                        </p>
                    </div>
                    <div className="text-center min-w-17.5">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Rank</p>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                            {profile.rank ? `#${Number.parseInt(profile.rank, 10).toLocaleString()}` : (profile.codeforcesRank || 'N/A')}
                        </p>
                    </div>
                    <div className="text-center min-w-20">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Solved</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalSolved}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">LC: {lcSolved} • CF: {cfSolved}</p>
                    </div>
                    <div className="text-center min-w-20">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Rating</p>
                        <p className="text-2xl font-bold text-[#5b4fff] dark:text-[#b4afff]">{maxRating > 0 ? maxRating : 'Unrated'}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">LC: {lcRating > 0 ? lcRating : 'Unrated'} • CF: {cfRating > 0 ? cfRating : 'Unrated'}</p>
                    </div>
                    <div className="text-center min-w-17.5">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Streak</p>
                        <p className="text-2xl font-bold text-amber-500 flex justify-center items-center">
                            {profile.consistencyStreak || 0} <StreakFlame className="w-5 h-5 ml-1.5" />
                        </p>
                    </div>
                    <div className="text-center min-w-21.25 sm:border-l sm:border-zinc-200 sm:dark:border-zinc-800 sm:pl-5">
                        <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-500 mb-1">Head-to-Head</p>
                        <p className="text-2xl font-bold flex items-center justify-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-400">{userWins}W</span>
                            <span className="text-zinc-400 text-sm font-normal">-</span>
                            <span className="text-rose-600 dark:text-rose-400">{friendWins}L</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{pvpDraws} draws</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
interface FriendAnalyticsSectionProps {
    profile: StudentExtendedDTO;
    cardClasses: string;
    skillGaps: { name: string; count: number }[];
    easyCount: number;
    medCount: number;
    hardCount: number;
    progressTotal: number;
    totalMatches: number;
    winRate: number;
    userWins: number;
    friendWins: number;
    pvpDraws: number;
    formatDate: (ts: number | string) => string;
    onChallengePvp?: (friendId: string, friendName: string) => void;
    onClose: () => void;
}

function FriendAnalyticsSection({
    profile,
    cardClasses,
    skillGaps,
    easyCount,
    medCount,
    hardCount,
    progressTotal,
    totalMatches,
    winRate,
    userWins,
    friendWins,
    pvpDraws,
    formatDate,
    onChallengePvp,
    onClose
}: Readonly<FriendAnalyticsSectionProps>) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Heatmap, Skills, Skill Gaps, Contest Ratings, Unified Contest History */}
            <div className="lg:col-span-2 space-y-6">
                <ActivityHeatmap
                    progressHistory={profile.progressHistory}
                    consistencyStreak={profile.consistencyStreak}
                    cardClassName={cardClasses}
                />

                <Card className={cardClasses}>
                    <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                            <BrainCircuit className="w-5 h-5 mr-2 text-[#5b4fff]" /> Top Skills & Mastered Topics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2.5">
                            {profile.skills && profile.skills.length > 0 ? (
                                profile.skills.toSorted((a: SkillStat, b: SkillStat) => b.problemsSolved - a.problemsSolved).slice(0, 15).map((skill: SkillStat) => (
                                    <div key={skill.tagName} className="flex items-center bg-zinc-100/70 dark:bg-zinc-900/40 rounded-xl px-3 py-1.5 border border-zinc-200 dark:border-zinc-800/60 shadow-xs">
                                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mr-2.5">{skill.tagName}</span>
                                        <span className="text-[11px] font-bold bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#b4afff] px-2 py-0.5 rounded-md">{skill.problemsSolved}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-500 py-2 italic">No topic data available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {skillGaps.length > 0 && (
                    <Card className={cardClasses}>
                        <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                            <CardTitle className="text-lg font-bold text-rose-600 dark:text-rose-400 tracking-tight flex items-center">
                                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" /> Focus Areas & Identified Skill Gaps
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-3">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Core technical interview topics with low/zero problem solutions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {skillGaps.map((gap) => (
                                    <div key={gap.name} className="flex items-center bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1.5 shadow-xs">
                                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 mr-2">{gap.name}</span>
                                        <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md">
                                            {gap.count} solves
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <ContestRatingsSection
                    contestHistory={profile.contestHistory}
                    currentContestRating={profile.currentContestRating}
                    globalRanking={profile.rank}
                    codeforcesContestHistory={profile.codeforcesContestHistory}
                    codeforcesRating={profile.codeforcesRating}
                    codeforcesMaxRating={profile.codeforcesMaxRating}
                    codeforcesRank={profile.codeforcesRank}
                    codeforcesMaxRank={profile.codeforcesMaxRank}
                />

                <UnifiedContestHistory
                    contestHistory={profile.contestHistory}
                    codeforcesContestHistory={profile.codeforcesContestHistory}
                    cardClassName={cardClasses}
                />
            </div>

            {/* Right Column: Difficulty Breakdown, Head-to-Head Duel Record, Recent Activity, Badges */}
            <div className="space-y-6">
                <Card className={cardClasses}>
                    <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Difficulty Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">Easy</span>
                                <span className="font-bold text-zinc-900 dark:text-white">{easyCount}</span>
                            </div>
                            <Progress value={(easyCount / progressTotal) * 100} className="h-2.5 bg-emerald-100 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800/60 [&>div]:bg-emerald-500 shadow-inner" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-amber-600 dark:text-amber-400 font-bold tracking-wide">Medium</span>
                                <span className="font-bold text-zinc-900 dark:text-white">{medCount}</span>
                            </div>
                            <Progress value={(medCount / progressTotal) * 100} className="h-2.5 bg-amber-100 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800/60 [&>div]:bg-amber-500 shadow-inner" />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-rose-600 dark:text-rose-400 font-bold tracking-wide">Hard</span>
                                <span className="font-bold text-zinc-900 dark:text-white">{hardCount}</span>
                            </div>
                            <Progress value={(hardCount / progressTotal) * 100} className="h-2.5 bg-rose-100 dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800/60 [&>div]:bg-rose-500 shadow-inner" />
                        </div>
                    </CardContent>
                </Card>

                {/* Head-to-Head Duel Card */}
                <Card className={cardClasses}>
                    <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Swords className="w-5 h-5 text-[#5b4fff]" /> Head-to-Head Duel Record
                            </span>
                            {totalMatches > 0 && (
                                <span className="text-xs font-semibold text-zinc-500">
                                    {winRate}% win rate
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-center">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Wins</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{userWins}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Losses</p>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{friendWins}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Draws</p>
                                <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300">{pvpDraws}</p>
                            </div>
                        </div>

                        {onChallengePvp && profile && (
                            <Button
                                onClick={() => {
                                    onClose();
                                    onChallengePvp(profile.id!, profile.name);
                                }}
                                className="w-full bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl font-bold py-2.5 text-xs shadow-md hover:shadow-lg hover:shadow-[#5b4fff]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Swords className="w-4 h-4" /> Challenge to PVP Duel
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className={`flex flex-col ${cardClasses}`}>
                    <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                        <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                            <ClockIcon className="w-5 h-5 mr-2 text-[#5b4fff]" /> Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 px-6 pb-6 pt-6">
                        <ScrollArea className="h-64 pr-4 custom-scrollbar">
                            <div className="space-y-4">
                                {(!profile.recentSubmissions || profile.recentSubmissions.length === 0) ? (
                                    <p className="text-xs text-zinc-500 py-6 text-center italic">No recent activity recorded.</p>
                                ) : (
                                    profile.recentSubmissions.slice(0, 15).map((sub: RecentSubmission) => (
                                        <div key={`${sub.platform || 'LC'}-${sub.titleSlug || sub.title}-${sub.timestamp}`} className="flex items-start space-x-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/60 last:border-0 last:pb-0">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-[14px] font-medium leading-tight text-zinc-900 dark:text-white truncate">{sub.title}</p>
                                                    {sub.platform && (
                                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                                                            sub.platform === 'CODEFORCES'
                                                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                                                                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                                                        }`}>
                                                            {sub.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-zinc-500">{formatDate(sub.timestamp)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Earned Badges */}
                {profile.badges && profile.badges.length > 0 && (
                    <Card className={cardClasses}>
                        <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                                <Award className="w-5 h-5 mr-2 text-amber-500" /> Earned Badges ({profile.badges.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-3">
                                {profile.badges.slice(0, 9).map((badge: Badge) => (
                                    <div key={`${badge.title}-${badge.icon}`} className="aspect-square bg-zinc-100/80 dark:bg-zinc-900/40 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-800/60 p-2 shadow-xs hover:border-[#5b4fff]/40 transition-all group" title={badge.title}>
                                        <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt="badge" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

interface FriendPeerLearningSectionProps {
    profile: StudentExtendedDTO;
    cardClasses: string;
    searchFilter: string;
    setSearchFilter: (val: string) => void;
    filteredFriendOnly: string[];
    filteredMutual: string[];
    filteredUserOnly: string[];
    onChallengePvp?: (friendId: string, friendName: string, customProblemTitle?: string, customProblemLink?: string) => void;
    onClose: () => void;
}

function FriendPeerLearningSection({
    profile,
    cardClasses,
    searchFilter,
    setSearchFilter,
    filteredFriendOnly,
    filteredMutual,
    filteredUserOnly,
    onChallengePvp,
    onClose
}: Readonly<FriendPeerLearningSectionProps>) {
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
                <span className="p-2 rounded-xl bg-[#5b4fff] text-white shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                </span>
                <div>
                    <p className="inline">
                        <strong className="font-extrabold text-[#5b4fff] dark:text-[#968fff]">
                            Peer-to-Peer Learning Insight:
                        </strong>{' '}
                        Compare what your friend has mastered that you have not solved yet. Click on any problem to practice directly or challenge your friend to a 1v1 duel!
                    </p>
                </div>
            </div>

            <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search problem titles in this comparison..."
                    className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl text-xs h-9.5"
                />
            </div>

            {/* Solved by Friend */}
            <Card className={cardClasses}>
                <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" />
                            <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                Solved by {profile.name.split(' ')[0]} (Learn from Friend)
                            </CardTitle>
                        </div>
                        <span className="bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/25 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            {filteredFriendOnly.length} questions to try
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {filteredFriendOnly.length === 0 ? (
                        <p className="py-6 text-center text-xs text-zinc-500">
                            {searchFilter ? 'No matching problems found.' : 'You have solved all recent problems in their catalog! Great job!'}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                            {filteredFriendOnly.map((slug) => {
                                const { platform, url } = getProblemPlatform(slug);
                                const title = formatProblemTitle(slug);

                                return (
                                    <div
                                        key={slug}
                                        className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2 hover:border-[#5b4fff]/40 hover:shadow-xs transition-all group"
                                    >
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 min-w-0 flex-1"
                                            title={`Solve ${title}`}
                                        >
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                                platform === 'LeetCode'
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                                            }`}>
                                                {platform === 'LeetCode' ? 'LC' : 'CF'}
                                            </span>
                                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-[#5b4fff] truncate">
                                                {title}
                                            </span>
                                        </a>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 text-zinc-400 hover:text-[#5b4fff] transition-colors"
                                                title="Open problem in new tab"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        onClose();
                                                        onChallengePvp(profile.id!, profile.name, title, url);
                                                    }}
                                                    className="h-7 px-2 text-[10px] font-bold text-[#5b4fff] hover:bg-[#5b4fff]/10 rounded-lg cursor-pointer"
                                                >
                                                    Duel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Mutual Mastered Problems */}
            <Card className={cardClasses}>
                <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                Mutual Mastered Problems
                            </CardTitle>
                        </div>
                        <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            {filteredMutual.length} common solved
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {filteredMutual.length === 0 ? (
                        <p className="py-6 text-center text-xs text-zinc-500">
                            {searchFilter ? 'No matching problems found.' : 'No mutual problems found yet. Solve more together!'}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                            {filteredMutual.map((slug) => {
                                const { platform, url } = getProblemPlatform(slug);
                                const title = formatProblemTitle(slug);

                                return (
                                    <div
                                        key={slug}
                                        className="p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2"
                                    >
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 min-w-0 flex-1 hover:text-[#5b4fff]"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                                {platform === 'LeetCode' ? 'LC' : 'CF'}
                                            </span>
                                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                                {title}
                                            </span>
                                        </a>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-zinc-400 hover:text-[#5b4fff] p-1"
                                                title="Open problem in new tab"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        onClose();
                                                        onChallengePvp(profile.id!, profile.name, title, url);
                                                    }}
                                                    className="h-7 px-2 text-[10px] font-bold text-[#5b4fff] hover:bg-[#5b4fff]/10 rounded-lg cursor-pointer"
                                                >
                                                    Duel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Solved by You Only */}
            <Card className={cardClasses}>
                <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                Solved by You (Help {profile.name.split(' ')[0]} Learn)
                            </CardTitle>
                        </div>
                        <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            {filteredUserOnly.length} questions
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {filteredUserOnly.length === 0 ? (
                        <p className="py-6 text-center text-xs text-zinc-500">
                            {searchFilter ? 'No matching problems found.' : 'Your friend has solved all your recent catalog items.'}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                            {filteredUserOnly.map((slug) => {
                                const { platform, url } = getProblemPlatform(slug);
                                const title = formatProblemTitle(slug);

                                return (
                                    <div
                                        key={slug}
                                        className="p-2.5 rounded-xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2"
                                    >
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 min-w-0 flex-1 hover:text-[#5b4fff]"
                                        >
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                                                platform === 'LeetCode'
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                    : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                                            }`}>
                                                {platform === 'LeetCode' ? 'LC' : 'CF'}
                                            </span>
                                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                                {title}
                                            </span>
                                        </a>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-zinc-400 hover:text-[#5b4fff] p-1"
                                                title="Open problem in new tab"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            {onChallengePvp && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        onClose();
                                                        onChallengePvp(profile.id!, profile.name, title, url);
                                                    }}
                                                    className="h-7 px-2 text-[10px] font-bold text-[#5b4fff] hover:bg-[#5b4fff]/10 rounded-lg cursor-pointer"
                                                >
                                                    Duel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

interface FriendSubmissionsSectionProps {
    profile: StudentExtendedDTO;
    cardClasses: string;
}

function FriendSubmissionsSection({ profile, cardClasses }: Readonly<FriendSubmissionsSectionProps>) {
    return (
        <Card className={cardClasses}>
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2 text-[#5b4fff]" /> Verified Submissions Catalog
                    </CardTitle>
                    <span className="text-xs text-zinc-400 font-medium">
                        {profile.recentSubmissions?.length || 0} Total Logged Submissions
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <ScrollArea className="h-115 pr-2 custom-scrollbar">
                    <div className="space-y-2.5">
                        {(!profile.recentSubmissions || profile.recentSubmissions.length === 0) ? (
                            <p className="py-16 text-center text-xs text-zinc-500">
                                No submissions cataloged for this peer.
                            </p>
                        ) : (
                            profile.recentSubmissions.map((sub: RecentSubmission, idx: number) => {
                                const title = sub.title || formatProblemTitle(sub.titleSlug);
                                const targetUrl = sub.questionLink || (sub.titleSlug ? `https://leetcode.com/problems/${sub.titleSlug}/` : '#');

                                return (
                                    <div
                                        key={`${sub.platform || 'LC'}-${sub.titleSlug || sub.title}-${sub.timestamp || idx}`}
                                        className="p-3.5 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <div className="truncate">
                                                <a
                                                    href={targetUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-bold text-zinc-900 dark:text-white hover:text-[#5b4fff] transition-colors truncate block"
                                                >
                                                    {title}
                                                </a>
                                                <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {sub.timestamp ? new Date(sub.timestamp * 1000).toLocaleString() : 'Recent'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                            {sub.platform || 'LeetCode'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

interface FriendCoderCardSectionProps {
    profile: StudentExtendedDTO;
    cScore: number;
    easyCount: number;
    medCount: number;
    hardCount: number;
    totalSolved: number;
    lcSolved: number;
    cfSolved: number;
    lcRating: number;
    cfRating: number;
    maxRating: number;
    onChallengePvp?: (friendId: string, friendName: string) => void;
    onClose: () => void;
}

function FriendCoderCardSection({
    profile,
    cScore,
    easyCount,
    medCount,
    hardCount,
    totalSolved,
    lcSolved,
    cfSolved,
    lcRating,
    cfRating,
    maxRating,
    onChallengePvp,
    onClose
}: Readonly<FriendCoderCardSectionProps>) {
    const [copied, setCopied] = useState(false);
    const tier = getCScoreTier(cScore);
    const cScoreProgress = Math.min(Math.max(((cScore - 500) / 400) * 100, 0), 100);

    const handleCopySnapshot = async () => {
        const text = [
            `Coder Snapshot: ${profile.name}`,
            `C-Score: ${cScore} (${tier.tier})`,
            `Solved: ${totalSolved} (Easy: ${easyCount}, Med: ${medCount}, Hard: ${hardCount})`,
            `Contest Rating: ${maxRating > 0 ? maxRating : 'Unrated'} | 1v1 PvP Elo: ${profile.pvpRating ?? 1200}`,
            `Consistency Streak: ${profile.consistencyStreak || 0} Days`,
            `Verified on MentorSync Social Hub`
        ].join('\n');

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {
            // clipboard access restricted
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* The Digital Coder Card */}
            <div className="rounded-2xl bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 relative overflow-hidden space-y-6">
                {/* Card Top Strip: Watermark & Verification */}
                <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-[#5b4fff]/15 text-[#5b4fff]">
                            <IdCard className="w-5 h-5" />
                        </span>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#5b4fff]">
                                Codolio Certified Developer Card
                            </span>
                            <p className="text-xs text-zinc-500 font-medium">Digital Algorithmic Portfolio</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Verified Live Profile</span>
                    </div>
                </div>

                {/* Profile Identity Row */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="relative">
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-3 border-[#5b4fff]/40 shadow-xl ring-4 ring-[#5b4fff]/10">
                            <AvatarImage src={profile.avatarUrl} />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-[#5b4fff] text-2xl font-bold">
                                {profile.name?.substring(0, 2).toUpperCase() || 'FR'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111114]" />
                    </div>

                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {profile.name}
                            </h2>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {profile.rank ? `#${Number.parseInt(profile.rank, 10).toLocaleString()} Global` : 'Active Competitor'}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            @{profile.leetcodeUsername || profile.codeforcesHandle || 'developer'} · Competitive Algorithmic Coder
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                            {profile.leetcodeUsername && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80">
                                    <span className="font-bold text-amber-500">LC:</span> @{profile.leetcodeUsername}
                                </span>
                            )}
                            {profile.codeforcesHandle && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700/80">
                                    <span className="font-bold text-cyan-600 dark:text-cyan-400">CF:</span> @{profile.codeforcesHandle}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* C-Score Composite Index Gauge Banner */}
                <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#5b4fff]" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[#5b4fff]">
                                Codolio C-Score Composite Index
                            </span>
                        </div>
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border self-start sm:self-auto ${tier.badgeClass}`}>
                            {tier.tier} Tier
                        </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white font-mono">
                            {cScore}
                        </span>
                        <span className="text-xs text-zinc-500 font-semibold">/ 900 Index Scale</span>
                    </div>

                    <div className="space-y-1.5">
                        <Progress value={cScoreProgress} className="h-3 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                            <span>Developing (500)</span>
                            <span>Proficient (560)</span>
                            <span>Advanced (620)</span>
                            <span>Expert (680)</span>
                            <span>Master (750)</span>
                            <span>Grandmaster (820+)</span>
                        </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {tier.description}
                    </p>
                </div>

                {/* Core Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total Solved</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalSolved}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">LC: {lcSolved} · CF: {cfSolved}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Peak Rating
                        </p>
                        <p className="text-2xl font-black text-[#5b4fff] dark:text-[#968fff] mt-1">
                            {maxRating > 0 ? maxRating : 'Unrated'}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">LC: {lcRating || 'N/A'} · CF: {cfRating || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">1v1 PvP Elo</p>
                        <p className="text-2xl font-black text-[#5b4fff] dark:text-[#968fff] mt-1">
                            {profile.pvpRating ?? 1200}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{profile.pvpWins || 0}W - {profile.pvpLosses || 0}L</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Streak Record</p>
                        <p className="text-2xl font-black text-amber-500 mt-1 flex items-center justify-center gap-1">
                            {profile.consistencyStreak || 0}d <StreakFlame className="w-5 h-5" />
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Consistent Problem Solver</p>
                    </div>
                </div>

                {/* DSA Problem Difficulty Breakdown Progress */}
                <div className="p-5 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Algorithmic Difficulty Distribution
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-emerald-600 dark:text-emerald-400">Easy Problems</span>
                                <span className="text-zinc-900 dark:text-white font-mono">{easyCount} solved</span>
                            </div>
                            <Progress value={Math.min((easyCount / Math.max(totalSolved, 1)) * 100, 100)} className="h-2 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-amber-500">Medium Problems</span>
                                <span className="text-zinc-900 dark:text-white font-mono">{medCount} solved</span>
                            </div>
                            <Progress value={Math.min((medCount / Math.max(totalSolved, 1)) * 100, 100)} className="h-2 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-rose-500">Hard Problems</span>
                                <span className="text-zinc-900 dark:text-white font-mono">{hardCount} solved</span>
                            </div>
                            <Progress value={Math.min((hardCount / Math.max(totalSolved, 1)) * 100, 100)} className="h-2 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                    </div>
                </div>

                {/* Top Algorithmic Strengths */}
                {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4 text-[#5b4fff]" /> Top Algorithmic Competencies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills
                                .toSorted((a: SkillStat, b: SkillStat) => b.problemsSolved - a.problemsSolved)
                                .slice(0, 8)
                                .map((skill: SkillStat) => (
                                    <span
                                        key={skill.tagName}
                                        className="px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-xs flex items-center gap-1.5"
                                    >
                                        <span>{skill.tagName}</span>
                                        <span className="text-[10px] text-[#5b4fff] font-mono">({skill.problemsSolved})</span>
                                    </span>
                                ))}
                        </div>
                    </div>
                )}

                {/* Shareable Card Footer Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                    <Button
                        onClick={handleCopySnapshot}
                        variant="outline"
                        className="rounded-xl text-xs font-bold border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400">Snapshot Copied!</span>
                            </>
                        ) : (
                            <>
                                <CopyIcon className="w-4 h-4" />
                                <span>Copy Coder Snapshot</span>
                            </>
                        )}
                    </Button>

                    {onChallengePvp && (
                        <Button
                            onClick={() => {
                                onClose();
                                onChallengePvp(profile.id!, profile.name);
                            }}
                            className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold h-9 px-4 cursor-pointer gap-2 shadow-xs"
                        >
                            <Swords className="w-4 h-4" />
                            <span>Challenge in 1v1 Arena</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface FriendComparativeSectionProps {
    comparison: FriendComparisonDTO;
    profile: StudentExtendedDTO;
    cardClasses: string;
    userCScore: number;
    friendCScore: number;
    userWins: number;
    friendWins: number;
    pvpDraws: number;
    onChallengePvp?: (friendId: string, friendName: string) => void;
    onClose: () => void;
    onSwitchToPeer: () => void;
}

function FriendComparativeSection({
    comparison,
    profile,
    cardClasses,
    userCScore,
    friendCScore,
    userWins,
    friendWins,
    pvpDraws,
    onChallengePvp,
    onClose,
    onSwitchToPeer
}: Readonly<FriendComparativeSectionProps>) {
    const userTier = getCScoreTier(userCScore);
    const friendTier = getCScoreTier(friendCScore);
    const cScoreDiff = Math.abs(userCScore - friendCScore);
    const userLeadsCScore = userCScore >= friendCScore;

    const mutualCount = comparison.mutualSolved?.length || 0;
    const friendOnlyCount = comparison.friendOnlySolved?.length || 0;
    const userOnlyCount = comparison.userOnlySolved?.length || 0;
    const totalCatalog = mutualCount + friendOnlyCount + userOnlyCount;

    return (
        <div className="space-y-6">
            {/* Header: Duelist Faceoff */}
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                    {/* You */}
                    <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14 border-2 border-[#5b4fff] shadow-md shrink-0">
                            <AvatarFallback className="bg-[#5b4fff]/15 text-[#5b4fff] font-bold">
                                You
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5b4fff]">You</span>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white truncate">Your Standing</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-black text-sm text-[#5b4fff]">{userCScore} C-Score</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${userTier.badgeClass}`}>
                                    {userTier.tier}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* VS Arena Token */}
                    <div className="text-center space-y-1.5 py-2 px-4 rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                        <div className="w-9 h-9 rounded-full bg-[#5b4fff] text-white flex items-center justify-center mx-auto shadow-md">
                            <Swords className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                            Head-to-Head Duel Record
                        </p>
                        <p className="text-sm font-black">
                            <span className="text-emerald-600 dark:text-emerald-400">{userWins}W</span>
                            <span className="text-zinc-400 mx-1.5">-</span>
                            <span className="text-rose-600 dark:text-rose-400">{friendWins}L</span>
                            {pvpDraws > 0 && (
                                <span className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold ml-1.5">
                                    ({pvpDraws}D)
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Friend */}
                    <div className="flex items-center justify-start md:justify-end gap-4">
                        <div className="text-left md:text-right min-w-0 order-2 md:order-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Friend</span>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white truncate">{profile.name}</h3>
                            <div className="flex items-center justify-start md:justify-end gap-1.5 mt-0.5">
                                <span className="font-mono font-black text-sm text-zinc-800 dark:text-zinc-200">{friendCScore} C-Score</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${friendTier.badgeClass}`}>
                                    {friendTier.tier}
                                </span>
                            </div>
                        </div>
                        <Avatar className="w-14 h-14 border-2 border-zinc-300 dark:border-zinc-700 shadow-md shrink-0 order-1 md:order-2">
                            <AvatarImage src={profile.avatarUrl} />
                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-[#5b4fff] font-bold">
                                {profile.name?.substring(0, 2).toUpperCase() || 'FR'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>

            {/* Benchmarking Comparison Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Benchmark 1: C-Score Composite Gauge */}
                <Card className={cardClasses}>
                    <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                        <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#5b4fff]" /> C-Score Composite Delta
                            </span>
                            <span className="text-[11px] font-bold text-[#5b4fff]">
                                {userLeadsCScore ? `+${cScoreDiff} in your favor` : `-${cScoreDiff} peer lead`}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span>You ({userTier.tier})</span>
                                <span className="font-mono text-[#5b4fff]">{userCScore} pts</span>
                            </div>
                            <Progress value={Math.min(Math.max(((userCScore - 500) / 400) * 100, 5), 100)} className="h-2.5 bg-zinc-200 dark:bg-zinc-800" />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span>{profile.name} ({friendTier.tier})</span>
                                <span className="font-mono text-zinc-700 dark:text-zinc-300">{friendCScore} pts</span>
                            </div>
                            <Progress value={Math.min(Math.max(((friendCScore - 500) / 400) * 100, 5), 100)} className="h-2.5 bg-zinc-200 dark:bg-zinc-800" />
                        </div>

                        <p className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            C-Score aggregates algorithm volume, difficulty weighting (Hard/Medium), contest ratings, and daily streaks.
                        </p>
                    </CardContent>
                </Card>

                {/* Benchmark 2: Problem Overlap & Gap Matrix */}
                <Card className={cardClasses}>
                    <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                        <CardTitle className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-[#5b4fff]" /> Problem Overlap & Catalog Gap
                            </span>
                            <span className="text-[11px] font-bold text-zinc-500">
                                {totalCatalog} Total Explored
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Mutual Solves</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{mutualCount}</p>
                                <p className="text-[9px] text-zinc-500 mt-0.5">Both Solved</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#5b4fff]/10 border border-[#5b4fff]/25">
                                <p className="text-[10px] font-bold text-[#5b4fff] dark:text-[#968fff]">Friend Only</p>
                                <p className="text-xl font-black text-[#5b4fff] dark:text-[#968fff] mt-1">{friendOnlyCount}</p>
                                <p className="text-[9px] text-zinc-500 mt-0.5">Learn from Peer</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">You Only</p>
                                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{userOnlyCount}</p>
                                <p className="text-[9px] text-zinc-500 mt-0.5">Your Edge</p>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <span className="text-xs text-zinc-500">
                                {friendOnlyCount > 0 ? `${friendOnlyCount} problems available for peer practice` : 'All friend problems solved!'}
                            </span>
                            {friendOnlyCount > 0 && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={onSwitchToPeer}
                                    className="h-7 text-[11px] font-bold rounded-lg cursor-pointer text-[#5b4fff] border-[#5b4fff]/30 hover:bg-[#5b4fff]/10"
                                >
                                    Explore Gap List
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Duel History & Action Prompt */}
            <div className="p-5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-[#5b4fff]/10 text-[#5b4fff] shrink-0">
                        <Scales className="w-5 h-5" />
                    </span>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                            Ready to settle the score in real-time?
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Challenge {profile.name} to a 15-minute 1v1 live coding duel in the PvP Arena.
                        </p>
                    </div>
                </div>

                {onChallengePvp && (
                    <Button
                        onClick={() => {
                            onClose();
                            onChallengePvp(profile.id!, profile.name);
                        }}
                        className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold h-9 px-4 cursor-pointer gap-2 shadow-xs shrink-0"
                    >
                        <Swords className="w-4 h-4" />
                        <span>Launch 1v1 Challenge</span>
                    </Button>
                )}
            </div>
        </div>
    );
}

export function FriendDashboardModal({ friendId, open, onClose, onChallengePvp }: Readonly<FriendDashboardModalProps>) {
    const { user } = useAuth();
    const isOwnProfile = Boolean(user?.id && friendId === user.id);
    const [comparison, setComparison] = useState<FriendComparisonDTO | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'coder-card' | 'compare' | 'analytics' | 'peer' | 'submissions'>('analytics');
    const [searchFilter, setSearchFilter] = useState('');
    const [prevProps, setPrevProps] = useState({ open, friendId });

    if (open !== prevProps.open || friendId !== prevProps.friendId) {
        setPrevProps({ open, friendId });
        setComparison(null);
        setApiError(null);
        setSearchFilter('');
        setActiveSection('analytics');
    }

    const isLoading = Boolean(open && friendId && !isOwnProfile && !comparison && !apiError);

    useEffect(() => {
        if (!open || !friendId || isOwnProfile) return;

        let isMounted = true;
        SocialService.getFriendDashboard(friendId)
            .then(res => {
                if (isMounted) setComparison(res.data);
            })
            .catch(err => {
                if (isMounted) setApiError(err.response?.data?.message || 'Failed to load friend profile.');
            });

        return () => { isMounted = false; };
    }, [open, friendId, isOwnProfile]);

    const ownProfileError = 'You cannot view your own profile in Social Hub. Please view your personal dashboard in the Overview tab.';
    const error = isOwnProfile ? ownProfileError : apiError;

    const profile = comparison?.friendProfile;

    const easyCount = profile?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = profile?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = profile?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const actualSolved = profile?.totalSolved ?? (easyCount + medCount + hardCount);
    const totalSolved = actualSolved;
    const progressTotal = Math.max(actualSolved, 1);

    const lcSolved = profile?.leetcodeSolvedCount ?? (easyCount + medCount + hardCount);
    const cfSolved = profile?.codeforcesSolvedCount ?? 0;
    const lcRating = Math.round(profile?.currentContestRating || profile?.contestRating || 0);
    const cfRating = (profile?.codeforcesRating && profile.codeforcesRating > 0) ? profile.codeforcesRating : 0;
    const maxRating = Math.max(lcRating, cfRating);

    const userCScore = comparison?.userCScore ?? 500;
    const friendCScore = comparison?.friendCScore ?? profile?.cScore ?? 500;

    // Head-to-head calculations
    const userWins = comparison?.userPvpWinsAgainstFriend ?? 0;
    const friendWins = comparison?.friendPvpWinsAgainstUser ?? 0;
    const pvpDraws = comparison?.pvpDraws ?? 0;
    const totalMatches = userWins + friendWins + pvpDraws;
    const winRate = totalMatches > 0 ? Math.round((userWins / totalMatches) * 100) : 0;

    const formatDate = (ts: number | string) => {
        if (!ts) return 'Unknown Date';
        return typeof ts === 'number' ? new Date(ts * 1000).toLocaleDateString() : new Date(ts).toLocaleDateString();
    };

    const skills = profile?.skills;
    const skillGaps = useMemo(() => {
        if (!skills) return [];
        const coreTopics = [
            'Dynamic Programming', 'Graph', 'Tree', 'Binary Search', 'Sliding Window',
            'Two Pointers', 'Stack', 'Heap', 'Backtracking', 'Linked List'
        ];
        const skillMap = new Map<string, number>();
        skills.forEach((s) => {
            skillMap.set(s.tagName.toLowerCase(), s.problemsSolved);
        });

        return coreTopics.map((topic) => {
            const count = skillMap.get(topic.toLowerCase()) || 0;
            return { name: topic, count };
        }).filter((item) => item.count < 3);
    }, [skills]);

    // Filtered lists for peer learning
    const friendOnlySolved = comparison?.friendOnlySolved;
    const filteredFriendOnly = useMemo(() => {
        if (!friendOnlySolved) return [];
        if (!searchFilter.trim()) return friendOnlySolved;
        const q = searchFilter.toLowerCase();
        return friendOnlySolved.filter(s =>
            s.toLowerCase().includes(q) || formatProblemTitle(s).toLowerCase().includes(q)
        );
    }, [friendOnlySolved, searchFilter]);

    const mutualSolved = comparison?.mutualSolved;
    const filteredMutual = useMemo(() => {
        if (!mutualSolved) return [];
        if (!searchFilter.trim()) return mutualSolved;
        const q = searchFilter.toLowerCase();
        return mutualSolved.filter(s =>
            s.toLowerCase().includes(q) || formatProblemTitle(s).toLowerCase().includes(q)
        );
    }, [mutualSolved, searchFilter]);

    const userOnlySolved = comparison?.userOnlySolved;
    const filteredUserOnly = useMemo(() => {
        if (!userOnlySolved) return [];
        if (!searchFilter.trim()) return userOnlySolved;
        const q = searchFilter.toLowerCase();
        return userOnlySolved.filter(s =>
            s.toLowerCase().includes(q) || formatProblemTitle(s).toLowerCase().includes(q)
        );
    }, [userOnlySolved, searchFilter]);

    const cardClasses = "border border-zinc-200/90 dark:border-zinc-800/60 shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-white dark:bg-[#111111]/85 backdrop-blur-2xl rounded-2xl";

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent
                showCloseButton={false}
                className="w-[96vw] max-w-7xl sm:max-w-7xl max-h-[94vh] overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-2xl rounded-3xl custom-scrollbar gap-6"
            >
                <DialogTitle className="sr-only">
                    {profile?.name ? `${profile.name}'s Profile` : 'Friend Profile'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View detailed problem solving performance, contest ratings, peer comparisons, and challenge your friend to a duel.
                </DialogDescription>

                {/* Top Navigation Bar with Back button and Quick Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-white dark:bg-[#18181b] border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all rounded-xl shadow-xs dark:shadow-md flex items-center gap-2 px-4 py-2 text-sm font-medium hover:-translate-x-0.5 cursor-pointer"
                    >
                        <ArrowLeftIcon className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" weight="bold" />
                        <span>Back to Friends Hub</span>
                    </Button>

                    <div className="flex items-center gap-2.5">
                        {onChallengePvp && profile && (
                            <Button
                                onClick={() => {
                                    onClose();
                                    onChallengePvp(profile.id!, profile.name);
                                }}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-semibold h-9 px-3.5 shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                                <Swords className="w-4 h-4 mr-1" />
                                Challenge to Duel
                            </Button>
                        )}
                        <span className="text-xs text-zinc-500 font-medium hidden sm:inline-flex items-center gap-1.5">
                            Press <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-300 font-mono text-xs border border-zinc-200 dark:border-zinc-700">Esc</kbd> to return
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                            <XIcon className="w-4 h-4" />
                            <span>Close</span>
                        </Button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="py-24 flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff] mb-4" />
                            <p className="text-zinc-400 font-medium tracking-wide text-sm">Fetching friend profile...</p>
                        </div>
                    </div>
                )}

                {/* Error / Warning State */}
                {error && !isLoading && (
                    <div className="p-8 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-extrabold text-amber-900 dark:text-amber-100">Notice</p>
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 max-w-md mx-auto">{error}</p>
                        </div>
                        <Button onClick={onClose} variant="outline" className="text-xs rounded-xl border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer">
                            Return to Friends Hub
                        </Button>
                    </div>
                )}

                {!isLoading && profile && (
                    <>
                        {/* Top Banner (Identical to Mentor Student Details Banner) */}
                        <FriendProfileHeader
                            profile={profile}
                            cScore={friendCScore}
                            totalSolved={totalSolved}
                            lcSolved={lcSolved}
                            cfSolved={cfSolved}
                            maxRating={maxRating}
                            lcRating={lcRating}
                            cfRating={cfRating}
                            userWins={userWins}
                            friendWins={friendWins}
                            pvpDraws={pvpDraws}
                            cardClasses={cardClasses}
                        />

                        {/* Navigation Section Tabs */}
                        <div className="flex items-center gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2 overflow-x-auto custom-scrollbar">
                            <button
                                type="button"
                                onClick={() => setActiveSection('coder-card')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeSection === 'coder-card'
                                        ? 'bg-[#5b4fff] text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-900/60'
                                }`}
                            >
                                <IdCard className="w-4 h-4" />
                                <span>Coder Card (Snapshot)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('compare')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeSection === 'compare'
                                        ? 'bg-[#5b4fff] text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-900/60'
                                }`}
                            >
                                <Scales className="w-4 h-4" />
                                <span>Head-to-Head Benchmark</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('analytics')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeSection === 'analytics'
                                        ? 'bg-[#5b4fff] text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-900/60'
                                }`}
                            >
                                <ChartLineIcon className="w-4 h-4" />
                                <span>Performance & Analytics</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('peer')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeSection === 'peer'
                                        ? 'bg-[#5b4fff] text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-900/60'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Peer Learning & Overlap</span>
                                {comparison?.friendOnlySolved && comparison.friendOnlySolved.length > 0 && (
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                                        activeSection === 'peer' ? 'bg-white/20 text-white' : 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff]'
                                    }`}>
                                        {comparison.friendOnlySolved.length} new
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveSection('submissions')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    activeSection === 'submissions'
                                        ? 'bg-[#5b4fff] text-white shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100/80 dark:bg-zinc-900/60'
                                }`}
                            >
                                <ClockIcon className="w-4 h-4" />
                                <span>Submission History ({profile.recentSubmissions?.length || 0})</span>
                            </button>
                        </div>

                        {/* SECTION 1: CODER CARD (CODOLIO DIGITAL PORTFOLIO SNAPSHOT) */}
                        {activeSection === 'coder-card' && (
                            <FriendCoderCardSection
                                profile={profile}
                                cScore={friendCScore}
                                easyCount={easyCount}
                                medCount={medCount}
                                hardCount={hardCount}
                                totalSolved={totalSolved}
                                lcSolved={lcSolved}
                                cfSolved={cfSolved}
                                lcRating={lcRating}
                                cfRating={cfRating}
                                maxRating={maxRating}
                                onChallengePvp={onChallengePvp}
                                onClose={onClose}
                            />
                        )}

                        {/* SECTION 2: HEAD-TO-HEAD COMPARATIVE BENCHMARKING */}
                        {activeSection === 'compare' && comparison && (
                            <FriendComparativeSection
                                comparison={comparison}
                                profile={profile}
                                cardClasses={cardClasses}
                                userCScore={userCScore}
                                friendCScore={friendCScore}
                                userWins={userWins}
                                friendWins={friendWins}
                                pvpDraws={pvpDraws}
                                onChallengePvp={onChallengePvp}
                                onClose={onClose}
                                onSwitchToPeer={() => setActiveSection('peer')}
                            />
                        )}

                        {/* SECTION 3: PERFORMANCE & ANALYTICS */}
                        {activeSection === 'analytics' && (
                            <FriendAnalyticsSection
                                profile={profile}
                                cardClasses={cardClasses}
                                skillGaps={skillGaps}
                                easyCount={easyCount}
                                medCount={medCount}
                                hardCount={hardCount}
                                progressTotal={progressTotal}
                                totalMatches={totalMatches}
                                winRate={winRate}
                                userWins={userWins}
                                friendWins={friendWins}
                                pvpDraws={pvpDraws}
                                formatDate={formatDate}
                                onChallengePvp={onChallengePvp}
                                onClose={onClose}
                            />
                        )}

                        {/* SECTION 4: PEER LEARNING & PROBLEM OVERLAP */}
                        {activeSection === 'peer' && (
                            <FriendPeerLearningSection
                                profile={profile}
                                cardClasses={cardClasses}
                                searchFilter={searchFilter}
                                setSearchFilter={setSearchFilter}
                                filteredFriendOnly={filteredFriendOnly}
                                filteredMutual={filteredMutual}
                                filteredUserOnly={filteredUserOnly}
                                onChallengePvp={onChallengePvp}
                                onClose={onClose}
                            />
                        )}

                        {/* SECTION 5: RECENT SUBMISSIONS CATALOG */}
                        {activeSection === 'submissions' && (
                            <FriendSubmissionsSection
                                profile={profile}
                                cardClasses={cardClasses}
                            />
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
