import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import {
    CheckCircleIcon as CheckCircle,
    ArrowsClockwiseIcon as RefreshCw,
    LinkSimpleIcon as Link2,
    ShieldCheckIcon as ShieldCheck,
    SpinnerIcon as Loader2,
    ClockIcon as Clock,
    LightningAIcon,
} from '@phosphor-icons/react';

interface ClassroomGuidanceCardProps {
    onSync?: () => void;
    isSyncing?: boolean;
}

export function ClassroomGuidanceCard({ onSync, isSyncing = false }: Readonly<ClassroomGuidanceCardProps>) {
    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Coursework Guidelines
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="space-y-3.5">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                            <LightningAIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">Auto-Verification</p>
                            <p className="mt-0.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                                Solve problems with your linked LeetCode or Codeforces account. Submissions are synced automatically.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">One-Click Validation</p>
                            <p className="mt-0.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                                Click <strong className="text-zinc-800 dark:text-zinc-200">Auto-Verify</strong> on any problem to check your latest submissions instantly.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                            <Link2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">Direct URL Submissions</p>
                            <p className="mt-0.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                                Solved a problem in a contest? Use <strong className="text-zinc-800 dark:text-zinc-200">Submit Link</strong> to paste your submission URL directly.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-zinc-900 dark:text-white">Deadlines & Streaks</p>
                            <p className="mt-0.5 leading-relaxed text-zinc-500 dark:text-zinc-400">
                                Complete assignments before the scheduled deadline to preserve your consistency streaks.
                            </p>
                        </div>
                    </div>
                </div>

                {onSync && (
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/60">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSync}
                            disabled={isSyncing}
                            className="w-full text-xs font-semibold h-8.5 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl cursor-pointer"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-emerald-600 dark:text-emerald-400" /> Syncing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Sync Profile & Coursework
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
