import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { ExternalLink, Flame, Trophy } from 'lucide-react';
import type { StudentExtendedDTO } from '@/types';

interface ProfileStatsProps {
 data: StudentExtendedDTO | null;
 totalSolved: number;
 rating: number;
}

export function ProfileStats({ data, totalSolved, rating }: ProfileStatsProps) {
 if (!data) return null;

 return (
 <div className="mb-10 relative">
 {/* Ambient glow behind profile */}
 <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-75 h-75 bg-[#5b4fff] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
 <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-75 h-75 bg-emerald-500 opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

 <Card className="relative z-10 bg-[#111111]/60 backdrop-blur-3xl border-zinc-800/50 shadow-2xl overflow-hidden rounded-[2rem]">
 {/* Gradient subtle top border */}
 <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#5b4fff]/50 to-transparent"></div>
 
 <CardContent className="p-8 sm:p-10">
 <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
 
 {/* Avatar with pulsing glow */}
 <div className="relative group">
 <div className="absolute inset-0 bg-[#5b4fff] rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
 <Avatar className="w-28 h-28 border-[3px] border-[#1a1b2e] ring-4 ring-[#5b4fff]/20 shadow-2xl relative z-10">
 <AvatarImage src={data.avatarUrl} className="object-cover" />
 <AvatarFallback className="bg-linear-to-br from-[#1a1b2e] to-[#2a2b4e] text-[#968fff] text-3xl font-bold">
 {data.name?.substring(0, 2) || 'ST'}
 </AvatarFallback>
 </Avatar>
 <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-zinc-700 p-1.5 rounded-full z-20 shadow-lg">
 <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
 </div>
 </div>

 <div className="flex-1 w-full text-center md:text-left">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
 <div>
 <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400 tracking-tight mb-1">
 {data.name || 'Student'}
 </h2>
 <div className="flex items-center justify-center md:justify-start gap-2">
 <p className="text-lg font-medium text-[#968fff]">@{data.leetcodeUsername}</p>
 <a href={`https://leetcode.com/${data.leetcodeUsername}`} target="_blank" rel="noopener noreferrer"
 className="text-zinc-500 hover:text-white transition-colors p-1.5 bg-zinc-800/50 rounded-md hover:bg-[#5b4fff] group">
 <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
 </a>
 </div>
 </div>
 
 <div className="inline-flex items-center gap-2 bg-[#1a1b2e]/60 border border-[#5b4fff]/20 px-4 py-2 rounded-full">
 <Flame className="w-4 h-4 text-orange-500" />
 <span className="text-sm font-bold text-white"><span className="text-orange-400 mr-1.5">{data.consistencyStreak || 0}</span>Day Streak</span>
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
 <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
 <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <p className="text-sm font-medium text-zinc-400 mb-2">Global Rank</p>
 <p className="text-3xl font-black text-white tracking-tight flex items-center">
 <Trophy className="w-6 h-6 text-amber-500 mr-2 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
 {data.rank ? `#${parseInt(data.rank).toLocaleString()}` : 'N/A'}
 </p>
 </div>
 
 <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
 <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <p className="text-sm font-medium text-zinc-400 mb-2">Total Solved</p>
 <p className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] tracking-tight">
 {totalSolved}
 </p>
 </div>
 
 <div className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl hover:bg-zinc-800/40 transition-colors group relative overflow-hidden">
 <div className="absolute inset-0 bg-linear-to-br from-[#5b4fff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
 <p className="text-sm font-medium text-zinc-400 mb-2">Contest Rating</p>
 <p className="text-3xl font-black text-[#968fff] drop-shadow-[0_0_12px_rgba(150,143,255,0.3)] tracking-tight">
 {rating}
 </p>
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}