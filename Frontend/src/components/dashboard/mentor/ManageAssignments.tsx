import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Trash2, ExternalLink, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { ClassroomService } from '@/services/endpoints';
import { ErrorBanner } from '../../ui/ErrorBanner';
import type { AssignmentDTO } from '@/types';

interface ManageAssignmentsProps {
    classroomId: string;
    mentorId: string;
    assignments?: AssignmentDTO[];
    onRefresh: () => void;
}

export function ManageAssignments({ classroomId, mentorId, assignments = [], onRefresh }: ManageAssignmentsProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (assignmentId: string) => {
        setError(null);
        setIsDeleting(assignmentId);
        try {
            await ClassroomService.deleteAssignment(classroomId, assignmentId, mentorId);
            onRefresh(); // Refresh dashboard to show updated list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsDeleting(null);
        }
    };

    const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleDateString();

    return (
        <Card className="shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-zinc-800/60 bg-[#111111]/85 backdrop-blur-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-transparent border-b border-zinc-800/60 pb-5">
                <CardTitle className="text-[22px] font-bold text-white tracking-tight">Manage Assignments</CardTitle>
                <CardDescription className="text-zinc-400 text-sm mt-1">Review active assignments and remove incorrect ones.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">

                <ErrorBanner message={error} className="mb-6" />

                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#1a1a1a]/40 border border-zinc-800/50 hover:bg-[#1a1a1a]/80 hover:border-zinc-700 rounded-xl transition-all gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold text-white tracking-tight">{assignment.titleSlug}</h4>
                                    <Badge variant="outline" className="bg-[#5b4fff]/10 text-[#968fff] border-[#5b4fff]/20 text-[10px] uppercase">Active</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
                                    <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> Due: {formatDate(assignment.endTimestamp)}</span>
                                    <a href={assignment.questionLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#5b4fff] hover:text-[#b4afff] transition-colors">
                                        View on LeetCode <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </div>
                            </div>

                            <Button
                                onClick={() => handleDelete(assignment.id)}
                                disabled={isDeleting === assignment.id}
                                variant="outline"
                                className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl"
                            >
                                {isDeleting === assignment.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                Remove
                            </Button>
                        </div>
                    ))}

                    {assignments.length === 0 && (
                        <div className="text-center py-12">
                            <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-zinc-300 tracking-tight">No Active Assignments</h3>
                            <p className="text-zinc-500 text-sm">Assign a question to this class to see it here.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}