
import React, { useState, useRef, useEffect } from 'react';
import { SITE_STRUCTURE, CONTENT_DB, MOCK_PROFILES, LOGO_URL, THEMES } from '../../constants';
import { InteractionState, UserPost, Comment, UserProfile, InterfaceMode } from '../../types';
import { UserProfileView } from './UserProfile';
import { AttachmentDisplay, CommentTree, HazardOctagon, getPostStats, CensoredWrapper, UserAvatar, HistoryViewer } from '../SharedComponents';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Search, Bell, Plus, Send, ChevronDown, Image as ImageIcon, Share2, Bookmark, Hash, UserPlus, Shield, Bot, Globe, Users, Lock, Paperclip, AlertTriangle, MoreHorizontal, Edit2, Monitor, Palette, History, ArrowLeft, LayoutGrid } from 'lucide-react';

interface Web2ViewProps {
    openReader: (key: string) => void;
    interactions: InteractionState;
    onVote: (key: string, direction: 1 | -1) => void;
    onComment: (key: string, text: string, image?: string, parentId?: string, tags?: string[]) => void;
    onEditComment?: (postKey: string, commentId: string, newText: string) => void;
    userPosts: UserPost[];
    onOpenPostModal: (data?: {id?: string, title?: string, body?: string, category?: string, image?: string, tags?: string[]}) => void;
    onOpenSpinOff: (postId: string, commentId: string) => void;
    currentMode: InterfaceMode;
    currentTheme: string;
    onModeChange: (mode: InterfaceMode) => void;
    onThemeChange: (theme: string) => void;
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
                <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} /> <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
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

const HeaderDropdown: React.FC<{ 
    icon: React.ReactNode, 
    label?: string, 
    children: React.ReactNode 
}> = ({ icon, label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 hover:bg-white/10 p-2 octo-btn transition-colors ${isOpen ? 'text-accent' : 'text-text-secondary'}`}
                title={label}
            >
                {icon}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-bg-card border border-border-custom shadow-xl octo-clip z-50 flex flex-col animate-fade-in max-h-[300px] overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            )}
        </div>
    );
};

export const Web2View: React.FC<Web2ViewProps> = ({ 
    openReader, 
    interactions, 
    onVote, 
    onComment, 
    onEditComment, 
    userPosts, 
    onOpenPostModal, 
    onOpenSpinOff,
    currentMode,
    currentTheme,
    onModeChange,
    onThemeChange
}) => {
    const [activeTab, setActiveTab] = useState('Club');
    const [sortBy, setSortBy] = useState<'Hot' | 'New' | 'Top'>('Hot');
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [commentImages, setCommentImages] = useState<Record<string, string>>({}); 
    const [commentHazard, setCommentHazard] = useState<Record<string, boolean>>({});
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    
    const [viewingProfile, setViewingProfile] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyFile, setReplyFile] = useState<string | null>(null);
    const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
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
        let isSaving = false;
        setSavedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                isSaving = false;
            } else {
                next.add(id);
                isSaving = true;
            }
            return next;
        });
        
        // Trigger toast outside of the state updater to avoid side-effect errors
        if (savedPosts.has(id)) {
             triggerToast("Post removed from bookmarks");
        } else {
             triggerToast("Post saved to bookmarks");
        }
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

    const renderFeed = () => {
        let posts: any[] = [];
        const sectionData = SITE_STRUCTURE[activeTab];
        if (!sectionData) return <div>Section not found.</div>;

        const createPost = (key: string, sub: string) => {
            const content = CONTENT_DB[key];
            const interaction = interactions[key] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            const title = content ? content.title : key;
            const body = content ? content.body.replace(/<[^>]*>?/gm, '') : "";
            return { id: key, title: title, body: body, sub: `r/${sub}`, author: 'admin', key: key, ...interaction };
        };

        const createResourcePost = (item: any, sub: string) => {
            const interaction = interactions[item.title] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            return { id: item.title, title: item.title, body: item.desc, sub: `r/${sub.replace(/\s/g,'')}`, author: 'mod', key: item.title, ...interaction };
        };

        const createUserPostObject = (p: UserPost) => {
            const interaction = interactions[p.id] || { votes: 0, userVote: 0, comments: [], timestamp: p.timestamp };
            return { id: p.id, title: p.title, body: p.body, sub: `r/${p.category}`, author: p.author, key: p.id, image: p.image, tags: p.tags, editHistory: p.editHistory, ...interaction };
        }

        if (sectionData.type === 'single' && sectionData.key) {
            const post = createPost(sectionData.key, activeTab); if (post) posts.push(post);
        } else if (sectionData.type === 'list' && sectionData.items) {
            sectionData.items.forEach((key: string) => { const post = createPost(key, activeTab); if (post) posts.push(post); });
        } else if (sectionData.type === 'grouped' && sectionData.groups) {
            Object.entries(sectionData.groups).forEach(([groupName, items]) => { (items as any[]).forEach(item => posts.push(createResourcePost(item, groupName))); });
        }
        userPosts.filter(p => p.category === activeTab).forEach(p => posts.push(createUserPostObject(p)));

        posts.sort((a, b) => {
            if (sortBy === 'New') return b.timestamp - a.timestamp;
            if (sortBy === 'Top') return b.votes - a.votes;
            const getHotScore = (post: any) => { const hours = (Date.now() - post.timestamp) / (1000 * 60 * 60); return (post.votes + 1) / Math.pow(hours + 2, 1.5); };
            return getHotScore(b) - getHotScore(a);
        });

        const viewingPost = viewingHistoryId ? posts.find(p => p.id === viewingHistoryId) : null;

        return (
            <>
                {viewingPost && viewingPost.editHistory && (
                    <HistoryViewer history={viewingPost.editHistory} currentText={viewingPost.body} currentImage={viewingPost.image} onClose={() => setViewingHistoryId(null)} />
                )}
                {/* TOAST NOTIFICATION */}
                {showToast && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9000] bg-bg-card border border-accent text-accent px-6 py-3 rounded-full shadow-[0_0_20px_rgba(var(--accent),0.3)] font-bold text-sm animate-fade-in flex items-center gap-2">
                         <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                         {toastMessage}
                    </div>
                )}
                {posts.map(post => {
                    const isUpvoted = post.userVote === 1;
                    const isDownvoted = post.userVote === -1;
                    const hasImage = !!commentImages[post.key];
                    const isSaved = savedPosts.has(post.id);
                    const isCensored = post.tags?.includes('nsfw') || post.tags?.includes('dark_arts');
                    const isAuthor = post.author === 'guest_user';
                    const TRUNCATE_LIMIT = 141;
                    const shouldTruncate = post.body.length > TRUNCATE_LIMIT;
                    const countComments = (comments: Comment[]): number => comments.reduce((acc, c) => acc + 1 + (c.replies ? countComments(c.replies) : 0), 0);
                    const totalComments = countComments(post.comments);
                    const postStats = getPostStats(post.comments);

                    return (
                        <div key={post.id} className="group relative mb-4 transition-all duration-300 hover:shadow-xl md:hover:-translate-y-1">
                            <div className="absolute inset-0 bg-border-custom group-hover:bg-accent octo-clip transition-colors"></div>
                            <div className="relative p-[1px] m-[1px] bg-bg-card octo-clip flex flex-col">
                                <div className="flex bg-bg-card octo-clip">
                                    <div className="w-10 sm:w-12 bg-black/10 border-r border-border-custom flex flex-col items-center py-3 gap-1 text-text-secondary font-bold text-xs sm:text-sm">
                                        <button onClick={(e) => { e.stopPropagation(); onVote(post.key, 1); }} className={`p-1 transition-all ${isUpvoted ? 'text-orange-500 scale-110' : 'hover:text-orange-500'}`}><ArrowBigUp size={24} fill={isUpvoted ? "currentColor" : "none"} /></button>
                                        <span className={isUpvoted ? 'text-orange-500' : isDownvoted ? 'text-indigo-500' : ''}>{post.votes}</span>
                                        <button onClick={(e) => { e.stopPropagation(); onVote(post.key, -1); }} className={`p-1 transition-all ${isDownvoted ? 'text-indigo-500 scale-110' : 'hover:text-indigo-500'}`}><ArrowBigDown size={24} fill={isDownvoted ? "currentColor" : "none"} /></button>
                                    </div>
                                    <div className="flex-1 p-3 cursor-pointer" onClick={() => !post.id.startsWith('post-') && openReader(post.key)}>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] sm:text-xs text-text-secondary mb-1 flex items-center gap-1 flex-wrap">
                                                    <span className="font-bold text-text-primary">{post.sub}</span>
                                                    <span>•</span>
                                                    <div className="flex items-center gap-1 hover:bg-white/5 rounded px-1" onClick={(e) => { e.stopPropagation(); handleUserClick(post.author); }}>
                                                         <UserAvatar username={post.author} size="w-3.5 h-3.5 sm:w-4 h-4" />
                                                         <span className="font-bold hover:underline truncate max-w-[80px] sm:max-w-none">u/{post.author}</span>
                                                    </div>
                                                    <span>•</span>
                                                    <span>{timeAgo(post.timestamp)}</span>
                                                    {isCensored && <span className="text-[9px] text-red-500 border border-red-500 px-1 rounded uppercase font-bold">NSFW</span>}
                                                </div>
                                                <div className="text-base sm:text-lg font-semibold mb-2 text-text-primary leading-tight">{post.title}</div>
                                                <CensoredWrapper isCensored={isCensored} type="post">
                                                    <div className="text-xs sm:text-sm text-text-secondary mb-3 whitespace-pre-wrap line-clamp-4">
                                                        {shouldTruncate ? `${post.body.substring(0, TRUNCATE_LIMIT)}...` : post.body}
                                                    </div>
                                                    {post.image && <div className="mb-4"><AttachmentDisplay data={post.image} className="w-full rounded-lg" /></div>}
                                                </CensoredWrapper>
                                                <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-text-secondary">
                                                    <button className="flex items-center gap-1 hover:bg-white/10 p-1.5 sm:p-2 octo-btn" onClick={(e) => { e.stopPropagation(); toggleComments(post.key); }}><MessageSquare size={16}/> {totalComments} <span className="hidden sm:inline">Comments</span></button>
                                                    <button className="flex items-center gap-1 hover:bg-white/10 p-1.5 sm:p-2 octo-btn" onClick={handleShare}><Share2 size={16} /> <span className="hidden sm:inline">Share</span></button>
                                                    <SaveDropdown isSaved={isSaved} onToggleSave={() => toggleSave(post.id)} category={post.sub} />
                                                    {isAuthor && <button className="flex items-center gap-1 hover:bg-white/10 p-1.5 sm:p-2 octo-btn" onClick={(e) => { e.stopPropagation(); onOpenPostModal({ id: post.id, title: post.title, body: post.body, category: post.category, image: post.image, tags: post.tags }); }}><Edit2 size={16} /> <span className="hidden sm:inline">Edit</span></button>}
                                                </div>
                                            </div>
                                            {postStats.count > 0 && <div className="sm:pt-2 flex justify-end sm:block"><HazardOctagon count={postStats.count} depth={postStats.depth} contributors={postStats.contributors} hasHazard={postStats.hasHazard} className="w-10 h-10 sm:w-14 sm:h-14" onClick={(e) => { e.stopPropagation(); toggleComments(post.key); }} /></div>}
                                        </div>
                                    </div>
                                </div>
                                {expandedComments[post.key] && (
                                    <div className="bg-bg-core/30 border-t border-border-custom p-3 sm:p-4 animate-fade-in">
                                        <div className="flex gap-2 mb-4 items-end">
                                            <input type="file" id={`file-input-${post.key}`} accept={ALLOWED_FILE_TYPES} className="hidden" onChange={(e) => handleFileSelect(post.key, e)} />
                                            <button onClick={() => document.getElementById(`file-input-${post.key}`)?.click()} className={`p-2 sm:p-2.5 octo-btn border border-border-custom transition-colors ${hasImage ? 'text-accent border-accent' : 'bg-bg-core text-text-secondary'}`}><Paperclip size={16} /></button>
                                            <div className="flex-1 p-[1px] bg-border-custom octo-btn focus-within:bg-accent transition-colors">
                                                <input type="text" className="w-full bg-bg-core px-3 py-1.5 sm:py-2 text-sm outline-none octo-btn text-text-primary" placeholder="Thoughts?" value={commentInputs[post.key] || ''} onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.key]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.key)} />
                                            </div>
                                            <button onClick={() => handleCommentSubmit(post.key)} className="bg-accent text-white p-2 sm:p-2.5 octo-btn disabled:opacity-50" disabled={!commentInputs[post.key] && !hasImage}><Send size={16} /></button>
                                        </div>
                                        <div className="max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 space-y-3 comment-scrollbar">
                                            {post.comments.map((comment: Comment) => (
                                                <CommentTree key={comment.id} comment={comment} postKey={post.key} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyText={replyText} setReplyText={setReplyText} onReplySubmit={handleReplySubmit} onUserClick={handleUserClick} replyFile={replyFile} setReplyFile={setReplyFile} onSpinOff={(c) => onOpenSpinOff(post.key, c.id)} onEditComment={onEditComment} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="w-full h-screen overflow-y-auto bg-bg-core text-text-primary font-main relative">
            <style>{`.octo-clip { clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); } .octo-btn { clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }`}</style>
            
            <header className="sticky top-0 z-[100] bg-bg-card border-b border-border-custom px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3 font-bold text-xl cursor-pointer" onClick={() => setViewingProfile(null)}>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 octo-avatar relative overflow-hidden bg-black border border-accent/50">
                        <img src={LOGO_URL} className="w-full h-full object-cover" alt="LSC" />
                    </div>
                    <span className="hidden sm:block">Latent Space Club</span>
                </div>
                
                <div className={`flex-1 max-w-xl mx-4 relative ${isMobileSearchOpen ? 'fixed inset-0 z-[200] bg-bg-card p-4 flex items-center' : 'hidden sm:block'}`}>
                     {isMobileSearchOpen && <button onClick={() => setIsMobileSearchOpen(false)} className="mr-2 text-text-secondary"><ArrowLeft size={24}/></button>}
                     <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <div className="w-full bg-border-custom p-[1px] octo-btn">
                            <input type="text" placeholder="Search Latent Space" className="w-full bg-bg-core octo-btn py-2 pl-10 pr-4 focus:outline-none text-sm" autoFocus={isMobileSearchOpen} />
                        </div>
                     </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-text-secondary">
                    <button onClick={() => setIsMobileSearchOpen(true)} className="sm:hidden p-2 hover:bg-white/10 rounded-full"><Search size={20}/></button>
                    
                    <HeaderDropdown icon={<LayoutGrid size={18} />} label="View">
                         <div className="bg-bg-core/50 p-2 border-b border-border-custom text-[10px] font-bold text-text-secondary uppercase tracking-wider">Interface Mode</div>
                         {['classic', 'web2', 'zui'].map((m) => (
                            <button
                                key={m}
                                onClick={() => onModeChange(m as InterfaceMode)}
                                className={`w-full px-4 py-2 text-left hover:bg-accent hover:text-white flex items-center justify-between text-xs transition-colors font-bold uppercase ${currentMode === m ? 'text-accent' : ''}`}
                            >
                                <span>{m === 'classic' ? 'v1.0 Classic' : m === 'web2' ? 'v2.0 Modern' : 'v3.0 Spatial'}</span>
                                {currentMode === m && <div className="w-2 h-2 bg-current rounded-full"></div>}
                            </button>
                        ))}
                    </HeaderDropdown>

                    <HeaderDropdown icon={<Palette size={18} />} label="Theme">
                        <div className="bg-bg-core/50 p-2 border-b border-border-custom text-[10px] font-bold text-text-secondary uppercase tracking-wider">Theme</div>
                        {Object.entries(THEMES).map(([key, config]) => (
                            <button key={key} onClick={() => onThemeChange(key)} className="px-4 py-2 text-left hover:bg-accent hover:text-white flex items-center gap-2 text-xs transition-colors font-bold">
                                <div className="w-3 h-3 border border-white/20 rounded-full" style={{background: config.colors['--bg-core']}}></div> {config.name}
                            </button>
                        ))}
                    </HeaderDropdown>
                    <button onClick={() => onOpenPostModal()} className="p-2 hover:bg-white/10 rounded-full"><Plus size={22}/></button>
                    <div className="cursor-pointer ml-1" onClick={() => handleUserClick('guest_user')}><UserAvatar username="guest_user" size="w-8 h-8" /></div>
                </div>
            </header>

            <div className="bg-bg-card/50 border-b border-border-custom sticky top-[57px] z-[90] px-4 py-2 flex gap-4 overflow-x-auto scrollbar-hide backdrop-blur-md">
                {Object.keys(SITE_STRUCTURE).map(cat => (
                    <button key={cat} onClick={() => setActiveTab(cat)} className={`px-3 py-1 octo-btn font-bold text-xs sm:text-sm whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-white/10 text-text-primary border-b-2 border-accent' : 'text-text-secondary hover:bg-white/5'}`}>{cat}</button>
                ))}
            </div>

            <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_312px] gap-6 p-4">
                <div className="flex flex-col">
                    <div className="bg-bg-card border border-border-custom p-3 mb-4 flex gap-2 items-center cursor-text octo-clip" onClick={() => onOpenPostModal()}>
                        <UserAvatar username="guest_user" size="w-8 h-8" />
                        <div className="flex-1 bg-bg-core border border-border-custom px-4 py-2 text-sm text-text-secondary octo-btn">Create Post</div>
                        <ImageIcon className="text-text-secondary" />
                    </div>
                    <div className="flex justify-between items-center mb-4 px-1">
                        <div className="text-xs sm:text-sm font-bold text-text-secondary uppercase tracking-widest">{activeTab} Feed</div>
                        <div className="relative inline-block text-left">
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-bg-card border border-border-custom octo-btn px-4 py-1.5 font-bold text-xs sm:text-sm text-text-primary outline-none cursor-pointer">
                                <option value="Hot">Hot</option>
                                <option value="New">New</option>
                                <option value="Top">Top</option>
                            </select>
                        </div>
                    </div>
                    {renderFeed()}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="p-[1px] bg-border-custom octo-clip">
                        <div className="bg-bg-card p-4 octo-clip h-full w-full">
                            <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">About Community</h3>
                            <p className="text-sm mb-4">The social network for AI artists. Exploring the latent space together.</p>
                            <div className="flex gap-4 text-sm font-bold mb-4">
                                <div>4.2k <span className="text-text-secondary font-normal">Members</span></div>
                                <div>124 <span className="text-text-secondary font-normal">Online</span></div>
                            </div>
                            <button className="w-full bg-accent text-white font-bold py-2 octo-btn">Join</button>
                        </div>
                    </div>
                    <div className="hidden md:block p-[1px] bg-border-custom octo-clip">
                         <div className="bg-bg-card p-4 octo-clip h-full w-full">
                             <h3 className="text-sm font-bold text-text-secondary uppercase mb-3">Trending</h3>
                             <div className="flex flex-col gap-2">
                                {['MidjourneyV6', 'Sora', 'StableDiffusion'].map(tag => (
                                    <div key={tag} className="flex justify-between items-center group cursor-pointer">
                                        <span className="text-sm font-bold group-hover:text-accent transition-colors flex items-center gap-1"><Hash size={14} className="text-text-secondary" /> {tag}</span>
                                        <span className="text-xs text-text-secondary">{Math.floor(Math.random() * 100)}k</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
