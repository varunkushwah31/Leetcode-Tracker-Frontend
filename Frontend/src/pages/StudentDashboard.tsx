//test to run cicd pipeline
import { useEffect, useState } from "react";
import { Loader2, Terminal, LogOut, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";
import { StudentService } from "../services/endpoints";
import type { StudentExtendedDTO, AssignmentDTO } from "@/types";

import { ProfileStats } from "../components/dashboard/student/ProfileStats";
import { ActivityHeatmap } from "../components/dashboard/student/ActivityHeatmap";
import { PendingAssignments } from "../components/dashboard/student/PendingAssignments";
import { ClassroomList } from "../components/dashboard/student/ClassroomList";
import { BadgesList } from "../components/dashboard/student/BadgesList";
import { StudentRightSidebar } from "../components/dashboard/student/StudentRightSidebar";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useClassroomWebSocket } from "@/hooks/useClassroomWebSocket.ts";

export function StudentDashboard() {
  const { logout, user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentExtendedDTO | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(
    null,
  );

  const fetchDashboard = async () => {
    try {
      const response = await StudentService.getDashboard();
      setDashboardData(response.data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setIsLoading(false);
    }
  };

  // When a ping is received, it calls fetchDashboardData to silently update the UI.
  useClassroomWebSocket(selectedClassroomId, () => {
    console.log("Auto-refreshing Student Dashboard...");
    fetchDashboard();
  });

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const handleSync = async () => {
    if (!dashboardData?.leetcodeUsername) return;
    setIsSyncing(true);
    try {
      const response = await StudentService.syncProfile(
        dashboardData.leetcodeUsername,
      );
      setDashboardData(response.data);
    } catch {
      alert("Failed to sync with LeetCode.");
    } finally {
      setIsSyncing(false);
    }
  };

  const isAssignmentCompleted = (assignment: AssignmentDTO) => {
    if (dashboardData?.manuallyCompletedAssignments?.includes(assignment.id))
      return true;
    return !!dashboardData?.recentSubmissions?.some(
      (sub) =>
        sub.titleSlug === assignment.titleSlug &&
        sub.timestamp >= assignment.startTimestamp &&
        sub.timestamp <= assignment.endTimestamp,
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-500" />
          <p className="font-medium text-zinc-500 dark:text-zinc-400">
            Decrypting LeetCode stats...
          </p>
        </div>
      </div>
    );
  }

  const easyCount =
    dashboardData?.problemStats?.find((s) => s.difficulty === "Easy")?.count ||
    0;
  const medCount =
    dashboardData?.problemStats?.find((s) => s.difficulty === "Medium")
      ?.count || 0;
  const hardCount =
    dashboardData?.problemStats?.find((s) => s.difficulty === "Hard")?.count ||
    0;
  const totalSolved = easyCount + medCount + hardCount || 1;
  const rating = Math.round(dashboardData?.currentContestRating || 0);

  const pendingAssignments: {
    classroomId: string;
    className: string;
    assignment: AssignmentDTO;
  }[] = [];
  dashboardData?.classrooms?.forEach((cls) => {
    if (selectedClassroomId && cls.id !== selectedClassroomId) return;
    cls.assignments?.forEach((assignment) => {
      if (!isAssignmentCompleted(assignment)) {
        pendingAssignments.push({
          classroomId: cls.id!,
          className: cls.className,
          assignment,
        });
      }
    });
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] pb-12 transition-colors duration-200">
      <header className="bg-white dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* SWAPPED TROPHY FOR TERMINAL */}
            <div className="bg-[#2563eb] p-2 rounded-lg">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              LeetTracker
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="hidden sm:flex border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-zinc-500" />
              ) : (
                <Activity className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-400" />
              )}
              <span>Sync Profile</span>
            </Button>

            <ThemeToggle />

            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />
            <div className="flex items-center gap-3">
              <Avatar className="border border-zinc-200 dark:border-zinc-700">
                <AvatarImage src={dashboardData?.avatarUrl} />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                  {user?.name?.substring(0, 2) || "ST"}
                </AvatarFallback>
              </Avatar>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {dashboardData?.name || user?.name}
                </p>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  @{dashboardData?.leetcodeUsername || "student"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:bg-red-50 dark:hover:bg-rose-500/10 hover:text-red-600 dark:hover:text-rose-400 text-zinc-500 dark:text-zinc-400"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileStats
          data={dashboardData}
          totalSolved={totalSolved}
          rating={rating}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <ActivityHeatmap progressHistory={dashboardData?.progressHistory} />
            <PendingAssignments
              assignments={pendingAssignments}
              isSyncing={isSyncing}
              onSync={handleSync}
              selectedClassroomId={selectedClassroomId}
              onClearFilter={() => setSelectedClassroomId(null)}
            />
            <ClassroomList
              classrooms={dashboardData?.classrooms}
              selectedClassroomId={selectedClassroomId}
              onSelectClassroom={setSelectedClassroomId}
            />
          </div>

          <div className="space-y-8">
            <StudentRightSidebar
              data={dashboardData}
              totalSolved={totalSolved}
            />
            <BadgesList badges={dashboardData?.badges} />
          </div>
        </div>
      </main>
    </div>
  );
}
