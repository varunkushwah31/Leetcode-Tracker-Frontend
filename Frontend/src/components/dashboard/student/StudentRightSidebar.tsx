import type { StudentExtendedDTO } from '@/types';
import { UnifiedContestHistory } from './UnifiedContestHistory';
import { DifficultyBreakdownCard } from './DifficultyBreakdownCard';
import { RecentActivityCard } from './RecentActivityCard';

export function StudentRightSidebar({ data, totalSolved }: Readonly<{
    data: StudentExtendedDTO | null;
    totalSolved: number;
}>) {
    return (
        <div className="space-y-8 min-w-0">
            <RecentActivityCard data={data} />
            <UnifiedContestHistory
                contestHistory={data?.contestHistory}
                codeforcesContestHistory={data?.codeforcesContestHistory}
            />
            <DifficultyBreakdownCard data={data} totalSolved={totalSolved} />
        </div>
    );
}

export { DifficultyBreakdownCard, RecentActivityCard, UnifiedContestHistory };
