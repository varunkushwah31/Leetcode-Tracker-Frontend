import { useState, useEffect, useCallback } from 'react';
import {
    GraphIcon as Graph,
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
    GraduationCapIcon as GraduationCap,
    BrainIcon as Brain,
    TreeStructureIcon as TreeStructure,
    LightningIcon as Lightning,
    MagnifyingGlassIcon as Search,
    ArrowsLeftRightIcon as ArrowsLeftRight,
    CodeIcon,
    BooksIcon,
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
    onChallengePvp?: (friendId?: string, friendName?: string, customProblemTitle?: string, customProblemLink?: string) => void;
}

export function PeerStudyTab({ onChallengePvp }: Readonly<PeerStudyTabProps>) {
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
        setIsLoading(true);
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
        if (!text?.trim()) return;

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
        { name: 'Dynamic Programming', icon: Brain },
        { name: 'Tree', icon: TreeStructure },
        { name: 'Graph', icon: Graph },
        { name: 'Binary Search', icon: Search },
        { name: 'Two Pointers', icon: ArrowsLeftRight },
        { name: 'Greedy', icon: Lightning }
    ];

    const openCreateWithSuggestion = (type: PeerStudyPostType, initialPrompt: string) => {
        setPostType(type);
        setTitle(initialPrompt);
        setCreateDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header with Topic Filter & Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#5b4fff]/10 dark:bg-[#5b4fff]/15 border border-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] flex items-center justify-center shrink-0 shadow-sm ring-4 ring-[#5b4fff]/10">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                Peer-to-Peer Study Hub & Non-Spoiler Hints
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border border-[#5b4fff]/20">
                                Collaborative
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Ask friends for conceptual hints without full code spoilers, master key algorithmic paradigms, and practice together.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4 h-9 shadow-sm hover:shadow-md transition-all gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                    <Plus className="w-3.5 h-3.5" /> Share Note or Ask Hint
                </Button>
            </div>

            {/* Topic Selector Segmented Bar */}
            <div className="p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto custom-scrollbar shadow-2xs">
                {topics.map((t) => {
                    const isSelected = selectedTopic === t.name;
                    const IconComponent = t.icon;
                    return (
                        <button
                            type="button"
                            key={t.name}
                            onClick={() => setSelectedTopic(t.name)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-black border border-emerald-500/30'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span>{t.name}</span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Main: Peer Study Posts (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <ChatCircleDots className="w-4 h-4 text-[#5b4fff]" /> Discussions & Non-Spoiler Notes ({posts.length})
                        </h4>
                        <span className="text-xs font-semibold text-zinc-400">Topic: <strong className="text-zinc-700 dark:text-zinc-300">{selectedTopic}</strong></span>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <Loader2 className="w-10 h-10 animate-spin text-[#5b4fff]" />
                            <p className="text-xs font-bold text-zinc-500">Loading study discussions...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="p-10 sm:p-12 rounded-3xl bg-white dark:bg-[#111114]/90 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-sm text-center space-y-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#5b4fff]/10 text-[#5b4fff] flex items-center justify-center mx-auto shadow-inner">
                                <Lightbulb className="w-7 h-7" />
                            </div>
                            <div className="space-y-1.5 max-w-md mx-auto">
                                <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                                    No Discussions on {selectedTopic} Yet
                                </h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    Be the first to post! Ask for a high-level nudge without getting code spoiled, or share a pattern breakthrough that helped you conquer this topic.
                                </p>
                            </div>

                            {/* Suggested Starter Prompts */}
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openCreateWithSuggestion('HINT_REQUEST', `Hint needed for ${selectedTopic} state definition`)}
                                    className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-[#5b4fff]/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#5b4fff] border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                                >
                                    Ask for a hint without full code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => openCreateWithSuggestion('SOLUTION_INSIGHT', `Key algorithmic pattern for ${selectedTopic}`)}
                                    className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-[#5b4fff]/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#5b4fff] border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                                >
                                    Share key pattern insight
                                </button>
                            </div>

                            <div>
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-5 h-9.5 gap-2 shadow-sm hover:shadow-md hover:shadow-[#5b4fff]/20 transition-all cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" /> Start First Discussion
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isExpanded = !!expandedReplies[post.id];
                                const isSpoilerRevealed = !!revealedSpoilers[post.id];

                                return (
                                    <div
                                        key={post.id}
                                        className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#111114]/90 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs space-y-4 hover:border-[#5b4fff]/40 transition-all"
                                    >
                                        {/* Post Author & Type Badge */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-10 h-10 border-2 border-zinc-200 dark:border-zinc-700 shadow-xs">
                                                    <AvatarImage src={post.authorAvatarUrl} />
                                                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
                                                        {post.authorName.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                                        {post.authorName}{' '}
                                                        <span className="text-zinc-500 dark:text-zinc-400">
                                                            @{post.authorHandle || 'coder'}
                                                        </span>
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400">
                                                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <Badge
                                                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                                                    post.type === 'HINT_REQUEST'
                                                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                                                        : post.type === 'SOLUTION_INSIGHT'
                                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                                                        : 'bg-[#5b4fff]/10 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/25'
                                                }`}
                                            >
                                                {post.type.replaceAll('_', ' ')}
                                            </Badge>
                                        </div>

                                        {/* Problem Context Banner */}
                                        {post.problemTitle && (
                                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate tracking-tight">
                                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                                                    <span className="truncate">{post.problemTitle}</span>
                                                </span>
                                                {post.problemLink && (
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <a
                                                            href={post.problemLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-[#5b4fff] hover:underline flex items-center gap-1 text-[11px] font-bold"
                                                        >
                                                            Solve Problem <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                        {onChallengePvp && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onChallengePvp(undefined, undefined, post.problemTitle, post.problemLink)}
                                                                className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#5b4fff]/10 hover:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] transition-colors flex items-center gap-1 cursor-pointer"
                                                            >
                                                                <Swords className="w-3 h-3" /> Duel
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Title & Content */}
                                        <div className="space-y-1.5">
                                            <h4 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm tracking-tight leading-snug">
                                                {post.title}
                                            </h4>
                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                {post.content}
                                            </p>
                                        </div>

                                        {/* Non-Spoiler Guard for Approach & Complexity */}
                                        {(post.approach || post.timeComplexity) && (
                                            <div className="p-4 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
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

                                                <div className={`transition-all duration-300 ${!isSpoilerRevealed ? 'blur-xs select-none opacity-40' : ''}`}>
                                                    <div className="flex flex-wrap gap-2 text-xs">
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

                                                {/* Reply Composer */}
                                                <div className="flex items-center gap-2 pt-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Provide a non-spoiler hint or comment..."
                                                        value={replyInputs[post.id] || ''}
                                                        onChange={(e) =>
                                                            setReplyInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') void handleAddReply(post.id);
                                                        }}
                                                        className="h-9.5 text-xs bg-zinc-50 dark:bg-zinc-900/60 rounded-xl"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAddReply(post.id)}
                                                        disabled={isReplyingId === post.id || !replyInputs[post.id]?.trim()}
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
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <CodeIcon  className="w-4 h-4 text-amber-500" /> Curated {selectedTopic} Problems
                        </h4>
                        <span className="text-xs text-zinc-400 font-medium">{curatedProblems.length} available</span>
                    </div>

                    <div className="space-y-3">
                        {curatedProblems.length === 0 ? (
                            <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs text-zinc-500">
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
                                        className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111114]/80 backdrop-blur-3xl border border-zinc-200/90 dark:border-zinc-800/70 shadow-xs hover:border-[#5b4fff]/50 hover:shadow-lg dark:hover:shadow-[#5b4fff]/10 transition-all space-y-3.5 group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1.5 min-w-0">
                                                <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white truncate group-hover:text-[#5b4fff] transition-colors">
                                                    {formattedTitle}
                                                </h5>
                                                <Badge
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
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
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>

                                        {/* Action buttons with high visual clarity */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                            <a
                                                href={prob.link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-center cursor-pointer"
                                            >
                                                <span>Practice</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                            {onChallengePvp ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onChallengePvp(undefined, undefined, formattedTitle, prob.link)}
                                                    className="py-1.5 px-3 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:border-[#5b4fff] text-zinc-700 dark:text-zinc-300 hover:text-[#5b4fff] hover:bg-[#5b4fff]/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center"
                                                >
                                                    <Swords className="w-3.5 h-3.5" />
                                                    <span>Duel</span>
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Educational Companion Card */}
                        <div className="p-5 rounded-3xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 text-xs space-y-2 text-zinc-500 dark:text-zinc-400">
                            <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <BooksIcon  className="w-3.5 h-3.5 text-amber-500" /> Non-Spoiler Study Tip
                            </p>
                            <p className="text-[11px] leading-relaxed">
                                Struggling on a problem? Post the subproblem transition or recurrence relation you are stuck on. Peers can suggest base case adjustments without spoiling the full implementation!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Peer Study Post Modal */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                            Share Note or Ask Non-Spoiler Hint
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500">
                            Topic: <strong className="text-[#5b4fff]">{selectedTopic}</strong>. Foster collaborative learning without spoiling complete solutions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {/* Type Picker */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setPostType('HINT_REQUEST')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    postType === 'HINT_REQUEST'
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                Hint Request
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('SOLUTION_INSIGHT')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    postType === 'SOLUTION_INSIGHT'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                Pattern Insight
                            </button>
                            <button
                                type="button"
                                onClick={() => setPostType('STUDY_NOTE')}
                                className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    postType === 'STUDY_NOTE'
                                        ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/30'
                                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                            >
                                Study Note
                            </button>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="peer-study-title" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">
                                Post Title *
                            </label>
                            <Input
                                id="peer-study-title"
                                placeholder="E.g., How to identify state variables for 2D Grid DP?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-9.5 text-xs rounded-xl"
                            />
                        </div>

                        {/* Optional Problem Details */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="peer-study-problem-name" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">
                                    Problem Name (Optional)
                                </label>
                                <Input
                                    id="peer-study-problem-name"
                                    placeholder="E.g., Coin Change II"
                                    value={problemTitle}
                                    onChange={(e) => setProblemTitle(e.target.value)}
                                    className="h-9.5 text-xs rounded-xl"
                                />
                            </div>
                            <div>
                                <label htmlFor="peer-study-problem-url" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">
                                    Problem URL (Optional)
                                </label>
                                <Input
                                    id="peer-study-problem-url"
                                    placeholder="https://leetcode.com/problems/..."
                                    value={problemLink}
                                    onChange={(e) => setProblemLink(e.target.value)}
                                    className="h-9.5 text-xs rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label htmlFor="peer-study-content" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1 block">
                                Explanation or Question *
                            </label>
                            <textarea
                                id="peer-study-content"
                                rows={3}
                                placeholder="Describe what you tried, what edge case fails, or your key observation..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b4fff]/40"
                            />
                        </div>

                        {/* Approach & Complexity (Hidden under spoiler on post) */}
                        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                                Optional Spoiler Tagged Details (Hidden Behind Click)
                            </span>
                            <Input
                                placeholder="Approach hint: E.g., Reverse iteration from target"
                                value={approach}
                                onChange={(e) => setApproach(e.target.value)}
                                className="h-8.5 text-xs rounded-xl bg-white dark:bg-zinc-800"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Time: O(N*M)"
                                    value={timeComplexity}
                                    onChange={(e) => setTimeComplexity(e.target.value)}
                                    className="h-8.5 text-xs rounded-xl bg-white dark:bg-zinc-800"
                                />
                                <Input
                                    placeholder="Space: O(N)"
                                    value={spaceComplexity}
                                    onChange={(e) => setSpaceComplexity(e.target.value)}
                                    className="h-8.5 text-xs rounded-xl bg-white dark:bg-zinc-800"
                                />
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setCreateDialogOpen(false)}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreatePost}
                                disabled={isSubmitting || !title.trim() || !content.trim()}
                                className="bg-[#5b4fff] hover:bg-[#4d40ef] text-white rounded-xl text-xs font-bold px-4"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Posting...
                                    </>
                                ) : (
                                    'Publish Post'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
