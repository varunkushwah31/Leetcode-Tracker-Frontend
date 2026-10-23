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
    SparkleIcon as Sparkles
} from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { SocialService } from '../../services/endpoints';
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
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#5b4fff]" />
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Peer-to-Peer Problem Study Hub</h3>
                            <p className="text-[11px] text-zinc-500">
                                Ask friends for hints without spoiling, share pattern insights, and practice curated questions together
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4 h-9 gap-1.5 shadow-sm cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Share Note or Ask Hint
                    </Button>
                </div>

                {/* Topic Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {topics.map((t) => (
                        <button
                            type="button"
                            key={t}
                            onClick={() => setSelectedTopic(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                selectedTopic === t
                                    ? 'bg-[#5b4fff] text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main: Peer Study Posts (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <ChatCircleDots className="w-4 h-4 text-[#5b4fff]" /> Peer Discussions & Notes ({posts.length})
                        </h4>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
                            <p className="text-xs font-medium text-zinc-500">Loading discussions...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
                            <Sparkles className="w-6 h-6 text-[#5b4fff] mx-auto" />
                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No study notes on {selectedTopic} yet</p>
                            <p className="text-xs text-zinc-500">Be the first to share a hint or solution pattern for your peers!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isExpanded = !!expandedReplies[post.id];

                                return (
                                    <div
                                        key={post.id}
                                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs space-y-3.5 hover:border-[#5b4fff]/30 transition-all"
                                    >
                                        {/* Post Author & Type */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-9 h-9 border border-zinc-200 dark:border-zinc-700">
                                                    <AvatarImage src={post.authorAvatarUrl} />
                                                    <AvatarFallback className="bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-bold">
                                                        {post.authorName.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                                        {post.authorName} <span className="font-normal text-zinc-400">@{post.authorHandle || 'coder'}</span>
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400">
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <Badge
                                                className={
                                                    post.type === 'HINT_REQUEST'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]'
                                                        : post.type === 'SOLUTION_INSIGHT'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                                        : 'bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/20 text-[10px]'
                                                }
                                            >
                                                {post.type.replace(/_/g, ' ')}
                                            </Badge>
                                        </div>

                                        {/* Problem Banner if present */}
                                        {post.problemTitle && (
                                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 text-xs">
                                                <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                                    {post.problemTitle}
                                                </span>
                                                {post.problemLink && (
                                                    <a
                                                        href={post.problemLink}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[#5b4fff] hover:underline flex items-center gap-1 text-[11px] font-semibold"
                                                    >
                                                        Solve <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Title & Content */}
                                        <div className="space-y-1.5 text-xs">
                                            <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{post.title}</h4>
                                            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                {post.content}
                                            </p>
                                        </div>

                                        {/* Approach & Complexity tags */}
                                        {(post.approach || post.timeComplexity) && (
                                            <div className="flex flex-wrap gap-2 text-[11px]">
                                                {post.approach && (
                                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                        Approach: <strong className="text-zinc-800 dark:text-zinc-200">{post.approach}</strong>
                                                    </span>
                                                )}
                                                {post.timeComplexity && (
                                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                        Time: <strong className="text-zinc-800 dark:text-zinc-200">{post.timeComplexity}</strong>
                                                    </span>
                                                )}
                                                {post.spaceComplexity && (
                                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                        Space: <strong className="text-zinc-800 dark:text-zinc-200">{post.spaceComplexity}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Bar (Like, Replies count, Expand) */}
                                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleLike(post.id)}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                                        post.userLiked
                                                            ? 'bg-[#5b4fff]/15 text-[#5b4fff] border-[#5b4fff]/30 font-bold'
                                                            : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
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
                                                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                                                >
                                                    {post.replies?.length || 0} Peer Hints / Replies
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Replies & Reply Input */}
                                        {isExpanded && (
                                            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-200">
                                                {post.replies && post.replies.length > 0 && (
                                                    <div className="space-y-2">
                                                        {post.replies.map((reply) => (
                                                            <div
                                                                key={reply.id}
                                                                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-zinc-900 dark:text-white">
                                                                        {reply.authorName}
                                                                    </span>
                                                                    <span className="text-[10px] text-zinc-400">
                                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                                                    {reply.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Add reply input */}
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Provide a hint or ask a clarifying question..."
                                                        value={replyInputs[post.id] || ''}
                                                        onChange={(e) =>
                                                            setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') void handleAddReply(post.id);
                                                        }}
                                                        className="h-8.5 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-xs rounded-xl"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddReply(post.id)}
                                                        disabled={isReplyingId === post.id}
                                                        className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white h-8.5 px-3 rounded-xl cursor-pointer"
                                                    >
                                                        {isReplyingId === post.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Send className="w-3.5 h-3.5" />
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

                {/* Sidebar: Curated Practice Problems */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" /> Curated {selectedTopic} Problems
                        </h4>
                    </div>

                    <div className="space-y-2.5">
                        {curatedProblems.length === 0 ? (
                            <p className="text-xs text-zinc-500">No practice problems cataloged for this topic.</p>
                        ) : (
                            curatedProblems.map((prob) => (
                                <div
                                    key={prob.titleSlug}
                                    className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs space-y-2 hover:border-[#5b4fff]/40 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{prob.title}</h5>
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] font-bold mt-1 ${
                                                    prob.difficulty === 'Easy'
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : prob.difficulty === 'Medium'
                                                        ? 'text-amber-600 dark:text-amber-400'
                                                        : 'text-rose-600 dark:text-rose-400'
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
                                            title="Solve on LeetCode"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                        <a
                                            href={prob.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 text-center py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            Practice
                                        </a>
                                        {onChallengePvp && (
                                            <button
                                                type="button"
                                                onClick={() => onChallengePvp()}
                                                className="flex-1 text-center py-1 rounded-lg text-[11px] font-semibold bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] hover:bg-[#5b4fff]/25 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                            >
                                                <Swords className="w-3 h-3" /> Duel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Post Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#5b4fff]" /> Share Study Note or Ask Hint
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Post a peer question, non-spoiler hint, or algorithm technique for your friends.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-3">
                        {/* Type Picker */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPostType('HINT_REQUEST')}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    postType === 'HINT_REQUEST'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                💡 Ask for a Hint
                                <span className="block font-normal text-[10px] text-zinc-400 mt-0.5">Need a nudge without full code</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('SOLUTION_INSIGHT')}
                                className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                    postType === 'SOLUTION_INSIGHT'
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                🚀 Share Solution Pattern
                                <span className="block font-normal text-[10px] text-zinc-400 mt-0.5">Key pattern or optimization</span>
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Title</label>
                            <Input
                                placeholder="e.g. Stuck on base case for Coin Change / Pattern for Daily Temperatures"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Problem Title & Link</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Problem Name (e.g. Coin Change)"
                                    value={problemTitle}
                                    onChange={(e) => setProblemTitle(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
                                />
                                <Input
                                    placeholder="Problem URL"
                                    value={problemLink}
                                    onChange={(e) => setProblemLink(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-9 text-xs rounded-xl"
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
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-8.5 text-xs rounded-xl"
                                />
                                <Input
                                    placeholder="Time (e.g. O(N))"
                                    value={timeComplexity}
                                    onChange={(e) => setTimeComplexity(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-8.5 text-xs rounded-xl"
                                />
                                <Input
                                    placeholder="Space (e.g. O(1))"
                                    value={spaceComplexity}
                                    onChange={(e) => setSpaceComplexity(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 h-8.5 text-xs rounded-xl"
                                />
                            </div>
                        )}

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl text-xs h-9 cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreatePost}
                                disabled={isSubmitting || !title.trim() || !content.trim()}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4 h-9 shadow-sm cursor-pointer"
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
