import { useState } from 'react';
import { LeetCodeRatingGraph } from './LeetCodeRatingGraph';
import { CodeforcesRatingGraph } from './CodeforcesRatingGraph';
import { ChartLineIcon, TrophyIcon } from '@phosphor-icons/react';
import type { ContestHistory, CodeforcesContestHistory } from '@/types';

interface ContestRatingsSectionProps {
    contestHistory?: ContestHistory[];
    currentContestRating?: number;
    globalRanking?: string;
    codeforcesContestHistory?: CodeforcesContestHistory[];
    codeforcesRating?: number;
    codeforcesMaxRating?: number;
    codeforcesRank?: string;
    codeforcesMaxRank?: string;
    className?: string;
}

export function ContestRatingsSection({
    contestHistory = [],
    currentContestRating = 0,
    globalRanking,
    codeforcesContestHistory = [],
    codeforcesRating = 0,
    codeforcesMaxRating,
    codeforcesRank,
    codeforcesMaxRank,
    className = ''
}: Readonly<ContestRatingsSectionProps>) {
    const [activeTab, setActiveTab] = useState<'all' | 'leetcode' | 'codeforces'>('all');

    const lcCount = contestHistory.length;
    const cfCount = codeforcesContestHistory.length;

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Section Header with View Mode Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#5b4fff]/10 text-[#968fff] border border-[#5b4fff]/20">
                        <ChartLineIcon className="w-5 h-5" weight="bold" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Contest Rating Progression</h2>
                        <p className="text-xs text-zinc-400">Track your competitive rating trends over time across platforms</p>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#141414]/80 p-1 rounded-xl border border-zinc-800/80 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            activeTab === 'all'
                                ? 'bg-zinc-800 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Both ({lcCount + cfCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('leetcode')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'leetcode'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                                : 'text-zinc-400 hover:text-amber-400'
                        }`}
                    >
                        <TrophyIcon className="w-3.5 h-3.5" />
                        LeetCode ({lcCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('codeforces')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'codeforces'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                                : 'text-zinc-400 hover:text-cyan-400'
                        }`}
                    >
                        <TrophyIcon className="w-3.5 h-3.5" />
                        Codeforces ({cfCount})
                    </button>
                </div>
            </div>

            {/* Graphs Layout */}
            <div className={`grid gap-6 items-stretch ${
                activeTab === 'all'
                    ? 'grid-cols-1 xl:grid-cols-2'
                    : 'grid-cols-1'
            }`}>
                {(activeTab === 'all' || activeTab === 'leetcode') && (
                    <LeetCodeRatingGraph
                        contestHistory={contestHistory}
                        currentContestRating={currentContestRating}
                        globalRanking={globalRanking}
                    />
                )}

                {(activeTab === 'all' || activeTab === 'codeforces') && (
                    <CodeforcesRatingGraph
                        contestHistory={codeforcesContestHistory}
                        currentRating={codeforcesRating}
                        maxRating={codeforcesMaxRating}
                        rank={codeforcesRank}
                        maxRank={codeforcesMaxRank}
                    />
                )}
            </div>
        </div>
    );
}
