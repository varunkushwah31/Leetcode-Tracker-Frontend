export interface DevScoreTier {
    tier: string;
    badgeClass: string;
    description: string;
}

export function getDevScoreTier(score = 500): DevScoreTier {
    if (score >= 820) {
        return {
            tier: 'Grandmaster',
            badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
            description: 'Elite competitive algorithmic mastery and high contest rating'
        };
    }
    if (score >= 750) {
        return {
            tier: 'Master',
            badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
            description: 'Advanced problem solver with deep multi-platform consistency'
        };
    }
    if (score >= 680) {
        return {
            tier: 'Expert',
            badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
            description: 'Proven algorithmic skill with strong contest performance'
        };
    }
    if (score >= 620) {
        return {
            tier: 'Advanced',
            badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
            description: 'Consistent problem solver with solid contest foundations'
        };
    }
    if (score >= 560) {
        return {
            tier: 'Proficient',
            badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
            description: 'Steadily solving problems and developing algorithmic habits'
        };
    }
    return {
        tier: 'Developing',
        badgeClass: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
        description: 'Beginning the competitive coding and data structures journey'
    };
}

export interface DevScoreCalculationInput {
    easySolved?: number;
    medSolved?: number;
    hardSolved?: number;
    codeforcesSolved?: number;
    leetcodeRating?: number;
    codeforcesRating?: number;
    streak?: number;
    pvpRating?: number;
    pvpWins?: number;
}

export function calculateDevScore(input: DevScoreCalculationInput): number {
    const easy = input.easySolved || 0;
    const med = input.medSolved || 0;
    const hard = input.hardSolved || 0;
    const cfSolved = input.codeforcesSolved || 0;
    const lcRating = input.leetcodeRating || 0;
    const cfRating = input.codeforcesRating || 0;
    const streak = input.streak || 0;
    const pvpRating = input.pvpRating || 1200;
    const pvpWins = input.pvpWins || 0;

    const dsaScore = Math.min(300, easy * 0.5 + med * 1.5 + hard * 3.0 + cfSolved * 1.0);
    const ratingScore = Math.min(350, Math.max(lcRating - 1000, 0) * 0.2 + Math.max(cfRating - 800, 0) * 0.15);
    const consistencyScore = Math.min(100, streak * 5.0);
    const pvpScore = Math.min(150, Math.max(pvpRating - 1000, 0) * 0.25 + pvpWins * 5.0);

    const totalBonus = (dsaScore + ratingScore + consistencyScore + pvpScore) * 0.4;
    const finalScore = Math.round(500 + totalBonus);
    return Math.min(900, Math.max(500, finalScore));
}

// Backward-compatibility aliases
export type CScoreTier = DevScoreTier;
export const getCScoreTier = getDevScoreTier;
export type CScoreCalculationInput = DevScoreCalculationInput;
export const calculateCScore = calculateDevScore;
