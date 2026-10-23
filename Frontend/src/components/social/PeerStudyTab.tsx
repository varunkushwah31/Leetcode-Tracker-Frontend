import { useState, useEffect, useCallback } from 'react';
import {
    BookOpenIcon as BookOpen,
    LightbulbIcon as Lightbulb,
    ChatCircleDotsIcon as ChatCircleDots,
    ThumbsUpIcon as ThumbsUp,
    PaperPlaneRightIcon as Send,
    PlusIcon as Plus,
    ArrowSquareOutIcon as ExternalLink,
    SpinnerIcon as Loader2,
    SwordIcon as Swords,
    SparkleIcon as Sparkles,
    EyeIcon as Eye,
    EyeSlashIcon as EyeSlash,
    GraduationCapIcon as GraduationCap
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { SocialService } from '../../services/endpoints';
import { formatProblemTitle } from '@/lib/problemFormatter';
import type { PeerStudyPostDTO, CreatePeerStudyPostRequest, CuratedProblemItemDTO, PeerStudyPostType } from '@/types';

interface PeerStudyTabProps {
    onChallengePvp?: (friendId?: string, friendName?: string) => void;
}

export function PeerStudyTab({ onChallengePvp }: PeerStudyTabProps) {
    const [posts, setPosts] = useState<PeerStudyPostDTO[]>([]);
    const [curatedProblems, setCuratedProblems] = useState<CuratedProblemItemDTO[]>([]);
    const [selectedTopic, setSelectedTopic] = useState('Dynamic Programming');
    const [isLoading, setIsLoading] = useState(true);

    // Create Post Dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [postType, setPostType] = useState<PeerStudyPostType>('HINT_REQUEST');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [problemTitle, setProblemTitle] = useState('');
    const [problemLink, setProblemLink] = useState('');
    const [approach, setApproach] = useState('');
    const [timeComplexity, setTimeComplexity] = useState('');
    const [spaceComplexity, setSpaceComplexity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reply state per post
    const [replyInputs, setReplyInputs] = useState<{ [postId: string]: string }>({});
    const [expandedReplies, setExpandedReplies] = useState<{ [postId: string]: boolean }>({});
    const [isReplyingId, setIsReplyingId] = useState<string | null>(null);

    // Spoiler reveal state per post for approaches/hints
    const [revealedSpoilers, setRevealedSpoilers] = useState<{ [postId: string]: boolean }>({});

    const loadData = useCallback(async () => {
        try {
            const [postsRes, problemsRes] = await Promise.all([
                SocialService.getPeerStudyPosts(selectedTopic),
                SocialService.getCuratedProblems(selectedTopic)
            ]);
            setPosts(postsRes.data || []);
            setCuratedProblems(problemsRes.data || []);
        } catch (err) {
            console.error('Failed to load peer study data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedTopic]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleCreatePost = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSubmitting(true);
        try {
            const req: CreatePeerStudyPostRequest = {
                type: postType,
                title: title.trim(),
                content: content.trim(),
                problemTitle: problemTitle.trim() || undefined,
                problemLink: problemLink.trim() || undefined,
                topic: selectedTopic,
                approach: approach.trim() || undefined,
                timeComplexity: timeComplexity.trim() || undefined,
                spaceComplexity: spaceComplexity.trim() || undefined
            };

            await SocialService.createPeerStudyPost(req);
            setCreateDialogOpen(false);
            setTitle('');
            setContent('');
            setProblemTitle('');
            setProblemLink('');
            setApproach('');
            setTimeComplexity('');
            setSpaceComplexity('');
            void loadData();
        } catch (err) {
            console.error('Failed to create peer study post:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddReply = async (postId: string) => {
        const text = replyInputs[postId];
        if (!text || !text.trim()) return;

        setIsReplyingId(postId);
        try {
            const res = await SocialService.addPeerStudyReply(postId, text.trim());
            setPosts(prev => prev.map(p => (p.id === postId ? res.data : p)));
            setReplyInputs(prev => ({ ...prev, [postId]: '' }));
            setExpandedReplies(prev => ({ ...prev, [postId]: true }));
        } catch (err) {
            console.error('Failed to add reply:', err);
        } finally {
            setIsReplyingId(null);
        }
    };

    const handleToggleLike = async (postId: string) => {
        try {
            const res = await SocialService.likePeerStudyPost(postId);
            setPosts(prev => prev.map(p => (p.id === postId ? res.data : p)));
        } catch (err) {
            console.error('Failed to like post:', err);
        }
    };

    const toggleSpoiler = (postId: string) => {
        setRevealedSpoilers(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const topics = [
        'Dynamic Programming',
        'Tree',
        'Graph',
        'Binary Search',
        'Two Pointers',
        'Greedy'
    ];

    return (
        <div className="space-y-6">
            {/* Header with Topic Filter & Create Button */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/60 shadow-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#5b4fff]/50 to-transparent pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff]">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                                Peer-to-Peer Study Hub & Non-Spoiler Hints
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Ask friends for hints without code spoilers, master key algorithms, and practice curated problem sets together.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4.5 h-10 gap-2 shadow-md hover:shadow-lg hover:shadow-[#5b4fff]/20 transition-all cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Share Note or Ask Hint
                    </Button>
                </div>

                {/* Topic Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {topics.map((t) => {
                        const isSelected = selectedTopic === t;
                        return (
                            <button
                                type="button"
                                key={t}
                                onClick={() => setSelectedTopic(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-[#5b4fff] text-white shadow-sm ring-2 ring-[#5b4fff]/30'
                                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700/80'
                                }`}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main: Peer Study Posts (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <ChatCircleDots className="w-4 h-4 text-[#5b4fff]" /> Peer Discussions & Hints ({posts.length})
                        </h4>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                            <p className="text-xs font-semibold text-zinc-500">Loading study discussions...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-12 rounded-3xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mx-auto">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    No study notes on {selectedTopic} yet
                                </p>
                                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                    Be the first to ask a hint or share an algorithmic pattern for your peer study group!
                                </p>
                            </div>
                            <Button
                                onClick={() => setCreateDialogOpen(true)}
                                variant="outline"
                                className="rounded-xl text-xs font-bold mt-2"
                            >
                                <Plus className="w-4 h-4 mr-1.5" /> Start Discussion
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isExpanded = !!expandedReplies[post.id];
                                const isSpoilerRevealed = !!revealedSpoilers[post.id];

                                return (
                                    <div
                                        key={post.id}
                                        className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-xs space-y-4 hover:border-[#5b4fff]/40 transition-all"
                                    >
                                        {/* Post Author & Type Badge */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-700">
                                                    <AvatarImage src={post.authorAvatarUrl} />
                                                    <AvatarFallback className="bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 text-[#5b4fff] text-xs font-bold">
                                                        {post.authorName.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                                        {post.authorName}{' '}
                                                        <span className="font-medium text-zinc-400">
                                                            @{post.authorHandle || 'coder'}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400">
                                                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <Badge
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                                                    post.type === 'HINT_REQUEST'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                        : post.type === 'SOLUTION_INSIGHT'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                        : 'bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/20'
                                                }`}
                                            >
                                                {post.type.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>

                                        {/* Problem Context Banner */}
                                        {post.problemTitle && (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate">
                                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <span className="truncate">{post.problemTitle}</span>
                                                </span>
                                                {post.problemLink && (
                                                    <a
                                                        href={post.problemLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[#5b4fff] hover:underline flex items-center gap-1 text-[11px] font-bold shrink-0 ml-2"
                                                    >
                                                        Solve Problem <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Title & Content */}
                                        <div className="space-y-1.5">
                                            <h4 className="font-extrabold text-zinc-900 dark:text-white text-sm">
                                                {post.title}
                                            </h4>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                {post.content}
                                            </p>
                                        </div>

                                        {/* Non-Spoiler Guard for Approach & Complexity */}
                                        {(post.approach || post.timeComplexity) && (
                                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                        Algorithm Approach & Complexity
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSpoiler(post.id)}
                                                        className="text-[11px] font-bold text-[#5b4fff] dark:text-[#968fff] hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        {isSpoilerRevealed ? (
                                                            <>
                                                                <EyeSlash className="w-3.5 h-3.5" /> Hide Spoiler
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye className="w-3.5 h-3.5" /> Reveal Hint Spoiler
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                <div className={`transition-all duration-300 ${!isSpoilerRevealed ? 'blur-xs select-none' : ''}`}>
                                                    <div className="flex flex-wrap gap-2 text-[11px]">
                                                        {post.approach && (
                                                            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium">
                                                                Approach:{' '}
                                                                <strong className="text-zinc-900 dark:text-white font-bold ml-1">
                                                                    {post.approach}
                                                                </strong>
                                                            </span>
                                                        )}
                                                        {post.timeComplexity && (
                                                            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium">
                                                                Time:{' '}
                                                                <strong className="text-zinc-900 dark:text-white font-bold ml-1">
                                                                    {post.timeComplexity}
                                                                </strong>
                                                            </span>
                                                        )}
                                                        {post.spaceComplexity && (
                                                            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium">
                                                                Space:{' '}
                                                                <strong className="text-zinc-900 dark:text-white font-bold ml-1">
                                                                    {post.spaceComplexity}
                                                                </strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Bar (Helpful Like, Replies toggle) */}
                                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleLike(post.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
                                                        post.userLiked
                                                            ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/30 font-bold'
                                                            : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-[#5b4fff]/40'
                                                    }`}
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                    <span>Helpful {post.likeCount > 0 && `(${post.likeCount})`}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpandedReplies(prev => ({ ...prev, [post.id]: !prev[post.id] }))
                                                    }
                                                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-bold cursor-pointer text-xs"
                                                >
                                                    {post.replies?.length || 0} Comments / Answers
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Replies Thread */}
                                        {isExpanded && (
                                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                                                {post.replies && post.replies.length > 0 && (
                                                    <div className="space-y-2.5">
                                                        {post.replies.map((reply) => (
                                                            <div
                                                                key={reply.id}
                                                                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 text-xs space-y-1.5"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-zinc-900 dark:text-white">
                                                                        {reply.authorName}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-400">
                                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                                    {reply.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add reply input */}
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Provide a peer hint or ask a clarifying question..."
                                                        value={replyInputs[post.id] || ''}
                                                        onChange={(e) =>
                                                            setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') void handleAddReply(post.id);
                                                        }}
                                                        className="h-9.5 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700 text-xs rounded-xl"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddReply(post.id)}
                                                        disabled={isReplyingId === post.id}
                                                        className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white h-9.5 px-3.5 rounded-xl cursor-pointer"
                                                    >
                                                        {isReplyingId === post.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Send className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar: Curated Practice Problems (1 col) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Curated {selectedTopic} Problems
                        </h4>
                    </div>

                    <div className="space-y-3">
                        {curatedProblems.length === 0 ? (
                            <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs text-zinc-500">
                                No practice problems cataloged for this topic.
                            </div>
                        ) : (
                            curatedProblems.map((prob) => {
                                const formattedTitle = prob.title || formatProblemTitle(prob.titleSlug);
                                const isEasy = prob.difficulty === 'Easy';
                                const isMed = prob.difficulty === 'Medium';

                                return (
                                    <div
                                        key={prob.titleSlug}
                                        className="p-4 rounded-2xl bg-white dark:bg-[#111111]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-xs hover:border-[#5b4fff]/50 hover:shadow-lg dark:hover:shadow-[#5b4fff]/10 transition-all space-y-3 group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <h5 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-[#5b4fff] transition-colors">
                                                    {formattedTitle}
                                                </h5>
                                                <Badge
                                                    className={`text-[9px] font-bold px-2 py-0.2 rounded-md border ${
                                                        isEasy
                                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                            : isMed
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    }`}
                                                >
                                                    {prob.difficulty}
                                                </Badge>
                                            </div>

                                            <a
                                                href={prob.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-zinc-400 hover:text-[#5b4fff] transition-colors p-1"
                                                title="Open on LeetCode"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>

                                        {/* Action buttons with high visual clarity */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                            <a
                                                href={prob.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1 text-center"
                                            >
                                                <span>Practice</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            {onChallengePvp ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onChallengePvp()}
                                                    className="py-1.5 px-2 rounded-xl text-[11px] font-bold bg-[#5b4fff] hover:bg-[#4d40ef] text-white shadow-xs hover:shadow-[#5b4fff]/20 transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
                                                >
                                                    <Swords className="w-3 h-3" />
                                                    <span>Duel</span>
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Create Post Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#5b4fff]" /> Share Study Note or Ask Hint
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Post an algorithmic question, non-spoiler hint, or design pattern for your peer network.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-3">
                        {/* Type Picker */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPostType('HINT_REQUEST')}
                                className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    postType === 'HINT_REQUEST'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Lightbulb className="w-4 h-4 text-amber-500" /> Ask for a Hint
                                </span>
                                <span className="block font-normal text-[10px] text-zinc-400 mt-0.5">Need a hint without full spoiler</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('SOLUTION_INSIGHT')}
                                className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    postType === 'SOLUTION_INSIGHT'
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-emerald-500" /> Share Solution Pattern
                                </span>
                                <span className="block font-normal text-[10px] text-zinc-400 mt-0.5">Core pattern & complexity</span>
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Title</label>
                            <Input
                                placeholder="e.g. Stuck on base case for Coin Change / Pattern for Daily Temperatures"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9.5 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Problem Title & Link</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Problem Name (e.g. Coin Change)"
                                    value={problemTitle}
                                    onChange={(e) => setProblemTitle(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9.5 text-xs rounded-xl"
                                />
                                <Input
                                    placeholder="Problem URL"
                                    value={problemLink}
                                    onChange={(e) => setProblemLink(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9.5 text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Your Notes / Hint Details</label>
                            <textarea
                                rows={4}
                                placeholder="Write your question, insights, or hints here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white resize-none"
                            />
                        </div>

                        {postType === 'SOLUTION_INSIGHT' && (
                            <div className="grid grid-cols-3 gap-2">
                                <Input
                                    placeholder="Approach (e.g. DP)"
                                    value={approach}
                                    onChange={(e) => setApproach(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                                />
                                <Input
                                    placeholder="Time (e.g. O(N))"
                                    value={timeComplexity}
                                    onChange={(e) => setTimeComplexity(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                                />
                                <Input
                                    placeholder="Space (e.g. O(1))"
                                    value={spaceComplexity}
                                    onChange={(e) => setSpaceComplexity(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                                />
                            </div>
                        )}

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl text-xs h-9.5 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreatePost}
                                disabled={isSubmitting || !title.trim() || !content.trim()}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-5 h-9.5 shadow-md cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Note'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
