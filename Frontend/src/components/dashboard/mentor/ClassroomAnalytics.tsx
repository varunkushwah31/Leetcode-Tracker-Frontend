import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import {
    PulseIcon as Activity,
    TargetIcon,
    WarningIcon as AlertTriangle,
    TrendUpIcon as TrendingUp,
    UsersIcon,
    FlameIcon,
    SparkleIcon,
    CheckCircleIcon,
    ArrowSquareOutIcon as ExternalLink,
    MagnifyingGlassIcon,
    ShieldWarningIcon,
    LightningIcon,
    CalendarBlankIcon,
    BookOpenIcon,
    CaretRightIcon,
    ArrowUpRightIcon,
    ClockIcon,
    SpinnerIcon as Loader2,
    FunnelIcon,
    UserCircleIcon,
    CodeIcon,
} from '@phosphor-icons/react';
import { ClassroomService } from '@/services/endpoints';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import type { ClassroomAnalyticsDTO, CuratedProblemDTO, TopicProficiencyDTO } from '@/types';

interface ClassroomAnalyticsProps {
    readonly data: ClassroomAnalyticsDTO | null;
    readonly classroomId?: string;
    readonly mentorId?: string;
    readonly isLoading?: boolean;
    readonly onRefresh?: () => void;
    readonly onStudentClick?: (username: string) => void;
}

type TabType = 'overview' | 'weaknesses' | 'matrix' | 'watchlist' | 'assignments';

export const formatTagName = (tag: string | undefined | null): string => {
    if (!tag) return '';
    const cleaned = tag.replace(/^\*+/, '').trim();
    if (!cleaned) return tag;
    return cleaned
        .split(/[\s_-]+/)
        .map((word) => {
            const upper = word.toUpperCase();
            if (['DP', 'BFS', 'DFS', 'MST', 'TRIES', 'SQL', 'CF', 'LC'].includes(upper)) return upper;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

export function ClassroomAnalytics({
    data,
    classroomId,
    mentorId: _mentorId,
    isLoading = false,
    onRefresh,
    onStudentClick,
}: ClassroomAnalyticsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [searchTopic, setSearchTopic] = useState('');
    const [selectedMasteryFilter, setSelectedMasteryFilter] = useState<'ALL' | 'CRITICAL_WEAKNESS' | 'DEVELOPING' | 'STRONG'>('ALL');
    const [searchWeakness, setSearchWeakness] = useState('');
    const [weaknessFilter, setWeaknessFilter] = useState<'ALL' | 'CRITICAL' | 'WITH_PROBLEMS'>('ALL');

    // Quick Assign Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState<CuratedProblemDTO | null>(null);
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentSlug, setAssignmentSlug] = useState('');
    const [assignmentPlatform, setAssignmentPlatform] = useState<'LEETCODE' | 'CODEFORCES'>('LEETCODE');
    const [assignmentDeadline, setAssignmentDeadline] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

    const effectiveClassroomId = classroomId || data?.classroomId;

    const getDefaultDeadline = (daysAhead: number = 3) => {
        const d = new Date(Date.now() + daysAhead * 86400 * 1000);
        d.setHours(23, 59, 0, 0);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleOpenAssignModal = (problem: CuratedProblemDTO) => {
        setSelectedProblem(problem);
        setAssignmentTitle(problem.title || '');
        setAssignmentSlug(problem.slug || problem.titleSlug || '');
        setAssignmentPlatform((problem.platform as 'LEETCODE' | 'CODEFORCES') || 'LEETCODE');
        setAssignmentDeadline(getDefaultDeadline(3));
        setAssignError(null);
        setAssignSuccessMsg(null);
        setAssignModalOpen(true);
    };

    const handleQuickExtend = (days: number) => {
        setAssignmentDeadline(getDefaultDeadline(days));
    };

    const handleConfirmAssign = async () => {
        if (!effectiveClassroomId) {
            setAssignError('Classroom ID is missing.');
            return;
        }
        if (!assignmentSlug.trim()) {
            setAssignError('Problem slug or URL is required.');
            return;
        }

        const start = Math.floor(Date.now() / 1000);
        const deadlineDate = new Date(assignmentDeadline);
        const end = Math.floor(deadlineDate.getTime() / 1000);

        if (isNaN(end) || end <= start) {
            setAssignError('Please select a valid future deadline date and time.');
            return;
        }

        setIsAssigning(true);
        setAssignError(null);
        try {
            await ClassroomService.assignQuestion(effectiveClassroomId, {
                platform: assignmentPlatform,
                title: assignmentTitle.trim() || undefined,
                titleSlug: assignmentSlug.trim(),
                questionLink: selectedProblem?.link || (assignmentSlug.startsWith('http') ? assignmentSlug : undefined),
                start,
                end,
            });
            setAssignSuccessMsg(`Successfully assigned "${assignmentTitle || assignmentSlug}" to the cohort!`);
            setTimeout(() => {
                setAssignModalOpen(false);
                setAssignSuccessMsg(null);
                if (onRefresh) onRefresh();
            }, 1200);
        } catch (err: unknown) {
            setAssignError(err instanceof Error && err.message ? err.message : 'Failed to assign problem.');
        } finally {
            setIsAssigning(false);
        }
    };

    // Filtered topics for the Competency Matrix
    const filteredTopics = useMemo(() => {
        if (!data?.topicProficiencies) return [];
        return data.topicProficiencies.filter((tp) => {
            const tagName = tp.tagName || '';
            const formatted = formatTagName(tagName);
            const query = searchTopic.toLowerCase();
            const matchesSearch = tagName.toLowerCase().includes(query) || formatted.toLowerCase().includes(query);
            const matchesFilter =
                selectedMasteryFilter === 'ALL' || tp.masteryLevel === selectedMasteryFilter;
            return matchesSearch && matchesFilter;
        });
    }, [data?.topicProficiencies, searchTopic, selectedMasteryFilter]);

    // Normalized critical weakness topics
    const normalizedWeaknessTopics: TopicProficiencyDTO[] = useMemo(() => {
        if (data?.topicProficiencies && data.topicProficiencies.length > 0) {
            return data.topicProficiencies.filter((t) => t.masteryLevel === 'CRITICAL_WEAKNESS' || t.severity === 'HIGH');
        }
        if (data?.criticalWeaknesses && data.criticalWeaknesses.length > 0) {
            return data.criticalWeaknesses.map((w) => ({
                tagName: w.tagName,
                problemsSolved: w.problemsSolved,
                cohortTotalSolved: w.problemsSolved,
                averageSolved: (w.problemsSolved / Math.max(data?.totalStudents || 1, 1)),
                averageSolvedPerStudent: (w.problemsSolved / Math.max(data?.totalStudents || 1, 1)),
                masteryLevel: 'CRITICAL_WEAKNESS' as const,
                severity: 'HIGH' as const,
                recommendation: `Target ${formatTagName(w.tagName)} with foundational problems to bring cohort proficiency up.`,
                suggestedProblems: [],
            }));
        }
        return [];
    }, [data?.topicProficiencies, data?.criticalWeaknesses, data?.totalStudents]);

    // Filtered weakness topics for the Weaknesses tab
    const filteredWeaknessTopics = useMemo(() => {
        return normalizedWeaknessTopics.filter((topic) => {
            const rawName = (topic.tagName || '').toLowerCase();
            const formatted = formatTagName(topic.tagName).toLowerCase();
            const query = searchWeakness.trim().toLowerCase();
            const matchesQuery = !query || rawName.includes(query) || formatted.includes(query);
            if (!matchesQuery) return false;

            if (weaknessFilter === 'CRITICAL') {
                const totalSolved = topic.cohortTotalSolved ?? topic.problemsSolved ?? 0;
                return totalSolved === 0 || topic.severity === 'HIGH';
            }
            if (weaknessFilter === 'WITH_PROBLEMS') {
                return (topic.suggestedProblems?.length ?? 0) > 0;
            }
            return true;
        });
    }, [normalizedWeaknessTopics, searchWeakness, weaknessFilter]);

    if (isLoading) {
        return (
            <Card className="shadow-xs dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800/60 bg-white dark:bg-[#121217] rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff] mb-4" />
                    <p className="text-zinc-900 dark:text-white text-base font-bold tracking-tight mb-1">
                        Computing Cohort Analytics & Weaknesses
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                        Synthesizing problem solve velocity, topic proficiencies, and risk indicators...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.totalStudents === 0) {
        return (
            <Card className="shadow-xs dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-zinc-200/90 dark:border-zinc-800/60 bg-white dark:bg-[#121217] rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-[#1a1b2e] rounded-2xl flex items-center justify-center mb-6 shadow-xs">
                        <Activity className="w-8 h-8 text-[#5b4fff] dark:text-[#968fff]" />
                    </div>
                    <p className="text-zinc-900 dark:text-white text-lg font-bold tracking-tight mb-2">No data available to generate analytics.</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Add students to view class performance insights, weakness diagnosis, and at-risk monitoring.</p>
                </CardContent>
            </Card>
        );
    }

    const cardClasses = "border border-zinc-200/90 dark:border-zinc-800/60 shadow-xs dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-white dark:bg-[#121217] rounded-2xl";

    const atRiskCount = data.atRiskStudentsCount ?? (data.atRiskStudents ? data.atRiskStudents.length : 0);
    const criticalWeaknessTopics = normalizedWeaknessTopics;

    const interviewScore = data.interviewReadinessScore ?? Math.min(100, Math.round(((data.averageMedium || 0) * 1.5 + (data.averageHard || 0) * 3) / 1.5));
    const readinessShortTag = (() => {
        if (data.readinessAssessment) {
            const splitTag = data.readinessAssessment.split(/[\u2014\-:]/)[0].trim();
            if (splitTag && splitTag.length <= 22) {
                return splitTag;
            }
        }
        return interviewScore >= 75 ? 'Interview Ready' : interviewScore >= 45 ? 'Foundations Good' : 'Needs Practice';
    })();

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Engagement */}
                <Card className={`${cardClasses} hover:-translate-y-0.5 transition-transform duration-200`}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl shadow-inner shrink-0">
                            <UsersIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Cohort Engagement</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {Math.round(data.classEngagementScore)}%
                                </h3>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                    {data.activeStudentsThisWeek}/{data.totalStudents} active
                                </span>
                            </div>
                            <Progress value={data.classEngagementScore} className="h-1.5 mt-2 bg-blue-100 dark:bg-blue-950/40 [&>div]:bg-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                {/* Readiness Score */}
                <Card className={`${cardClasses} hover:-translate-y-0.5 transition-transform duration-200`}>
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-xl shadow-inner shrink-0">
                            <SparkleIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Interview Readiness</p>
                            <div className="flex items-center justify-between gap-1.5">
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {Math.round(interviewScore)}<span className="text-sm font-normal text-zinc-400">/100</span>
                                </h3>
                                <Badge className={`text-[10px] px-2 py-0.5 font-semibold shrink-0 border ${
                                    interviewScore >= 75
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : interviewScore >= 45
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                }`}>
                                    {readinessShortTag}
                                </Badge>
                            </div>
                            <Progress value={interviewScore} className="h-1.5 mt-2 bg-purple-100 dark:bg-purple-950/40 [&>div]:bg-purple-500" />
                            {data.readinessAssessment && data.readinessAssessment.trim() !== readinessShortTag && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 truncate font-medium" title={data.readinessAssessment}>
                                    {data.readinessAssessment}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Critical Weakness Gap */}
                <Card
                    onClick={() => setActiveTab('weaknesses')}
                    className={`${cardClasses} cursor-pointer hover:border-rose-500/40 hover:-translate-y-0.5 transition-all duration-200`}
                >
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl shadow-inner shrink-0">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Critical Weaknesses</p>
                                <CaretRightIcon className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                                    {criticalWeaknessTopics.length}
                                </h3>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                    {criticalWeaknessTopics.length > 0 ? `${formatTagName(criticalWeaknessTopics[0]?.tagName) || 'Core Topics'} & more` : 'No major gaps'}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 truncate font-medium">Click to view interventions</p>
                        </div>
                    </CardContent>
                </Card>

                {/* At-Risk Watchlist */}
                <Card
                    onClick={() => setActiveTab('watchlist')}
                    className={`${cardClasses} cursor-pointer hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-200`}
                >
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-inner shrink-0 ${
                            atRiskCount > 0
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                            <ShieldWarningIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">At-Risk Students</p>
                                <CaretRightIcon className="w-3.5 h-3.5 text-zinc-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className={`text-2xl font-black tracking-tight ${atRiskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {atRiskCount}
                                </h3>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {atRiskCount > 0 ? 'Need mentor outreach' : 'All on track'}
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 truncate font-medium">
                                {data.streakChampion ? `Streak MVP: ${data.streakChampion} (${data.streakChampionStreak}d)` : 'Track consistency'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="p-1.5 bg-zinc-100/90 dark:bg-[#121216] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl flex flex-wrap gap-1.5 shadow-xs">
                <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'overview'
                            ? 'bg-white dark:bg-[#1e1e24] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/90 dark:border-zinc-700/70 font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                    }`}
                >
                    <Activity className="w-4 h-4 text-[#5b4fff]" />
                    Overview & Benchmarks
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('weaknesses')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'weaknesses'
                            ? 'bg-white dark:bg-[#1e1e24] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/90 dark:border-zinc-700/70 font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                    }`}
                >
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Critical Weaknesses & Interventions
                    {criticalWeaknessTopics.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            activeTab === 'weaknesses'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                            {criticalWeaknessTopics.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('matrix')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'matrix'
                            ? 'bg-white dark:bg-[#1e1e24] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/90 dark:border-zinc-700/70 font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                    }`}
                >
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Topic Competency Matrix
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('watchlist')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'watchlist'
                            ? 'bg-white dark:bg-[#1e1e24] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/90 dark:border-zinc-700/70 font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                    }`}
                >
                    <ShieldWarningIcon className="w-4 h-4 text-amber-500" />
                    At-Risk Watchlist
                    {atRiskCount > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            activeTab === 'watchlist'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                            {atRiskCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('assignments')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'assignments'
                            ? 'bg-white dark:bg-[#1e1e24] text-zinc-900 dark:text-white shadow-xs border border-zinc-200/90 dark:border-zinc-700/70 font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
                    }`}
                >
                    <BookOpenIcon className="w-4 h-4 text-blue-500" />
                    Assignment Health
                    {data.assignmentCompletionRate !== undefined && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            activeTab === 'assignments'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        }`}>
                            {Math.round(data.assignmentCompletionRate)}%
                        </span>
                    )}
                </button>
            </div>

            {/* TAB 1: OVERVIEW & BENCHMARKS */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Action Items Bar */}
                    {data.recommendedActionItems && data.recommendedActionItems.length > 0 && (
                        <Card className="border border-indigo-200 dark:border-indigo-900/60 bg-linear-to-r from-indigo-50/70 via-white to-purple-50/50 dark:from-[#151329] dark:via-[#121217] dark:to-[#1a1329] rounded-2xl shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                                    <LightningIcon className="w-5 h-5 text-[#5b4fff]" weight="fill" />
                                    Automated Mentorship Action Items
                                </CardTitle>
                                <CardDescription className="text-zinc-600 dark:text-zinc-400 text-xs">
                                    Synthesized algorithmic insights based on cohort solve velocity, difficulty distribution, and inactivity flags
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                {data.recommendedActionItems.map((item, idx) => {
                                    if (typeof item === 'string') {
                                        return (
                                            <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#16161c] p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70">
                                                <CheckCircleIcon className="w-4 h-4 text-[#5b4fff] shrink-0 mt-0.5" />
                                                <span className="leading-relaxed">{item}</span>
                                            </div>
                                        );
                                    }
                                    const prob = item as CuratedProblemDTO;
                                    return (
                                        <div key={prob.slug || prob.titleSlug || idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#16161c] p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <CheckCircleIcon className="w-4 h-4 text-[#5b4fff] shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-semibold text-zinc-900 dark:text-white truncate">
                                                            Assign target practice: {prob.title}
                                                        </span>
                                                        {prob.difficulty && (
                                                            <Badge className="text-[9px] px-1.5 py-0 font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                                {prob.difficulty}
                                                            </Badge>
                                                        )}
                                                        {prob.topic && (
                                                            <span className="text-[10px] text-zinc-500 font-medium">({formatTagName(prob.topic)})</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 mt-0.5">
                                                        High-yield interview question to elevate cohort proficiency in flagged weak topics.
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleOpenAssignModal(prob)}
                                                className="shrink-0 h-7 px-2.5 text-xs bg-zinc-900 dark:bg-zinc-800 hover:bg-[#5b4fff] dark:hover:bg-[#5b4fff] text-white rounded-lg font-medium transition-colors cursor-pointer"
                                            >
                                                <LightningIcon className="w-3 h-3 mr-1" />
                                                Assign Now
                                            </Button>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Difficulty Breakdown & Readiness */}
                        <Card className={cardClasses}>
                            <CardHeader className="pb-4 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-white">Difficulty Distribution</CardTitle>
                                        <CardDescription className="text-xs text-zinc-500">Problems solved per student across difficulty tiers</CardDescription>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                        Avg {data.averageTotalSolved} Total
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-emerald-600 dark:text-emerald-400">Easy ({data.easyPercentage ? Math.round(data.easyPercentage) : Math.round((data.averageEasy / Math.max(data.averageTotalSolved, 1)) * 100)}%)</span>
                                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">{data.averageEasy} avg</span>
                                    </div>
                                    <Progress value={data.easyPercentage || ((data.averageEasy / Math.max(data.averageTotalSolved, 1)) * 100)} className="h-2.5 bg-emerald-100 dark:bg-zinc-800 [&>div]:bg-emerald-500 shadow-inner" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-amber-600 dark:text-amber-400">Medium ({data.mediumPercentage ? Math.round(data.mediumPercentage) : Math.round((data.averageMedium / Math.max(data.averageTotalSolved, 1)) * 100)}%)</span>
                                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">{data.averageMedium} avg</span>
                                    </div>
                                    <Progress value={data.mediumPercentage || ((data.averageMedium / Math.max(data.averageTotalSolved, 1)) * 100)} className="h-2.5 bg-amber-100 dark:bg-zinc-800 [&>div]:bg-amber-500 shadow-inner" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-rose-600 dark:text-rose-400">Hard ({data.hardPercentage ? Math.round(data.hardPercentage) : Math.round((data.averageHard / Math.max(data.averageTotalSolved, 1)) * 100)}%)</span>
                                        <span className="text-zinc-700 dark:text-zinc-300 font-bold">{data.averageHard} avg</span>
                                    </div>
                                    <Progress value={data.hardPercentage || ((data.averageHard / Math.max(data.averageTotalSolved, 1)) * 100)} className="h-2.5 bg-rose-100 dark:bg-zinc-800 [&>div]:bg-rose-500 shadow-inner" />
                                </div>

                                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                                    <span>Recommended Interview Benchmark:</span>
                                    <span className="font-semibold text-zinc-900 dark:text-white">20% Easy / 65% Med / 15% Hard</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Platform Diversity & Contest Performance */}
                        <Card className={cardClasses}>
                            <CardHeader className="pb-4 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                    <CodeIcon className="w-5 h-5 text-[#5b4fff]" /> Multi-Platform & Contest Profile
                                </CardTitle>
                                <CardDescription className="text-xs text-zinc-500">Distribution between LeetCode and Codeforces</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Dual Platform</p>
                                        <h4 className="text-2xl font-black text-purple-700 dark:text-purple-300">{data.dualPlatformStudents ?? 0}</h4>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">LC + CF Active</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">LeetCode Only</p>
                                        <h4 className="text-2xl font-black text-amber-700 dark:text-amber-300">{data.leetcodeOnlyStudents ?? data.totalStudents}</h4>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">Profiles</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Codeforces Only</p>
                                        <h4 className="text-2xl font-black text-blue-700 dark:text-blue-300">{data.codeforcesOnlyStudents ?? 0}</h4>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">Profiles</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                                        <p className="text-[11px] font-semibold text-zinc-500 mb-1">Avg LC Contest Rating</p>
                                        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                                            {data.averageLeetcodeRating ? Math.round(data.averageLeetcodeRating) : '—'}
                                        </h4>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
                                        <p className="text-[11px] font-semibold text-zinc-500 mb-1">Avg CF Contest Rating</p>
                                        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                                            {data.averageCodeforcesRating ? Math.round(data.averageCodeforcesRating) : '—'}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl bg-[#5b4fff]/10 border border-[#5b4fff]/20 text-xs">
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                        <FlameIcon className="w-4 h-4 text-amber-500" /> Cohort Streak Average
                                    </span>
                                    <span className="font-black text-[#5b4fff] dark:text-[#968fff]">
                                        {data.averageStreak ? data.averageStreak.toFixed(1) : '0.0'} days
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Topic Highlights */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Strengths */}
                        <Card className={cardClasses}>
                            <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircleIcon className="w-4 h-4" /> Cohort Strongholds
                                </CardTitle>
                                <CardDescription className="text-xs text-zinc-500">Topics with the highest solve volume and mastery</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex flex-wrap gap-2">
                                    {data.topStrengths && data.topStrengths.length > 0 ? (
                                        data.topStrengths.map((skill, i) => (
                                            <div key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 shadow-xs cursor-default">
                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{formatTagName(skill.tagName)}</span>
                                                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
                                                    {skill.problemsSolved}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">No strength data recorded yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Critical Weaknesses Quick Access */}
                        <Card className={cardClasses}>
                            <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> High-Priority Gaps
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveTab('weaknesses')}
                                        className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-7 px-2 cursor-pointer"
                                    >
                                        View Interventions <ArrowUpRightIcon className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </div>
                                <CardDescription className="text-xs text-zinc-500">Core algorithmic topics with low cohort solve counts</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex flex-wrap gap-2">
                                    {criticalWeaknessTopics.length > 0 ? (
                                        criticalWeaknessTopics.map((skill: any, i) => (
                                            <div key={i} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 shadow-xs cursor-default">
                                                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">{formatTagName(skill.tagName)}</span>
                                                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded-md">
                                                    {skill.problemsSolved ?? skill.cohortTotalSolved ?? 0}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-zinc-500 italic">No critical gaps identified.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* TAB 2: CRITICAL WEAKNESSES & TARGETED INTERVENTIONS */}
            {activeTab === 'weaknesses' && (
                <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="bg-linear-to-r from-rose-500/10 via-amber-500/5 to-transparent border border-rose-500/20 p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="max-w-3xl">
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                High-Yield Algorithmic Weaknesses & Intervention Catalog
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                Our diagnostic engine detects high-priority topics where cohort participation is critically low.
                                Directly target these blind spots by assigning curated high-yield interview problems with one click.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16161c] border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gap Topics</p>
                                <p className="text-lg font-black text-rose-600 dark:text-rose-400">{normalizedWeaknessTopics.length}</p>
                            </div>
                            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#16161c] border border-zinc-200/80 dark:border-zinc-800 text-center shadow-xs">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Curated Problems</p>
                                <p className="text-lg font-black text-[#5b4fff] dark:text-[#968fff]">
                                    {normalizedWeaknessTopics.reduce((acc, t) => acc + (t.suggestedProblems?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter and Search Bar for Weaknesses */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search weaknesses (e.g. Dynamic Programming, Graph, Greedy)..."
                                value={searchWeakness}
                                onChange={(e) => setSearchWeakness(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-[#121217] border-zinc-200 dark:border-zinc-800"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1">
                                <FunnelIcon className="w-3.5 h-3.5" /> Filter:
                            </span>
                            <button
                                type="button"
                                onClick={() => setWeaknessFilter('ALL')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    weaknessFilter === 'ALL'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                All ({normalizedWeaknessTopics.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setWeaknessFilter('CRITICAL')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    weaknessFilter === 'CRITICAL'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                                }`}
                            >
                                Critical Only
                            </button>
                            <button
                                type="button"
                                onClick={() => setWeaknessFilter('WITH_PROBLEMS')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    weaknessFilter === 'WITH_PROBLEMS'
                                        ? 'bg-[#5b4fff] text-white shadow-xs'
                                        : 'bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/20'
                                }`}
                            >
                                Ready to Assign
                            </button>
                        </div>
                    </div>

                    {normalizedWeaknessTopics.length === 0 ? (
                        <Card className={cardClasses}>
                            <CardContent className="py-12 text-center">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <h4 className="text-base font-bold text-zinc-900 dark:text-white">Outstanding Cohort Balance!</h4>
                                <p className="text-xs text-zinc-500 mt-1">No critical algorithmic weaknesses detected across core topics.</p>
                            </CardContent>
                        </Card>
                    ) : filteredWeaknessTopics.length === 0 ? (
                        <Card className={cardClasses}>
                            <CardContent className="py-12 text-center">
                                <MagnifyingGlassIcon className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No Weaknesses Match Your Search</h4>
                                <p className="text-xs text-zinc-500 mt-1">Try searching for a different topic or reset your filter.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {filteredWeaknessTopics.map((topic) => {
                                const totalSolved = topic.cohortTotalSolved ?? topic.problemsSolved ?? 0;
                                const avgSolved = topic.averageSolvedPerStudent ?? topic.averageSolved ?? (totalSolved / Math.max(data.totalStudents || 1, 1));
                                const formattedTitle = formatTagName(topic.tagName);
                                return (
                                <Card key={topic.tagName} className={`${cardClasses} border border-zinc-200/90 dark:border-zinc-800/80 hover:border-rose-500/40 transition-all flex flex-col justify-between overflow-hidden shadow-xs`}>
                                    <div>
                                        <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60 bg-rose-500/5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold shrink-0">
                                                        <TargetIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate" title={formattedTitle}>
                                                                {formattedTitle}
                                                            </h4>
                                                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px] shrink-0 font-bold">
                                                                CRITICAL BLIND SPOT
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            Cohort Solved: <span className="font-semibold text-zinc-900 dark:text-white">{totalSolved}</span> total ({avgSolved.toFixed(1)} avg/student)
                                                        </p>
                                                    </div>
                                                </div>

                                                <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold text-[10px] shrink-0">
                                                    Low Solve Volume
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="pt-4 space-y-4">
                                            {/* Diagnostic Recommendation */}
                                            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                                                <SparkleIcon className="w-4 h-4 text-[#5b4fff] shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <span className="font-bold text-zinc-900 dark:text-white mr-1.5">Diagnostic Recommendation:</span>
                                                    <span className="leading-relaxed">{topic.recommendation || `Schedule focused practice sessions covering ${formattedTitle} patterns.`}</span>
                                                </div>
                                            </div>

                                            {/* Curated Problem Recommendations */}
                                            {topic.suggestedProblems && topic.suggestedProblems.length > 0 ? (
                                                <div>
                                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                                        <CodeIcon className="w-3.5 h-3.5 text-[#5b4fff]" /> Curated Interview Problems to Bridge This Gap:
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                        {topic.suggestedProblems.map((prob, pIdx) => {
                                                            const probKey = prob.slug || prob.titleSlug || `${topic.tagName}-${pIdx}`;
                                                            const probLink = prob.link || (prob.titleSlug ? (prob.platform === 'CODEFORCES' ? `https://codeforces.com/problemset/problem/${prob.titleSlug}` : `https://leetcode.com/problems/${prob.titleSlug}`) : undefined);
                                                            return (
                                                            <div
                                                                key={probKey}
                                                                className="p-3 rounded-xl bg-white dark:bg-[#16161c] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#5b4fff]/50 transition-all flex flex-col justify-between group shadow-2xs"
                                                            >
                                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                                                                prob.platform === 'CODEFORCES'
                                                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                                            }`}>
                                                                                {prob.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                                                            </span>
                                                                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                                                                prob.difficulty === 'EASY'
                                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                                    : prob.difficulty === 'MEDIUM'
                                                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                                            }`}>
                                                                                {prob.difficulty || 'MEDIUM'}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate" title={prob.title}>
                                                                            {prob.title}
                                                                        </p>
                                                                    </div>

                                                                    {probLink && (
                                                                        <a
                                                                            href={probLink}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-zinc-400 hover:text-[#5b4fff] transition-colors p-1 shrink-0"
                                                                            title="Open problem in new tab"
                                                                        >
                                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                                        </a>
                                                                    )}
                                                                </div>

                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleOpenAssignModal(prob)}
                                                                    className="w-full mt-2 h-7 text-xs bg-zinc-900 dark:bg-zinc-800 hover:bg-[#5b4fff] dark:hover:bg-[#5b4fff] text-white rounded-lg font-medium transition-colors cursor-pointer"
                                                                >
                                                                    <LightningIcon className="w-3.5 h-3.5 mr-1" />
                                                                    Assign to Cohort
                                                                </Button>
                                                            </div>
                                                        );})}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No specific curated problem templates linked yet.</p>
                                            )}
                                        </CardContent>
                                    </div>
                                </Card>
                            );})}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: TOPIC COMPETENCY MATRIX */}
            {activeTab === 'matrix' && (
                <div className="space-y-6">
                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                placeholder="Search topic (e.g., Tree, Dynamic Programming, Graph)..."
                                value={searchTopic}
                                onChange={(e) => setSearchTopic(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-[#121217] border-zinc-200 dark:border-zinc-800"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1">
                                <FunnelIcon className="w-3.5 h-3.5" /> Filter:
                            </span>
                            <button
                                onClick={() => setSelectedMasteryFilter('ALL')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    selectedMasteryFilter === 'ALL'
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                All ({data.topicProficiencies?.length || 0})
                            </button>
                            <button
                                onClick={() => setSelectedMasteryFilter('CRITICAL_WEAKNESS')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    selectedMasteryFilter === 'CRITICAL_WEAKNESS'
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                                }`}
                            >
                                Weakness
                            </button>
                            <button
                                onClick={() => setSelectedMasteryFilter('DEVELOPING')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    selectedMasteryFilter === 'DEVELOPING'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                }`}
                            >
                                Developing
                            </button>
                            <button
                                onClick={() => setSelectedMasteryFilter('STRONG')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                    selectedMasteryFilter === 'STRONG'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                            >
                                Strong
                            </button>
                        </div>
                    </div>

                    {/* Matrix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTopics.map((topic) => {
                            const totalSolved = topic.cohortTotalSolved ?? topic.problemsSolved ?? 0;
                            const avgSolved = topic.averageSolvedPerStudent ?? topic.averageSolved ?? (totalSolved / Math.max(data.totalStudents || 1, 1));
                            const profIndex = Math.min(100, Math.round(avgSolved * 25));
                            const formattedTitle = formatTagName(topic.tagName);
                            return (
                            <Card key={topic.tagName} className={`${cardClasses} hover:-translate-y-0.5 transition-all flex flex-col justify-between`}>
                                <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white truncate" title={formattedTitle}>
                                            {formattedTitle}
                                        </CardTitle>
                                        <Badge className={`text-[10px] font-bold ${
                                            topic.masteryLevel === 'STRONG'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                : topic.masteryLevel === 'DEVELOPING'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                        }`}>
                                            {topic.masteryLevel === 'STRONG' ? 'STRONG' : topic.masteryLevel === 'DEVELOPING' ? 'DEVELOPING' : 'WEAKNESS'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs text-zinc-500">
                                        {totalSolved} solved total ({avgSolved.toFixed(1)} avg/student)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
                                            <span>Proficiency Index</span>
                                            <span>{profIndex}%</span>
                                        </div>
                                        <Progress
                                            value={profIndex}
                                            className={`h-2 ${
                                                topic.masteryLevel === 'STRONG'
                                                    ? '[&>div]:bg-emerald-500 bg-emerald-100 dark:bg-zinc-800'
                                                    : topic.masteryLevel === 'DEVELOPING'
                                                    ? '[&>div]:bg-amber-500 bg-amber-100 dark:bg-zinc-800'
                                                    : '[&>div]:bg-rose-500 bg-rose-100 dark:bg-zinc-800'
                                            }`}
                                        />
                                    </div>

                                    {topic.suggestedProblems && topic.suggestedProblems.length > 0 && (() => {
                                        const targetProblem = topic.suggestedProblems[0];
                                        return (
                                            <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-1.5">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Problem:</p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]" title={targetProblem.title}>
                                                        {targetProblem.title}
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenAssignModal(targetProblem)}
                                                        className="h-6 px-2 text-[11px] text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/10"
                                                    >
                                                        Assign <LightningIcon className="w-3 h-3 ml-0.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        );})}
                    </div>

                    {filteredTopics.length === 0 && (
                        <div className="text-center py-12 text-zinc-500 text-xs">
                            No topics matched your search or filter.
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: AT-RISK WATCHLIST */}
            {activeTab === 'watchlist' && (
                <div className="space-y-6">
                    <div className="bg-linear-to-r from-amber-500/10 via-rose-500/5 to-transparent border border-amber-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                <ShieldWarningIcon className="w-5 h-5 text-amber-500" />
                                Early Warning & Inactivity Watchlist
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                                Students are flagged as at-risk if they have had zero submissions in the last 7+ days or are lagging by over 50% below the cohort average.
                                Timely intervention helps prevent churn and interview unpreparedness.
                            </p>
                        </div>
                    </div>

                    {(!data.atRiskStudents || data.atRiskStudents.length === 0) ? (
                        <Card className={cardClasses}>
                            <CardContent className="py-14 text-center">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <h4 className="text-base font-bold text-zinc-900 dark:text-white">All Students Are Currently Active & On Track!</h4>
                                <p className="text-xs text-zinc-500 mt-1">
                                    No students are currently falling behind or experiencing long periods of inactivity.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.atRiskStudents.map((student) => {
                                const streak = student.streak ?? student.currentStreak ?? 0;
                                const isCritical = student.riskLevel === 'CRITICAL' || student.riskLevel === 'HIGH';
                                const isWarning = student.riskLevel === 'WARNING' || student.riskLevel === 'MEDIUM';
                                const reason = student.riskReason || student.primaryRiskReason || 'Inactivity or solve velocity deficit';
                                const identifier = student.leetcodeUsername || student.codeforcesHandle || student.name || student.email || 'Student';
                                const studentKey = student.studentId || identifier;
                                return (
                                <Card
                                    key={studentKey}
                                    className={`${cardClasses} border-l-4 ${
                                        isCritical
                                            ? 'border-l-rose-500'
                                            : isWarning
                                            ? 'border-l-amber-500'
                                            : 'border-l-blue-500'
                                    } hover:-translate-y-0.5 transition-all`}
                                >
                                    <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
                                                    {(student.name || 'ST').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                        {student.name || identifier}
                                                    </h4>
                                                    <p className="text-[11px] text-zinc-500 truncate">{student.email || identifier}</p>
                                                </div>
                                            </div>

                                            <Badge className={`text-[9px] font-extrabold uppercase ${
                                                isCritical
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                                    : isWarning
                                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                            }`}>
                                                {student.riskLevel || 'WARNING'}
                                            </Badge>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-3 space-y-3">
                                        {/* Risk Reason Banner */}
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-700 dark:text-zinc-300">
                                            <p className="font-semibold text-zinc-900 dark:text-white mb-0.5">Alert Trigger:</p>
                                            <p className="leading-snug text-zinc-600 dark:text-zinc-400">{reason}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-900/40">
                                                <p className="text-[10px] text-zinc-500 font-semibold">Total Solved</p>
                                                <p className="text-sm font-extrabold text-zinc-900 dark:text-white">{student.totalSolved ?? 0}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-zinc-100/60 dark:bg-zinc-900/40">
                                                <p className="text-[10px] text-zinc-500 font-semibold">Activity Status</p>
                                                <p className={`text-sm font-extrabold ${student.activeThisWeek ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {student.daysInactive !== undefined ? `${student.daysInactive}d Inactive` : student.activeThisWeek ? 'Active this wk' : 'Inactive'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                                            <span>Current Streak:</span>
                                            <span className="font-bold text-amber-500 flex items-center gap-1">
                                                {streak} <FlameIcon className="w-3.5 h-3.5" />
                                            </span>
                                        </div>

                                        {onStudentClick && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onStudentClick(student.name || student.email || student.leetcodeUsername || '')}
                                                className="w-full mt-2 h-8 text-xs rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                            >
                                                <UserCircleIcon className="w-3.5 h-3.5 mr-1.5" />
                                                Open Student Profile
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );})}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 5: ASSIGNMENT HEALTH */}
            {activeTab === 'assignments' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className={cardClasses}>
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                                    <BookOpenIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Assignments</p>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                                        {data.totalAssignments ?? (data.assignmentsBreakdown?.length || 0)}
                                    </h3>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={cardClasses}>
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    <CheckCircleIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Overall Completion</p>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                                        {data.assignmentCompletionRate ? Math.round(data.assignmentCompletionRate) : 0}%
                                    </h3>
                                    <Progress value={data.assignmentCompletionRate || 0} className="h-1.5 mt-2 bg-emerald-100 dark:bg-emerald-950/40 [&>div]:bg-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={cardClasses}>
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                                    <ClockIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Active Cohort Velocity</p>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white">
                                        {data.activeStudentsThisWeek ?? 0} Active
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-0.5">Contributing to submissions</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {(!data.assignmentsBreakdown || data.assignmentsBreakdown.length === 0) ? (
                        <Card className={cardClasses}>
                            <CardContent className="py-12 text-center">
                                <BookOpenIcon className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                                <h4 className="text-base font-bold text-zinc-900 dark:text-white">No Assignments Created Yet</h4>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Assign questions via the "Critical Weaknesses" tab or "Manage Assignments" to monitor completion health.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.assignmentsBreakdown.map((asg, idx) => {
                                const isExpired = asg.expired ?? asg.isExpired ?? false;
                                const completion = Math.round(asg.completionPercentage ?? asg.completionRate ?? 0);
                                const completedCount = asg.completedStudentsCount ?? asg.completedCount ?? 0;
                                const totalCount = asg.totalStudentsCount ?? asg.totalStudents ?? data.totalStudents;
                                const dueDateText = asg.endTimestamp
                                    ? new Date(asg.endTimestamp * 1000).toLocaleDateString()
                                    : asg.dueDate
                                    ? new Date(asg.dueDate).toLocaleDateString()
                                    : 'No deadline';
                                const problemTitle = asg.title || formatTagName(asg.titleSlug || asg.problemSlug) || 'Cohort Assignment';

                                return (
                                <Card key={asg.assignmentId || idx} className={cardClasses}>
                                    <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                                        asg.platform === 'CODEFORCES'
                                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                        {asg.platform === 'CODEFORCES' ? 'CF' : 'LC'}
                                                    </span>
                                                    <Badge className={`text-[9px] font-bold ${
                                                        isExpired
                                                            ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                        {isExpired ? 'EXPIRED' : 'ACTIVE'}
                                                    </Badge>
                                                </div>
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate" title={problemTitle}>
                                                    {problemTitle}
                                                </h4>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-lg font-black text-zinc-900 dark:text-white">
                                                    {completion}%
                                                </span>
                                                <p className="text-[10px] text-zinc-500 font-medium">
                                                    {completedCount}/{totalCount} solved
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-3 space-y-2">
                                        <Progress value={completion} className="h-2 bg-zinc-100 dark:bg-zinc-800 [&>div]:bg-emerald-500" />
                                        <div className="flex justify-between items-center text-xs text-zinc-500 pt-1">
                                            <span>Deadline:</span>
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {dueDateText}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );})}
                        </div>
                    )}
                </div>
            )}

            {/* QUICK ASSIGN PROBLEM DIALOG */}
            <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl">
                    <DialogHeader>
                        <div className="w-10 h-10 rounded-xl bg-[#5b4fff]/10 border border-[#5b4fff]/20 flex items-center justify-center text-[#5b4fff] mb-2">
                            <LightningIcon className="w-5 h-5" weight="fill" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                            Target Weakness: Assign Problem
                        </DialogTitle>
                        <DialogDescription className="text-zinc-600 dark:text-zinc-400 text-xs mt-1">
                            Deploy this problem immediately to the cohort to close algorithmic knowledge gaps.
                        </DialogDescription>
                    </DialogHeader>

                    {assignError && <ErrorBanner message={assignError} />}
                    {assignSuccessMsg && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4" />
                            {assignSuccessMsg}
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">Problem Title</Label>
                            <Input
                                value={assignmentTitle}
                                onChange={(e) => setAssignmentTitle(e.target.value)}
                                placeholder="e.g. Coin Change"
                                className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-[#16161a] border-zinc-200 dark:border-zinc-800"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 block">Platform & Identifier / Slug</Label>
                            <div className="flex gap-2">
                                <span className={`h-9 px-3 rounded-xl flex items-center text-xs font-extrabold uppercase border ${
                                    assignmentPlatform === 'CODEFORCES'
                                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                }`}>
                                    {assignmentPlatform}
                                </span>
                                <Input
                                    value={assignmentSlug}
                                    onChange={(e) => setAssignmentSlug(e.target.value)}
                                    placeholder="e.g. coin-change"
                                    className="h-9 text-xs rounded-xl flex-1 bg-zinc-50 dark:bg-[#16161a] border-zinc-200 dark:border-zinc-800"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Submission Deadline</Label>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickExtend(3)}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-[#5b4fff]/10 hover:text-[#5b4fff] transition-colors"
                                    >
                                        +3 Days
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQuickExtend(7)}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-[#5b4fff]/10 hover:text-[#5b4fff] transition-colors"
                                    >
                                        +7 Days
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <CalendarBlankIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="datetime-local"
                                    value={assignmentDeadline}
                                    onChange={(e) => setAssignmentDeadline(e.target.value)}
                                    className="pl-9 h-9 text-xs rounded-xl bg-zinc-50 dark:bg-[#16161a] border-zinc-200 dark:border-zinc-800"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setAssignModalOpen(false)}
                            disabled={isAssigning}
                            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmAssign}
                            disabled={isAssigning}
                            className="bg-linear-to-b from-[#5b4fff] to-[#4639e6] hover:from-[#6c61ff] hover:to-[#5044ea] text-white rounded-xl text-xs font-semibold shadow-sm"
                        >
                            {isAssigning ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <LightningIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Deploy Assignment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}