import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Award } from 'lucide-react';
import type { Badge } from '@/types';

export function BadgesList({ badges }: { badges?: Badge[] }) {
 return (
 <Card className="relative bg-[#0a0a0a]/60 backdrop-blur-2xl border border-zinc-800/50 shadow-2xl rounded-2xl overflow-hidden">
 <CardHeader>
 <CardTitle className="flex items-center justify-between text-lg text-white tracking-tight">
 <div className="flex items-center gap-2">
 <Award className="w-5 h-5 text-[#f59e0b]"/> Earned Badges
 </div>
 {badges && badges.length > 0 && (
 <span className="text-xs font-black text-amber-500/80 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">{badges.length}</span>
 )}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 gap-3">
 {badges?.slice(0, 6).map((badge, index) => (
 <div key={index} className="flex flex-col items-center justify-center p-4 bg-linear-to-br from-amber-950/20 to-orange-950/10 border border-amber-900/30 rounded-xl text-center group">
 <img
 src={badge.icon.startsWith('http') ? badge.icon : `https://leetcode.com${badge.icon}`}
 alt={badge.title}
 className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 object-contain"
 />
 <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider leading-tight line-clamp-2">
 {badge.title}
 </span>
 </div>
 ))}
 {(!badges || badges.length === 0) && (
 <p className="col-span-2 text-center text-sm font-medium text-zinc-400 py-4">
 No badges earned yet.
 </p>
 )}
 </div>
 </CardContent>
 </Card>
 );
}