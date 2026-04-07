import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { LogOut, ExternalLink, RefreshCw, Trophy, TrendingUp, Calendar, CheckCircle2, Flame, Award, Loader2, BookOpen, Target, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { useAuth } from '../context/AuthContext';
import { StudentService } from '../services/endpoints';
import type { StudentExtendedDTO, AssignmentDTO, ProgressRecord } from '../types';

const formatLeetcodeDate = (timestamp: number | string): string => {
    if (!timestamp) return 'Unknown Date';
    if (typeof timestamp === 'number') return new Date(timestamp * 1000).toLocaleDateString();
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    return 'Invalid Date';
};

// FIXED: The missing closing logic for the heatmap generator
const generateHeatmapDays = (progressHistory: ProgressRecord[]) => {
    const days = [];
    const today = new Date();
    const progressMap: Record<string, number> = {};
    
    progressHistory?.forEach(record => {
        const dateStr = typeof record.date === 'object' ? record.date.$date : record.date as string;
        const localDate = new Date(dateStr).toISOString().split('T')[0];
        progressMap[localDate] = record.questionSolved;
    });

    // The loop that was accidentally deleted
    for (let i = 83; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        days.push({ date: dateKey, count: progressMap[dateKey] || 0 });
    }
    return days;
};

const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-100';
    if (count <= 2) return 'bg-emerald-200';
    if (count <= 5) return 'bg-emerald-400';
    if (count <= 8) return 'bg-emerald-600';
    return 'bg-emerald-800';
};

const getDaysUntilDue = (dueTimestamp: number) => {
    const today = new Date();
    const due = new Date(dueTimestamp * 1000);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-rose-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-amber-600' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-amber-600' };
    return { text: `${diffDays} days left`, color: 'text-slate-600' };
};

export function StudentDashboard() {
  const { logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentExtendedDTO | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDashboard = async () => {
      try {
          const response = await StudentService.getDashboard();
          setDashboardData(response.data);
      } catch (err) {
          console.error('Failed to load dashboard data.');
          console.log(err);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleSync = async () => {
    if (!dashboardData?.leetcodeUsername) return;
    setIsSyncing(true);
    try {
        const response = await StudentService.syncProfile(dashboardData.leetcodeUsername);
        setDashboardData(response.data);
    } catch (err) {
        console.log(err);
        alert("Failed to sync with LeetCode. Please try again later.");
    } finally {
        setIsSyncing(false);
    }
  };

  const isAssignmentCompleted = (assignment: AssignmentDTO) => {
    if (dashboardData?.manuallyCompletedAssignments?.includes(assignment.id)) return true;
    const autoCompleted = dashboardData?.recentSubmissions?.some(sub => 
        sub.titleSlug === assignment.titleSlug && sub.timestamp >= assignment.startTimestamp && sub.timestamp <= assignment.endTimestamp
    );
    return !!autoCompleted;
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="flex flex-col items-center space-y-4"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p className="font-medium text-slate-500">Decrypting LeetCode stats...</p></div></div>;
  }

  const easyStats = dashboardData?.problemStats?.find(s => s.difficulty === 'Easy') || { count: 0, beatsPercentage: 0 };
  const medStats = dashboardData?.problemStats?.find(s => s.difficulty === 'Medium') || { count: 0, beatsPercentage: 0 };
  const hardStats = dashboardData?.problemStats?.find(s => s.difficulty === 'Hard') || { count: 0, beatsPercentage: 0 };
  const totalSolved = (easyStats.count + medStats.count + hardStats.count) || 1; 
  const rating = Math.round(dashboardData?.currentContestRating || 0);
  const heatmapDays = generateHeatmapDays(dashboardData?.progressHistory || []);

  const pendingAssignments: { classroomId: string, className: string, assignment: AssignmentDTO }[] = [];
  dashboardData?.classrooms?.forEach(cls => {
      cls.assignments?.forEach(assignment => {
          if (!isAssignmentCompleted(assignment)) {
              pendingAssignments.push({ classroomId: cls.id, className: cls.className, assignment });
          }
      });
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#2563eb] p-2 rounded-lg"><Trophy className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold text-slate-900">LeetTracker</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="border border-slate-200">
                  <AvatarImage src={dashboardData?.avatarUrl} />
                  <AvatarFallback className="bg-blue-50 text-blue-700 font-bold">{dashboardData?.name?.substring(0, 2) || 'ST'}</AvatarFallback>
                </Avatar>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{dashboardData?.name}</p>
                  <p className="text-xs font-medium text-slate-500">@{dashboardData?.leetcodeUsername}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-red-50 hover:text-red-600"><LogOut className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-slate-100 shadow-sm">
                <AvatarImage src={dashboardData?.avatarUrl} />
                <AvatarFallback className="bg-blue-50 text-blue-700 text-xl font-bold">{dashboardData?.name?.substring(0, 2) || 'ST'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">@{dashboardData?.leetcodeUsername}</h2>
                  <a href={`https://leetcode.com/${dashboardData?.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#2563eb] hover:text-[#1d4ed8]"><ExternalLink className="w-4 h-4" /></a>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Global Rank</p><p className="text-2xl font-bold text-slate-900">{dashboardData?.rank ? `#${parseInt(dashboardData.rank).toLocaleString()}` : 'N/A'}</p></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Total Solved</p><p className="text-2xl font-bold text-slate-900">{totalSolved}</p></div>
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Contest Rating</p><p className="text-2xl font-bold text-slate-900">{rating}</p></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> Streak</p>
                    <p className="text-2xl font-bold text-orange-600">{dashboardData?.consistencyStreak || 0} days</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Target className="w-5 h-5 text-emerald-500" /> Activity Heatmap</CardTitle>
                <CardDescription>Your solving activity over the last 12 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto pb-4">
                  <div className="inline-grid grid-rows-7 grid-flow-col gap-0.75">
                    {heatmapDays.map((day, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`w-3.5 h-3.5rounded-sm ${getIntensityColor(day.count)} transition-all hover:ring-2 hover:ring-slate-400 cursor-crosshair`} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium text-sm">{day.date}</p>
                            <p className="text-xs text-slate-300">{day.count} {day.count === 1 ? 'problem' : 'problems'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-blue-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5 text-blue-600" /> Pending Assignments</CardTitle>
                  <CardDescription className="mt-1">Assigned by your mentors</CardDescription>
                </div>
                <Button onClick={handleSync} disabled={isSyncing} variant="outline" className="bg-white">
                  <RefreshCw className={`w-4 h-4 mr-2 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Auto-Sync'}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {pendingAssignments.map((item, idx) => {
                    const dueInfo = getDaysUntilDue(item.assignment.endTimestamp);
                    return (
                      <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex justify-between items-center">
                          <div>
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 mb-2 uppercase tracking-wider text-[10px] font-bold">{item.className}</Badge>
                              <h4 className="text-lg font-bold text-slate-900">{item.assignment.titleSlug}</h4>
                              <div className="flex items-center gap-1.5 mt-2 text-sm">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span className={`font-medium ${dueInfo.color}`}>{dueInfo.text}</span>
                              </div>
                          </div>
                          <Button asChild className="bg-blue-600 hover:bg-blue-700">
                              <a href={item.assignment.questionLink} target="_blank" rel="noopener noreferrer">
                                  Solve <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                          </Button>
                      </div>
                    );
                  })}
                  {pendingAssignments.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
                        <p className="mt-1">You have no pending assignments right now.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5 text-slate-700" /> My Classrooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    {dashboardData?.classrooms?.map(cls => (
                        <div key={cls.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                            <div>
                                <p className="font-bold text-slate-900">{cls.className}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">{cls.assignments?.length || 0} Total Assignments</p>
                            </div>
                            <TrendingUp className="w-5 h-5 text-slate-400" />
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="shadow-sm border-slate-200">
              <CardHeader><CardTitle className="text-lg">Difficulty Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Easy</span>
                    <span className="font-bold text-[#10b981]">{easyStats.count} <span className="text-slate-400 font-medium ml-1">({easyStats.beatsPercentage}% beats)</span></span>
                  </div>
                  <Progress value={(easyStats.count / totalSolved) * 100} className="h-2.5 bg-emerald-100 [&>div]:bg-[#10b981]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Medium</span>
                    <span className="font-bold text-[#f59e0b]">{medStats.count} <span className="text-slate-400 font-medium ml-1">({medStats.beatsPercentage}% beats)</span></span>
                  </div>
                  <Progress value={(medStats.count / totalSolved) * 100} className="h-2.5 bg-amber-100 [&>div]:bg-[#f59e0b]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Hard</span>
                    <span className="font-bold text-[#f43f5e]">{hardStats.count} <span className="text-slate-400 font-medium ml-1">({hardStats.beatsPercentage}% beats)</span></span>
                  </div>
                  <Progress value={(hardStats.count / totalSolved) * 100} className="h-2.5 bg-rose-100 [&>div]:bg-[#f43f5e]" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Award className="w-5 h-5 text-[#f59e0b]" /> Earned Badges</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {dashboardData?.badges?.slice(0,6).map((badge, index) => (
                    <div key={index} className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-xl text-center group">
                      <img src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} alt={badge.title} className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 object-contain" />
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider leading-tight line-clamp-2">{badge.title}</span>
                    </div>
                  ))}
                  {(!dashboardData?.badges || dashboardData.badges.length === 0) && (
                      <p className="col-span-2 text-center text-sm font-medium text-slate-400 py-4">No badges earned yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5 text-blue-500" /> Recent Submissions</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64">
                  <div className="divide-y divide-slate-100">
                    {dashboardData?.recentSubmissions?.slice(0,10).map((sub, idx) => (
                      <a key={idx} href={sub.questionLink} target="_blank" rel="noreferrer" className="flex flex-col p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3 min-w-0">
                                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
                                <p className="text-sm font-bold text-slate-900 truncate">{sub.title}</p>
                            </div>
                            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{formatLeetcodeDate(sub.timestamp)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}