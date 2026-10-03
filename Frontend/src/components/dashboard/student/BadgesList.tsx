import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { MedalIcon as Award } from '@phosphor-icons/react';
import type { Badge } from '@/types';

export function BadgesList({ badges }: Readonly<{ badges?: Badge[] }>) {
    return (
        <Card className="relative bg-white dark:bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800/50 shadow-sm dark:shadow-2xl rounded-2xl overflow-hidden transition-colors duration-200">
            <CardHeader className="border-b border-zinc-200/80 dark:border-zinc-800/60 pb-4">
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center">
                    <Award className="w-5 h-5 mr-2 text-amber-500" /> Earned Badges
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-3">
                    {badges?.slice(0, 6).map((badge, index) => (
                        <div
                            key={`${badge.title}-${badge.icon}-${index}`}
                            className="aspect-square bg-zinc-50 dark:bg-[#1a1b2e]/40 rounded-2xl flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800/60 p-2 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:scale-105 transition-all duration-200 group cursor-pointer"
                            title={badge.title}
                        >
                            <img
                                src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
                                alt={badge.title}
                                className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform group-hover:scale-110"
                            />
                        </div>
                    ))}
                    {(!badges || badges.length === 0) && (
                        <p className="col-span-3 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 py-6">
                            No badges earned yet.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}