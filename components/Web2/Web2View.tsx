import React, { useState, useRef, useEffect } from 'react';
import { SITE_STRUCTURE, CONTENT_DB, MOCK_PROFILES } from '../../constants';
import { InteractionState, UserPost, Comment, UserProfile } from '../../types';
import { UserProfileView } from './UserProfile';
import { AttachmentDisplay, CommentTree, HazardOctagon, getPostStats, CensoredWrapper } from '../SharedComponents';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Search, Bell, Plus, Send, ChevronDown, Image as ImageIcon, Share2, Bookmark, Hash, UserPlus, Shield, Bot, Globe, Users, Lock, Paperclip, AlertTriangle } from 'lucide-react';

interface Web2ViewProps {
    openReader: (key: string) => void;
    interactions: InteractionState;
    onVote: (key: string, direction: 1 | -1) => void;
    onComment: (key: string, text: string, image?: string, parentId?: string, tags?: string[]) => void;
    userPosts: UserPost[];
    onOpenPostModal: (data?: {title?: string, body?: string, category?: string}) => void;
    onOpenSpinOff: (postId: string, commentId: string) => void;
}

const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const ALLOWED_FILE_TYPES = "image/*,application/pdf,.pdf,application/zip,.zip,.rar,application/x-rar-compressed,text/x-python,.py,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.tif,.tiff";

interface SaveDropdownProps {
    isSaved: boolean;
    onToggleSave: () => void;
    category: string;
}

const SaveDropdown: React.FC<SaveDropdownProps> = ({ isSaved, onToggleSave, category }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [alwaysAsk, setAlwaysAsk] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMainClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isNSFW = category === 'Dark Arts' || category === 'nsfw';
        if (isSaved) { onToggleSave(); return; }
        if (alwaysAsk || isNSFW) { setIsOpen(!isOpen); } 
        else { onToggleSave(); }
    };

    const handleOptionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSave();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                className={`flex items-center gap-1 hover:bg-white/10 p-2 octo-btn transition-colors ${isSaved ? 'text-yellow-500' : ''}`}
                onClick={handleMainClick}
            >
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? 'Saved' : 'Save'}
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-bg-card border border-border-custom shadow-xl octo-clip z-50 flex flex-col animate-fade-in">
                    <div className="bg-bg-core/50 p-2 border-b border-border-custom text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        Save To...
                    </div>
                    <button onClick={handleOptionClick} className="px-4 py-2 text-left hover:bg-accent hover:text-white flex items-center gap-2 text-xs"><Globe size={12} /> Public</button>
                    <button onClick={handleOptionClick} className="px-4 py-2 text-left hover:bg-accent hover:text-white flex items-center gap-2 text-xs"><Users size={12} /> Followers</button>
                    <button onClick={handleOptionClick} className="px-4 py-2 text-left hover:bg-accent hover:text-white flex items-center gap-2 text-xs"><Lock size={12} /> Private</button>
                    <div className="border-t border-border-custom p-2 bg-bg-core/30 flex items-center gap-2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setAlwaysAsk(!alwaysAsk); }}>
                        <div className={`w-3 h-3 border border-text-secondary rounded-sm ${alwaysAsk ? 'bg-accent border-accent' : ''}`}></div>
                        <span className="text-[10px] text-text-secondary">Ask every time</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Web2View: React.FC<Web2ViewProps> = ({ openReader, interactions, onVote, onComment, userPosts, onOpenPostModal, onOpenSpinOff }) => {
    const [activeTab, setActiveTab] = useState('Club');
    const [sortBy, setSortBy] = useState<'Hot' | 'New' | 'Top'>('Hot');
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [commentImages, setCommentImages] = useState<Record<string, string>>({}); 
    const [commentHazard, setCommentHazard] = useState<Record<string, boolean>>({});
    
    // View State (Feed vs Profile)
    const [viewingProfile, setViewingProfile] = useState<string | null>(null);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyFile, setReplyFile] = useState<string | null>(null);

    // Feature State
    const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const toggleComments = (key: string) => {
        setExpandedComments(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    const toggleSave = (id: string) => {
        setSavedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                triggerToast("Post removed from bookmarks");
            } else {
                next.add(id);
                triggerToast("Post saved to bookmarks");
            }
            return next;
        });
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        triggerToast("Link copied to clipboard!");
    };

    const handleFileSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCommentImages(prev => ({ ...prev, [key]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = (key: string) => {
        setCommentImages(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        const input = document.getElementById(`file-input-${key}`) as HTMLInputElement;
        if(input) input.value = '';
    };

    const handleCommentSubmit = (key: string) => {
        const text = commentInputs[key];
        const image = commentImages[key];
        const isHazard = commentHazard[key] || false;
        
        if ((text && text.trim()) || image) {
            onComment(key, text || '', image, undefined, isHazard ? ['nsfw'] : []);
            setCommentInputs(prev => ({ ...prev, [key]: '' }));
            setCommentHazard(prev => ({ ...prev, [key]: false }));
            clearImage(key);
        }
    };

    const handleReplySubmit = (postKey: string, parentId: string, tags?: string[]) => {
        if (!replyText.trim() && !replyFile) return;
        onComment(postKey, replyText, replyFile || undefined, parentId, tags);
        setReplyingTo(null);
        setReplyText('');
        setReplyFile(null);
    };

    const handleUserClick = (username: string) => {
        if (MOCK_PROFILES[username]) {
            setViewingProfile(username);
        } else {
            triggerToast("Profile not found (Mock Data Limit)");
        }
    };

    // --- PROFILE VIEW RENDER ---
    if (viewingProfile && MOCK_PROFILES[viewingProfile]) {
        return (
            <div className="w-full h-screen overflow-y-auto bg-bg-core text-text-primary font-main relative">
                 <style>{`
                    .octo-clip { clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); }
                    .octo-btn { clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }
                    .octo-tag { clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px); }
                    .octo-avatar { clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
                 `}</style>
                <UserProfileView 
                    profile={MOCK_PROFILES[viewingProfile]} 
                    userPosts={userPosts.filter(p => p.author === viewingProfile)} 
                    onBack={() => setViewingProfile(null)}
                    interactions={interactions}
                    onVote={onVote}
                    onComment={onComment}
                    openReader={openReader}
                />
            </div>
        );
    }

    // --- FEED VIEW RENDER LOGIC ---

    const renderFeed = () => {
        let posts: any[] = [];
        const sectionData = SITE_STRUCTURE[activeTab];

        if (!sectionData) return <div>Section not found.</div>;

        const createPost = (key: string, sub: string) => {
            const content = CONTENT_DB[key];
            const interaction = interactions[key] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            const title = content ? content.title : key;
            const body = content ? content.body.replace(/<[^>]*>?/gm, '') : "";
            return {
                id: key, title: title, body: body, sub: `r/${sub}`, author: 'admin', key: key, ...interaction
            };
        };

        const createResourcePost = (item: any, sub: string) => {
            const interaction = interactions[item.title] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            return {
                id: item.title, title: item.title, body: item.desc, sub: `r/${sub.replace(/\s/g,'')}`, author: 'mod', key: item.title, ...interaction
            };
        };

        const createUserPostObject = (p: UserPost) => {
            const interaction = interactions[p.id] || { votes: 0, userVote: 0, comments: [], timestamp: p.timestamp };
            return {
                id: p.id, title: p.title, body: p.body, sub: `r/${p.category}`, author: p.author, key: p.id, image: p.image, tags: p.tags, ...interaction
            };
        }

        if (sectionData.type === 'single' && sectionData.key) {
            const post = createPost(sectionData.key, activeTab);
            if (post) posts.push(post);
        } else if (sectionData.type === 'list' && sectionData.items) {
            sectionData.items.forEach((key: string) => {
                const post = createPost(key, activeTab);
                if (post) posts.push(post);
            });
        } else if (sectionData.type === 'grouped' && sectionData.groups) {
            Object.entries(sectionData.groups).forEach(([groupName, items]) => {
                (items as any[]).forEach(item => posts.push(createResourcePost(item, groupName)));
            });
        }

        userPosts.filter(p => p.category === activeTab).forEach(p => posts.push(createUserPostObject(p)));

        if (posts.length === 0) return <div className="p-4 text-center text-text-secondary">No posts in this community yet.</div>;

        posts.sort((a, b) => {
            if (sortBy === 'New') return b.timestamp - a.timestamp;
            if (sortBy === 'Top') return b.votes - a.votes;
            const getHotScore = (post: any) => {
                const hours = (Date.now() - post.timestamp) / (1000 * 60 * 60);
                return (post.votes + 1) / Math.pow(hours + 2, 1.5);
            };
            return getHotScore(b) - getHotScore(a);
        });

        return posts.map(post => {
            const isUpvoted = post.userVote === 1;
            const isDownvoted = post.userVote === -1;
            const hasImage = !!commentImages[post.key];
            const isSaved = savedPosts.has(post.id);
            const isCensored = post.tags?.includes('nsfw') || post.tags?.includes('dark_arts');
            
            // Truncation Logic
            const TRUNCATE_LIMIT = 141;
            const shouldTruncate = post.body.length > TRUNCATE_LIMIT;

            const countComments = (comments: Comment[]): number => {
                return comments.reduce((acc, c) => acc + 1 + (c.replies ? countComments(c.replies) : 0), 0);
            };
            const totalComments = countComments(post.comments);
            
            // Calculate Stats for Octagon
            const postStats = getPostStats(post.comments);

            return (
                <div 
                    key={post.id}
                    className="group relative mb-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                    {/* Border / Hover Gradient Background */}
                    <div className="absolute inset-0 bg-border-custom group-hover:bg-accent octo-clip transition-colors"></div>
                    
                    {/* Content Container */}
                    <div className="relative p-[1px] m-[1px] bg-bg-card octo-clip h-[calc(100%-2px)] w-[calc(100%-2px)] flex flex-col">
                        <div className="flex bg-bg-card octo-clip h-full w-full">
                            <div className="w-10 bg-black/10 border-r border-border-custom flex flex-col items-center py-2 gap-1 text-text-secondary font-bold text-sm">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onVote(post.key, 1); }}
                                    className={`p-1 transition-all duration-200 active:scale-75 focus:outline-none ${isUpvoted ? 'text-orange-500 scale-110 bg-orange-500/10' : 'hover:text-orange-500 hover:bg-black/10'}`}
                                >
                                    <ArrowBigUp size={24} fill={isUpvoted ? "currentColor" : "none"} className={`transition-all duration-300 ${isUpvoted ? 'drop-shadow-[0_0_5px_rgba(249,115,22,0.6)]' : ''}`} />
                                </button>
                                <span 
                                    key={post.votes}
                                    className={`${isUpvoted ? 'text-orange-500' : isDownvoted ? 'text-indigo-500' : ''}`}
                                    style={{ animation: 'votePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                                >
                                    {post.votes}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onVote(post.key, -1); }}
                                    className={`p-1 transition-all duration-200 active:scale-75 focus:outline-none ${isDownvoted ? 'text-indigo-500 scale-110 bg-indigo-500/10' : 'hover:text-indigo-500 hover:bg-black/10'}`}
                                >
                                    <ArrowBigDown size={24} fill={isDownvoted ? "currentColor" : "none"} className={`transition-all duration-300 ${isDownvoted ? 'drop-shadow-[0_0_5px_rgba(99,102,241,0.6)]' : ''}`} />
                                </button>
                            </div>

                            <div className="flex-1 p-2 cursor-pointer bg-bg-card" onClick={() => !post.id.startsWith('post-') && openReader(post.key)}>
                                <div className="flex gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-text-secondary mb-1 flex items-center gap-1 flex-wrap">
                                            <span className="font-bold text-text-primary">{post.sub}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2">
                                                Posted by u/
                                                <span className="hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUserClick(post.author); }}>
                                                    {post.author}
                                                </span>
                                                {post.author === 'admin' && <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 font-bold octo-tag flex items-center gap-1 tracking-wider"><Shield size={8} fill="currentColor" /> ADMIN</span>}
                                                {post.author === 'mod' && <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 font-bold octo-tag flex items-center gap-1 tracking-wider"><Shield size={8} fill="currentColor" /> MOD</span>}
                                                {post.author === 'system_daemon' && <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 font-bold octo-tag flex items-center gap-1 tracking-wider"><Bot size={8} fill="currentColor" /> BOT</span>}
                                            </span>
                                            <span>•</span>
                                            <span>{timeAgo(post.timestamp)}</span>
                                            {isCensored && <span className="text-[9px] text-red-500 border border-red-500 px-1 rounded uppercase font-bold">NSFW</span>}
                                        </div>
                                        <div className="text-lg font-semibold mb-2 text-text-primary">{post.title}</div>
                                        
                                        <CensoredWrapper isCensored={isCensored} type="post">
                                            <div className="text-sm text-text-secondary mb-2 whitespace-pre-wrap">
                                                {shouldTruncate ? `${post.body.substring(0, TRUNCATE_LIMIT)}` : post.body}
                                                {shouldTruncate && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); openReader(post.key); }}
                                                        className="ml-2 inline-flex items-center gap-1 bg-bg-core border border-border-custom px-2 py-0.5 text-[10px] uppercase font-bold text-accent hover:bg-accent hover:text-white transition-colors octo-btn"
                                                    >
                                                        ...Continue <ChevronDown size={10} className="-rotate-90"/>
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {post.image && (
                                                <div className="mb-4">
                                                    <AttachmentDisplay data={post.image} className="w-full" />
                                                </div>
                                            )}
                                        </CensoredWrapper>

                                        <div className="flex gap-2 text-xs font-bold text-text-secondary">
                                            <button 
                                                className="flex items-center gap-1 hover:bg-white/10 p-2 octo-btn transition-colors"
                                                onClick={(e) => { e.stopPropagation(); toggleComments(post.key); }}
                                            >
                                                <MessageSquare size={16}/> {totalComments} Comments
                                            </button>
                                            
                                            <button 
                                                className="flex items-center gap-1 hover:bg-white/10 p-2 octo-btn transition-colors group"
                                                onClick={handleShare}
                                            >
                                                <Share2 size={16} className="group-active:scale-90 transition-transform" /> Share
                                            </button>

                                            <SaveDropdown 
                                                isSaved={isSaved} 
                                                onToggleSave={() => toggleSave(post.id)} 
                                                category={post.sub}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Post Indicator - Attached Right */}
                                    {postStats.count > 0 && (
                                        <div className="pt-2">
                                            <HazardOctagon 
                                                count={postStats.count} 
                                                depth={postStats.depth} 
                                                contributors={postStats.contributors} 
                                                hasHazard={postStats.hasHazard}
                                                onClick={(e) => { e.stopPropagation(); toggleComments(post.key); }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {expandedComments[post.key] && (
                            <div className="bg-bg-core/30 border-t border-border-custom p-4 animate-fade-in">
                                {commentImages[post.key] && (
                                    <div className="mb-2">
                                        <AttachmentDisplay data={commentImages[post.key]} className="max-w-xs" onClear={() => clearImage(post.key)} />
                                    </div>
                                )}

                                <div className="flex gap-2 mb-4 items-end">
                                    <div>
                                        <input 
                                            type="file" 
                                            id={`file-input-${post.key}`}
                                            accept={ALLOWED_FILE_TYPES}
                                            className="hidden"
                                            onChange={(e) => handleFileSelect(post.key, e)}
                                        />
                                        <button 
                                            onClick={() => document.getElementById(`file-input-${post.key}`)?.click()}
                                            className={`p-2.5 octo-btn border border-border-custom transition-colors ${hasImage ? 'text-accent bg-accent/10 border-accent' : 'bg-bg-core text-text-secondary hover:text-text-primary'}`}
                                            title="Add Attachment"
                                        >
                                            <Paperclip size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 p-[1px] bg-border-custom octo-btn focus-within:bg-accent transition-colors">
                                        <input 
                                            type="text" 
                                            className="w-full bg-bg-core px-3 py-2 text-sm outline-none octo-btn text-text-primary placeholder:text-text-secondary/50"
                                            placeholder="What are your thoughts?"
                                            value={commentInputs[post.key] || ''}
                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.key]: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.key)}
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setCommentHazard(prev => ({ ...prev, [post.key]: !prev[post.key] }))}
                                        className={`p-2 octo-btn border border-border-custom transition-colors ${commentHazard[post.key] ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-bg-core text-text-secondary hover:text-red-500'}`}
                                        title="Mark Sensitive"
                                    >
                                        <AlertTriangle size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleCommentSubmit(post.key)}
                                        className="bg-accent text-white p-2 octo-btn hover:opacity-90 disabled:opacity-50"
                                        disabled={!commentInputs[post.key] && !hasImage}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>

                                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 comment-scrollbar">
                                    {post.comments.length === 0 && (
                                        <div className="text-xs text-text-secondary italic">No comments yet. Be the first!</div>
                                    )}
                                    {post.comments.map((comment: Comment) => (
                                        <CommentTree 
                                            key={comment.id} 
                                            comment={comment} 
                                            postKey={post.key} 
                                            replyingTo={replyingTo}
                                            setReplyingTo={setReplyingTo}
                                            replyText={replyText}
                                            setReplyText={setReplyText}
                                            onReplySubmit={handleReplySubmit}
                                            onUserClick={handleUserClick}
                                            replyFile={replyFile}
                                            setReplyFile={setReplyFile}
                                            onSpinOff={(c) => onOpenSpinOff(post.key, c.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="w-full h-screen overflow-y-auto bg-bg-core text-text-primary font-main relative">
            <style>{`
                @keyframes votePop {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.5); }
                    100% { transform: scale(1); }
                }
                .comment-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .comment-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .comment-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 3px;
                }
                .comment-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--accent);
                }
                
                /* Octagonal Aesthetic */
                .octo-clip {
                    clip-path: polygon(
                        12px 0, 100% 0, 
                        100% calc(100% - 12px), calc(100% - 12px) 100%, 
                        0 100%, 0 12px
                    );
                }
                .octo-btn {
                    clip-path: polygon(
                        6px 0, 100% 0, 
                        100% calc(100% - 6px), calc(100% - 6px) 100%, 
                        0 100%, 0 6px
                    );
                }
                .octo-tag {
                    clip-path: polygon(
                        4px 0, 100% 0, 
                        100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px
                    );
                }
                .octo-avatar {
                    clip-path: polygon(
                        30% 0, 70% 0, 100% 30%, 
                        100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%
                    );
                }
            `}</style>
            
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] bg-accent text-white px-4 py-2 octo-btn shadow-lg font-bold text-sm animate-fade-in">
                    {toastMessage}
                </div>
            )}

            <header className="sticky top-0 z-50 bg-bg-card border-b border-border-custom px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => setViewingProfile(null)}>
                    <span className="w-8 h-8 octo-avatar bg-c-club text-white flex items-center justify-center text-sm">L</span>
                    <span className="hidden md:block">Latent Space Club</span>
                </div>
                
                <div className="flex-1 max-w-xl mx-4 relative hidden sm:block">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                     <div className="w-full bg-border-custom p-[1px] octo-btn">
                         <input type="text" placeholder="Search Latent Space" className="w-full bg-bg-core octo-btn py-2 pl-10 pr-4 focus:outline-none text-sm placeholder:text-text-secondary" />
                     </div>
                </div>

                <div className="flex items-center gap-4 text-text-secondary">
                    <Bell className="cursor-pointer hover:text-text-primary" />
                    <button onClick={() => onOpenPostModal()} title="Create Post">
                        <Plus className="cursor-pointer hover:text-accent transition-colors" />
                    </button>
                    <div 
                        className="w-8 h-8 octo-avatar bg-gradient-to-tr from-accent to-c-info cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleUserClick('guest_user')}
                        title="My Profile"
                    ></div>
                </div>
            </header>

            <div className="bg-bg-card/50 border-b border-border-custom px-4 py-2 flex gap-4 overflow-x-auto">
                {Object.keys(SITE_STRUCTURE).map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-3 py-1 octo-btn font-bold text-sm whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-white/10 text-text-primary' : 'text-text-secondary hover:bg-white/5'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_312px] gap-6 p-4">
                <div className="flex flex-col">
                    <div className="bg-bg-card border border-border-custom p-3 mb-4 flex gap-2 items-center cursor-text octo-clip" onClick={() => onOpenPostModal()}>
                        <div className="w-8 h-8 octo-avatar bg-gradient-to-tr from-accent to-c-info"></div>
                        <div className="flex-1 bg-bg-core border border-border-custom px-4 py-2 text-sm text-text-secondary octo-btn">
                            Create Post
                        </div>
                        <ImageIcon className="text-text-secondary" />
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-bold text-text-secondary">
                            {activeTab} Feed
                        </div>
                        <div className="relative inline-block text-left">
                            <div className="bg-bg-card border border-border-custom octo-btn flex items-center">
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="appearance-none bg-transparent px-4 py-2 pr-8 font-bold text-sm text-text-primary focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <option value="Hot">Hot</option>
                                    <option value="New">New</option>
                                    <option value="Top">Top</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" size={16} />
                            </div>
                        </div>
                    </div>
                    
                    {renderFeed()}
                </div>

                <div className="hidden md:flex flex-col gap-4">
                    {/* Sidebar Card Wrapper */}
                    <div className="p-[1px] bg-border-custom octo-clip">
                        <div className="bg-bg-card p-4 octo-clip h-full w-full">
                            <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">About Community</h3>
                            <p className="text-sm mb-4">The social network for AI artists. Exploring the latent space together.</p>
                            <div className="flex gap-4 text-sm font-bold mb-4">
                                <div>4.2k <span className="text-text-secondary font-normal">Members</span></div>
                                <div>124 <span className="text-text-secondary font-normal">Online</span></div>
                            </div>
                            <button className="w-full bg-accent text-white font-bold py-2 octo-btn hover:opacity-90 transition-opacity">Join</button>
                        </div>
                    </div>

                    <div className="p-[1px] bg-border-custom octo-clip">
                        <div className="bg-bg-card p-4 octo-clip h-full w-full">
                             <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Trending Topics</h3>
                             <div className="flex flex-col gap-2">
                                {['MidjourneyV6', 'Sora', 'ControlNet', 'StableDiffusion', 'GenerativeVideo'].map(tag => (
                                    <div key={tag} className="flex justify-between items-center group cursor-pointer">
                                        <span className="text-sm font-bold group-hover:text-accent transition-colors flex items-center gap-1">
                                            <Hash size={14} className="text-text-secondary" /> {tag}
                                        </span>
                                        <span className="text-xs text-text-secondary">{Math.floor(Math.random() * 100)}k</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="p-[1px] bg-border-custom octo-clip">
                         <div className="bg-bg-card p-4 octo-clip h-full w-full">
                             <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Who to Follow</h3>
                             <div className="flex flex-col gap-3">
                                {[
                                    { name: 'neural_net_ninja', type: 'Artist' },
                                    { name: 'latent_explorer', type: 'Researcher' },
                                    { name: 'gpu_hoarder', type: 'Engineer' }
                                ].map(user => (
                                    <div key={user.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 octo-avatar bg-gradient-to-br from-text-secondary to-bg-core"></div>
                                            <div className="flex flex-col">
                                                <span 
                                                    className="text-sm font-bold leading-none hover:underline cursor-pointer"
                                                    onClick={() => handleUserClick(user.name)}
                                                >
                                                    {user.name}
                                                </span>
                                                <span className="text-[10px] text-text-secondary">{user.type}</span>
                                            </div>
                                        </div>
                                        <button className="text-accent hover:bg-accent/10 p-1.5 octo-btn transition-colors">
                                            <UserPlus size={16} />
                                        </button>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="p-[1px] bg-border-custom octo-clip">
                        <div className="bg-bg-card p-4 octo-clip h-full w-full">
                            <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Rules</h3>
                            <ol className="list-decimal ml-4 text-sm space-y-2 text-text-primary/80">
                                 <li>No Hate Speech</li>
                                 <li>Credit Artists</li>
                                 <li>Label NSFW content</li>
                            </ol>
                        </div>
                    </div>

                    <div className="text-xs text-text-secondary text-center">
                        © 2025 Latent Space Club. <br/> A decentralized collective.
                    </div>
                </div>
            </div>
        </div>
    );
}