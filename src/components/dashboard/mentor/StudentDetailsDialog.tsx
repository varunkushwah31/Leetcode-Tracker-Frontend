import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { StudentService } from '../../../services/endpoints';
import type { StudentExtendedDTO } from '../../../types';

// Reusing our existing Student Dashboard components!
import { ProfileStats } from '../student/ProfileStats';
import { ActivityHeatmap } from '../student/ActivityHeatmap';
import { StudentRightSidebar } from '../student/StudentRightSidebar';

interface StudentDetailsDialogProps {
    username: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StudentDetailsDialog({ username, open, onOpenChange }: StudentDetailsDialogProps) {
    const [data, setData] = useState<StudentExtendedDTO | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 1. Handle the "closed" or "empty" state immediately
        if (!open || !username) {
            setData(null);
            return;
        }

        // 2. Define an async function for the fetch
        const fetchStudentProfile = async () => {
            setLoading(true); // Now safe from the linter
            try {
                const res = await StudentService.getExtendedProfile(username);
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch student details", err);
            } finally {
                setLoading(false);
            }
        };

        // 3. Call the function
        fetchStudentProfile();
        
    }, [open, username]);

    // Calculations for the reused components
    const easyCount = data?.problemStats?.find(s => s.difficulty === 'Easy')?.count || 0;
    const medCount = data?.problemStats?.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardCount = data?.problemStats?.find(s => s.difficulty === 'Hard')?.count || 0;
    const totalSolved = (easyCount + medCount + hardCount) || 1;
    const rating = Math.round(data?.currentContestRating || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-50">
                <DialogHeader className="flex flex-row items-start justify-between pb-4">
                    <div>
                        <DialogTitle className="text-2xl font-bold">Student Insight</DialogTitle>
                        <DialogDescription>Deep dive into {username}'s LeetCode statistics.</DialogDescription>
                    </div>
                    {data && (
                        <Button asChild variant="outline" className="mr-6 border-blue-200 text-blue-600 hover:bg-blue-50">
                            <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer">
                                Open LeetCode Profile <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        </Button>
                    )}
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-500 font-medium">Loading student profile...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-6 pb-6">
                        {/* 1. Top Stats Banner */}
                        <ProfileStats data={data} totalSolved={totalSolved} rating={rating} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* 2. Activity Heatmap */}
                                <ActivityHeatmap progressHistory={data.progressHistory} />
                            </div>
                            <div>
                                {/* 3. Difficulty Breakdown & Recent Submissions */}
                                <StudentRightSidebar data={data} totalSolved={totalSolved} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center text-slate-500">
                        Failed to load student data. They may need to sync their profile.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}