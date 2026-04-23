import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Award } from 'lucide-react';
import type { Badge } from '@/types';

export function BadgesList({ badges }: { badges?: Badge[] }) {
    return (
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-white">
                    <Award className="w-5 h-5 text-[#f59e0b]" /> Earned Badges
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    {badges?.slice(0, 6).map((badge, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-amber-50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl text-center group">
                            <img
                                src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
                                alt={badge.title}
                                className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 object-contain"
                            />
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider leading-tight line-clamp-2">
                                {badge.title}
                            </span>
                        </div>
                    ))}
                    {(!badges || badges.length === 0) && (
                        <p className="col-span-2 text-center text-sm font-medium text-zinc-400 dark:text-zinc-500 py-4">
                            No badges earned yet.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}