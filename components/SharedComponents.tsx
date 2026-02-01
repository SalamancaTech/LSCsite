import React, { useState, useRef, useMemo } from 'react';
import { Comment } from '../types';
import { File, FileText, Archive, Code, Download, X, MessageSquare, Paperclip, CornerDownRight, GitFork, Bot, Shield, Users, Layers, AlertTriangle, MinusSquare, PlusSquare, EyeOff } from 'lucide-react';

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

export const getThreadStats = (comment: Comment) => {
    let count = 0;
    const contributors = new Set<string>();
    let depth = 0;
    let hasHazard = false;

    // Check root comment tags first
    if (comment.tags && (comment.tags.includes('nsfw') || comment.tags.includes('dark_arts'))) {
        hasHazard = true;
    }

    const traverse = (c: Comment, d: number) => {
        if (!c.replies) return;
        for (const r of c.replies) {
            count++;
            contributors.add(r.author);
            depth = Math.max(depth, d + 1);
            if (r.tags && (r.tags.includes('nsfw') || r.tags.includes('dark_arts'))) {
                hasHazard = true;
            }
            traverse(r, d + 1);
        }
    };
    traverse(comment, 0);
    return { count, contributors: contributors.size, depth, hasHazard };
};

export const getPostStats = (comments: Comment[]) => {
    let count = 0;
    const contributors = new Set<string>();
    let depth = 0;
    let hasHazard = false;

    const traverse = (c: Comment, d: number) => {
        count++;
        contributors.add(c.author);
        depth = Math.max(depth, d);
        if (c.tags?.includes('nsfw') || c.tags?.includes('dark_arts')) hasHazard = true;
        
        if (c.replies) {
            c.replies.forEach(r => traverse(r, d + 1));
        }
    };

    comments.forEach(c => traverse(c, 1));
    return { count, contributors: contributors.size, depth, hasHazard };
};

export const AttachmentDisplay: React.FC<{ data: string, className?: string, onClear?: () => void }> = ({ data, className, onClear }) => {
    if (!data) return null;
    
    const isDataUri = data.startsWith('data:');
    
    const renderContent = () => {
        if (!isDataUri) return <img src={data} alt="Attachment" className="max-w-full h-auto object-contain" />;
        
        const mime = data.split(';')[0].split(':')[1];
        
        if (mime.startsWith('image/')) {
            return <img src={data} alt="Attachment" className="max-w-full h-auto object-contain" />;
        }
        
        let Icon = File;
        let label = "File";
        let color = "text-text-primary";
        
        if (mime.includes('pdf')) { Icon = FileText; label = "PDF Document"; color = "text-red-400"; }
        else if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed')) { Icon = Archive; label = "Archive"; color = "text-yellow-400"; }
        else if (mime.includes('python') || mime.includes('x-script') || mime.includes('text/plain')) { Icon = Code; label = "Code/Script"; color = "text-blue-400"; }
        else if (mime.includes('presentation') || mime.includes('powerpoint')) { Icon = FileText; label = "Presentation"; color = "text-orange-400"; }
        else if (mime.includes('word') || mime.includes('document')) { Icon = FileText; label = "Document"; color = "text-blue-300"; }
        
        return (
            <a href={data} download={`attachment`} className="flex items-center gap-3 p-3 bg-bg-core border border-border-custom rounded hover:bg-white/5 transition-colors group w-full" onClick={(e) => e.stopPropagation()}>
                <div className={`p-2 rounded bg-black/20 ${color}`}>
                    <Icon size={24} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{label}</div>
                    <div className="text-xs text-text-secondary truncate uppercase">{mime.split('/')[1] || 'FILE'}</div>
                </div>
                <Download size={16} className="text-text-secondary group-hover:text-accent" />
            </a>
        );
    };

    return (
        <div className={`relative inline-block ${className}`}>
             <div className="p-[1px] bg-border-custom octo-clip bg-bg-card">
                 {renderContent()}
             </div>
             {onClear && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10 shadow-md"
                >
                    <X size={12} />
                </button>
             )}
        </div>
    );
};

// --- HAZARD OCTAGON COMPONENT ---
export interface HazardOctagonProps {
    count: number;
    depth: number;
    contributors: number;
    hasHazard: boolean;
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
}

export const HazardOctagon: React.FC<HazardOctagonProps> = ({ count, depth, contributors, hasHazard, onClick, className }) => {
    return (
        <div 
            className={`w-14 h-14 relative cursor-pointer group shrink-0 ${className}`} 
            onClick={onClick}
        >
            <div className="transition-transform group-hover:scale-105">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <defs>
                        <clipPath id="octagon-clip">
                            <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" />
                        </clipPath>
                    </defs>
                    <g clipPath="url(#octagon-clip)">
                        <path d="M0 0 L100 0 L50 50 Z" fill="#ef4444" stroke="var(--bg-core)" strokeWidth="1" />
                        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" dy=".3em">{count}</text>

                        <path d="M100 0 L100 100 L50 50 Z" fill={depth > 1 ? "#eab308" : "#94a3b8"} stroke="var(--bg-core)" strokeWidth="1" />
                        <text x="75" y="50" textAnchor="middle" fill="black" fontSize="14" fontWeight="bold" dy=".3em">{depth > 1 ? "Y" : "N"}</text>

                        <path d="M100 100 L0 100 L50 50 Z" fill={hasHazard ? "#000000" : "#f8fafc"} stroke="var(--bg-core)" strokeWidth="1" />
                        {hasHazard ? (
                            <text x="50" y="75" textAnchor="middle" fill="red" fontSize="18" fontWeight="bold" dy=".3em">!</text>
                        ) : (
                            <text x="50" y="75" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" dy=".3em">-</text>
                        )}

                        <path d="M0 100 L0 0 L50 50 Z" fill="#3b82f6" stroke="var(--bg-core)" strokeWidth="1" />
                        <text x="25" y="50" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" dy=".3em">{contributors}</text>
                    </g>
                    <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" fill="none" stroke="var(--bg-core)" strokeWidth="2" />
                </svg>
            </div>

            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-50 w-48 bg-bg-card border border-border-custom shadow-xl octo-clip animate-fade-in pointer-events-none">
                <div className="bg-bg-core/50 p-2 border-b border-border-custom text-[10px] font-bold text-text-secondary uppercase tracking-wider text-center">
                    Thread Stats
                </div>
                <div className="p-2 flex flex-col gap-1.5 text-xs">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <div className="w-3 h-3 bg-red-500 rounded-sm"></div> Comments
                        </div>
                        <span className="font-bold text-text-primary">{count}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Contributors
                        </div>
                        <span className="font-bold text-text-primary">{contributors}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <div className={`w-3 h-3 rounded-sm ${depth > 1 ? 'bg-yellow-500' : 'bg-slate-400'}`}></div> Recursion
                        </div>
                        <span className="font-bold text-text-primary">{depth > 1 ? 'Deep' : 'Flat'}</span>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <div className={`w-3 h-3 rounded-sm ${hasHazard ? 'bg-black border border-red-500' : 'bg-slate-50'}`}></div> Hazard
                        </div>
                        <span className={`font-bold ${hasHazard ? 'text-red-500' : 'text-text-primary'}`}>{hasHazard ? 'Detected' : 'Clear'}</span>
                     </div>
                </div>
            </div>
        </div>
    );
};

export const CensoredWrapper: React.FC<{ children: React.ReactNode, isCensored: boolean, type?: 'text' | 'image' | 'post' }> = ({ children, isCensored, type = 'text' }) => {
    const [revealed, setRevealed] = useState(false);

    if (!isCensored) return <>{children}</>;

    if (!revealed) {
        return (
            <div 
                className={`relative overflow-hidden cursor-pointer group ${type === 'image' ? 'w-full h-full min-h-[200px] flex items-center justify-center bg-black/20' : 'p-4 bg-black/5 border border-red-500/30 border-dashed rounded'}`}
                onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
            >
                <div className={`absolute inset-0 backdrop-blur-md bg-bg-core/50 flex flex-col items-center justify-center p-4 text-center transition-opacity group-hover:opacity-80 z-20`}>
                     <div className="w-12 h-12 mb-2 text-red-500">
                        <AlertTriangle size={48} strokeWidth={1} />
                     </div>
                     <span className="font-bold text-red-500 uppercase tracking-widest text-xs">
                        {type === 'post' ? 'Censored Post' : 'Sensitive Content'}
                     </span>
                     <span className="text-[10px] text-text-secondary uppercase mt-1">Click to Reveal</span>
                </div>
                {/* Obfuscated background hint */}
                <div className="opacity-20 blur-sm pointer-events-none select-none filter grayscale" aria-hidden="true">
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div className="relative group/censored animate-fade-in">
             {children}
             <button 
                onClick={(e) => { e.stopPropagation(); setRevealed(false); }}
                className="absolute top-0 right-0 -mt-3 -mr-3 opacity-0 group-hover/censored:opacity-100 transition-opacity bg-bg-core border border-red-500 text-red-500 p-1.5 rounded-full z-10 hover:bg-red-500 hover:text-white shadow-lg"
                title="Hide Content"
            >
                <EyeOff size={12} />
            </button>
        </div>
    )
}

interface CommentTreeProps {
    comment: Comment;
    postKey: string;
    depth?: number;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyText: string;
    setReplyText: (text: string) => void;
    onReplySubmit: (postKey: string, parentId: string, tags?: string[]) => void;
    onUserClick: (username: string) => void;
    replyFile: string | null;
    setReplyFile: (f: string | null) => void;
    onSpinOff: (comment: Comment) => void;
}

export const CommentTree: React.FC<CommentTreeProps> = ({ 
    comment, 
    postKey, 
    depth = 0,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    onReplySubmit,
    onUserClick,
    replyFile,
    setReplyFile,
    onSpinOff
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHazard, setIsHazard] = useState(false);
    const isReplying = replyingTo === comment.id;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stats = useMemo(() => getThreadStats(comment), [comment]);
    const isCensored = comment.tags?.includes('nsfw') || comment.tags?.includes('dark_arts') || false;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReplyFile(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const submitReply = () => {
        onReplySubmit(postKey, comment.id, isHazard ? ['nsfw'] : []);
        setIsHazard(false);
    };

    return (
        <div className={`relative mt-4 ${depth > 0 ? 'ml-6' : ''}`}>
             {/* Visual Thread Line - Interactive */}
             {depth > 0 && (
                 <div 
                    className="absolute -left-4 top-0 bottom-0 w-4 cursor-pointer group z-10"
                    onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                    title={isCollapsed ? "Expand Thread" : "Collapse Thread"}
                 >
                     <div className={`absolute left-[7px] top-0 bottom-0 w-px transition-colors ${isCollapsed ? 'bg-accent/50' : 'bg-border-custom/30 group-hover:bg-accent'}`}></div>
                     {!isCollapsed && <div className="absolute top-4 left-[7px] w-3 h-px bg-border-custom/30 group-hover:bg-accent"></div>}
                 </div>
             )}

            {isCollapsed ? (
                // COLLAPSED VIEW
                <div 
                    className="flex items-center gap-2 mb-1 bg-bg-core/50 p-1 rounded border border-transparent hover:border-border-custom cursor-pointer transition-colors"
                    onClick={() => setIsCollapsed(false)}
                >
                    <button className="text-text-secondary hover:text-accent">
                        <PlusSquare size={12} />
                    </button>
                    <span className="font-bold text-text-primary text-xs">{comment.author}</span>
                    <span className="text-text-secondary text-[10px]">{timeAgo(comment.timestamp)}</span>
                    <span className="text-xs text-text-secondary italic ml-2">
                        ({stats.count} replies hidden)
                    </span>
                    {isCensored && <span className="text-[9px] text-red-500 border border-red-500 px-1 rounded uppercase font-bold">NSFW</span>}
                </div>
            ) : (
                // EXPANDED VIEW
                <div className="flex flex-col animate-fade-in">
                    <div className="flex gap-4">
                        {/* Main Comment Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <button 
                                    onClick={() => setIsCollapsed(true)} 
                                    className="text-text-secondary hover:text-accent opacity-50 hover:opacity-100"
                                    title="Collapse"
                                >
                                    <MinusSquare size={12} />
                                </button>
                                <span className="font-bold text-text-primary text-xs hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); onUserClick(comment.author); }}>{comment.author}</span>
                                {comment.author === 'system_daemon' && <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 octo-tag font-bold tracking-wider flex items-center gap-1"><Bot size={8} fill="currentColor" /> BOT</span>}
                                {comment.author === 'admin' && <span className="bg-accent text-white text-[9px] px-1.5 py-0.5 octo-tag font-bold tracking-wider flex items-center gap-1"><Shield size={8} fill="currentColor" /> ADMIN</span>}
                                {comment.author === 'mod' && <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 octo-tag font-bold tracking-wider flex items-center gap-1"><Shield size={8} fill="currentColor" /> MOD</span>}
                                <span className="text-text-secondary text-[10px]">{timeAgo(comment.timestamp)}</span>
                                {isCensored && <span className="text-[9px] text-red-500 border border-red-500 px-1 rounded uppercase font-bold">NSFW</span>}
                            </div>
                            
                            <CensoredWrapper isCensored={isCensored} type="text">
                                <div className="text-text-secondary text-sm whitespace-pre-wrap pl-1 border-l-2 border-transparent hover:border-border-custom/50 transition-colors">
                                    {comment.text}
                                </div>
                                {comment.image && (
                                    <div className="mt-2 pl-1">
                                        <AttachmentDisplay data={comment.image} className="max-w-md" />
                                    </div>
                                )}
                            </CensoredWrapper>
                            
                            <div className="flex gap-4 mt-2 items-start pl-1">
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setReplyingTo(isReplying ? null : comment.id); 
                                        setReplyText(''); 
                                        setReplyFile(null);
                                        setIsHazard(false);
                                    }}
                                    className={`text-[10px] font-bold hover:text-accent flex items-center gap-1 transition-colors h-6 ${isReplying ? 'text-accent' : 'text-text-secondary'}`}
                                >
                                    <MessageSquare size={10} /> Reply
                                </button>
                                
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onSpinOff(comment); 
                                    }}
                                    className="text-[10px] font-bold text-text-secondary hover:text-accent flex items-center gap-1 transition-colors h-6"
                                    title="Open this comment as a new thread"
                                >
                                    <GitFork size={10} /> Spin-off
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Hazard Octagon (Spin-off Indicator) */}
                        {stats.count > 0 && (
                            <div className="pt-2">
                                <HazardOctagon 
                                    count={stats.count} 
                                    depth={stats.depth} 
                                    contributors={stats.contributors} 
                                    hasHazard={stats.hasHazard}
                                    onClick={(e) => { e.stopPropagation(); onSpinOff(comment); }}
                                />
                            </div>
                        )}
                    </div>

                    {isReplying && (
                        <div className="mt-2 ml-1 flex flex-col gap-2 animate-fade-in bg-bg-core/50 p-2 border border-border-custom/50 rounded">
                            {replyFile && (
                                <div className="mb-2">
                                    <AttachmentDisplay data={replyFile} className="max-w-xs" onClear={() => setReplyFile(null)} />
                                </div>
                            )}
                            <div className="flex gap-2 items-start">
                                <div className="flex-1 p-[1px] bg-border-custom octo-btn focus-within:bg-accent transition-colors">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        className="w-full bg-bg-core px-3 py-1.5 text-xs outline-none octo-btn text-text-primary placeholder:text-text-secondary/50"
                                        placeholder={`Replying to ${comment.author}...`}
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && submitReply()}
                                    />
                                </div>
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept={ALLOWED_FILE_TYPES}
                                    onChange={handleFileChange} 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className={`p-1.5 octo-btn border border-border-custom transition-colors ${replyFile ? 'bg-accent/20 text-accent border-accent' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}
                                    title="Attach File"
                                >
                                    <Paperclip size={14} />
                                </button>

                                <button 
                                    onClick={() => setIsHazard(!isHazard)} 
                                    className={`p-1.5 octo-btn border border-border-custom transition-colors ${isHazard ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-bg-card text-text-secondary hover:text-red-500'}`}
                                    title="Toggle Content Hazard (NSFW/Spoiler)"
                                >
                                    <AlertTriangle size={14} />
                                </button>

                                <button onClick={submitReply} className="bg-accent text-white p-1.5 octo-btn hover:opacity-90">
                                    <CornerDownRight size={14} />
                                </button>
                                <button onClick={() => setReplyingTo(null)} className="bg-bg-card text-text-secondary p-1.5 octo-btn hover:text-text-primary">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Render Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-1">
                            {comment.replies.map(reply => (
                                <CommentTree 
                                    key={reply.id} 
                                    comment={reply} 
                                    postKey={postKey} 
                                    depth={depth + 1}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    onReplySubmit={onReplySubmit}
                                    onUserClick={onUserClick}
                                    replyFile={replyFile}
                                    setReplyFile={setReplyFile}
                                    onSpinOff={onSpinOff}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};