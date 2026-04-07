import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Award } from 'lucide-react';
import type { Badge } from '../../../types';

export function BadgesList({ badges }: { badges?: Badge[] }) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5 text-[#f59e0b]" /> Earned Badges
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    {badges?.slice(0, 6).map((badge, index) => (
                        <div key={index} className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-xl text-center group">
                            <img 
                                src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`} 
                                alt={badge.title} 
                                className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 object-contain" 
                            />
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider leading-tight line-clamp-2">
                                {badge.title}
                            </span>
                        </div>
                    ))}
                    {(!badges || badges.length === 0) && (
                        <p className="col-span-2 text-center text-sm font-medium text-slate-400 py-4">
                            No badges earned yet.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}