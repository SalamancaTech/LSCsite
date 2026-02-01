import React, { useState, useRef, useMemo } from 'react';
import { Comment, EditHistoryEntry } from '../types';
import { File, FileText, Archive, Code, Download, X, MessageSquare, Paperclip, CornerDownRight, GitFork, Bot, Shield, Users, Layers, AlertTriangle, MinusSquare, PlusSquare, EyeOff, Edit2, Check, History } from 'lucide-react';
import { MOCK_PROFILES } from '../constants';

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

// --- SIMPLE DIFF ALGORITHM ---
interface DiffChunk {
    type: 'same' | 'added' | 'removed';
    value: string;
}

const diffWords = (text1: string, text2: string): DiffChunk[] => {
    const words1 = text1.split(/(\s+)/);
    const words2 = text2.split(/(\s+)/);
    const m = words1.length;
    const n = words2.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (words1[i - 1] === words2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    const diffs: DiffChunk[] = [];
    let i = m; let j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) { diffs.unshift({ type: 'same', value: words1[i - 1] }); i--; j--; }
        else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { diffs.unshift({ type: 'added', value: words2[j - 1] }); j--; }
        else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) { diffs.unshift({ type: 'removed', value: words1[i - 1] }); i--; }
    }
    return diffs;
};

export const UserAvatar: React.FC<{ username: string, size?: string, className?: string, onClick?: (e: React.MouseEvent) => void }> = ({ username, size = "w-8 h-8", className = "", onClick }) => {
    const profile = MOCK_PROFILES[username];
    const isCreator = profile?.isCreator;
    const avatarUrl = profile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    return (
        <div className={`relative ${size} shrink-0 ${className} cursor-pointer`} onClick={onClick}>
            <div className={`w-full h-full octo-avatar bg-bg-card overflow-hidden relative ${isCreator ? 'creator-glow' : ''}`}>
                <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            </div>
        </div>
    );
};

export const getThreadStats = (comment: Comment) => {
    let count = 0; const contributors = new Set<string>(); let depth = 0; let hasHazard = false;
    if (comment.tags && (comment.tags.includes('nsfw') || comment.tags.includes('dark_arts'))) hasHazard = true;
    const traverse = (c: Comment, d: number) => {
        if (!c.replies) return;
        for (const r of c.replies) {
            count++; contributors.add(r.author); depth = Math.max(depth, d + 1);
            if (r.tags && (r.tags.includes('nsfw') || r.tags.includes('dark_arts'))) hasHazard = true;
            traverse(r, d + 1);
        }
    };
    traverse(comment, 0); return { count, contributors: contributors.size, depth, hasHazard };
};

export const getPostStats = (comments: Comment[]) => {
    let count = 0; const contributors = new Set<string>(); let depth = 0; let hasHazard = false;
    const traverse = (c: Comment, d: number) => {
        count++; contributors.add(c.author); depth = Math.max(depth, d);
        if (c.tags?.includes('nsfw') || c.tags?.includes('dark_arts')) hasHazard = true;
        if (c.replies) c.replies.forEach(r => traverse(r, d + 1));
    };
    comments.forEach(c => traverse(c, 1)); return { count, contributors: contributors.size, depth, hasHazard };
};

export const AttachmentDisplay: React.FC<{ data: string, className?: string, onClear?: () => void }> = ({ data, className, onClear }) => {
    if (!data) return null;
    const isDataUri = data.startsWith('data:');
    const renderContent = () => {
        if (!isDataUri) return <img src={data} alt="Attachment" className="max-w-full h-auto object-contain rounded" />;
        const mime = data.split(';')[0].split(':')[1];
        if (mime.startsWith('image/')) return <img src={data} alt="Attachment" className="max-w-full h-auto object-contain rounded" />;
        let Icon = File; let label = "File"; let color = "text-text-primary";
        if (mime.includes('pdf')) { Icon = FileText; label = "PDF"; color = "text-red-400"; }
        else if (mime.includes('zip') || mime.includes('rar')) { Icon = Archive; label = "Archive"; color = "text-yellow-400"; }
        else if (mime.includes('python') || mime.includes('text/plain')) { Icon = Code; label = "Code"; color = "text-blue-400"; }
        return (
            <a href={data} download={`attachment`} className="flex items-center gap-3 p-2 bg-bg-core border border-border-custom rounded hover:bg-white/5 transition-colors w-full" onClick={(e) => e.stopPropagation()}>
                <div className={`p-1.5 rounded bg-black/20 ${color}`}><Icon size={20} /></div>
                <div className="flex-1 min-w-0"><div className="text-xs font-bold truncate">{label}</div></div>
                <Download size={14} className="text-text-secondary" />
            </a>
        );
    };
    return (<div className={`relative inline-block ${className}`}><div className="p-[1px] bg-border-custom bg-bg-card">{renderContent()}</div>{onClear && <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"><X size={12} /></button>}</div>);
};

export interface HazardOctagonProps {
    count: number; depth: number; contributors: number; hasHazard: boolean; onClick?: (e: React.MouseEvent) => void; className?: string;
}

export const HazardOctagon: React.FC<HazardOctagonProps> = ({ count, depth, contributors, hasHazard, onClick, className }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    return (
        <div className={`relative cursor-pointer shrink-0 ${className}`} onClick={(e) => { if (onClick) onClick(e); setShowTooltip(!showTooltip); }}>
            <div className="transition-transform active:scale-95">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <defs><clipPath id="octagon-clip"><polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" /></clipPath></defs>
                    <g clipPath="url(#octagon-clip)">
                        <path d="M0 0 L100 0 L50 50 Z" fill="#ef4444" stroke="var(--bg-core)" strokeWidth="1" />
                        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" dy=".3em">{count}</text>
                        <path d="M100 0 L100 100 L50 50 Z" fill={depth > 1 ? "#eab308" : "#94a3b8"} stroke="var(--bg-core)" strokeWidth="1" />
                        <text x="75" y="50" textAnchor="middle" fill="black" fontSize="14" fontWeight="bold" dy=".3em">{depth > 1 ? "Y" : "N"}</text>
                        <path d="M100 100 L0 100 L50 50 Z" fill={hasHazard ? "#000000" : "#f8fafc"} stroke="var(--bg-core)" strokeWidth="1" />
                        {hasHazard ? <text x="50" y="75" textAnchor="middle" fill="red" fontSize="18" fontWeight="bold" dy=".3em">!</text> : <text x="50" y="75" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold" dy=".3em">-</text>}
                        <path d="M0 100 L0 0 L50 50 Z" fill="#3b82f6" stroke="var(--bg-core)" strokeWidth="1" />
                        <text x="25" y="50" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" dy=".3em">{contributors}</text>
                    </g>
                    <polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" fill="none" stroke="var(--bg-core)" strokeWidth="2" />
                </svg>
            </div>
            {showTooltip && (
                <div className="absolute right-0 bottom-full mb-2 z-[200] w-56 bg-bg-card border border-border-custom shadow-2xl p-2 text-[9px] animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-red-500 font-bold uppercase">Flam: {count}</div>
                        <div className="text-yellow-500 font-bold uppercase">Inst: {depth}</div>
                        <div className="text-blue-500 font-bold uppercase">Health: {contributors}</div>
                        <div className="text-white font-bold uppercase">Haz: {hasHazard ? 'YES' : 'NO'}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const CensoredWrapper: React.FC<{ children: React.ReactNode, isCensored: boolean, type?: 'text' | 'image' | 'post' }> = ({ children, isCensored, type = 'text' }) => {
    const [revealed, setRevealed] = useState(false);
    if (!isCensored) return <>{children}</>;
    if (!revealed) {
        return (
            <div className={`relative overflow-hidden cursor-pointer group ${type === 'image' ? 'w-full min-h-[150px] flex items-center justify-center bg-black/20' : 'p-3 bg-black/5 border border-red-500/30 border-dashed rounded'}`} onClick={(e) => { e.stopPropagation(); setRevealed(true); }}>
                <div className={`absolute inset-0 backdrop-blur-md bg-bg-core/50 flex flex-col items-center justify-center p-2 text-center transition-opacity z-20`}>
                     <AlertTriangle size={32} className="text-red-500 mb-1" />
                     <span className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Sensitive Content</span>
                     <span className="text-[8px] text-text-secondary uppercase mt-1">Tap to Reveal</span>
                </div>
                <div className="opacity-10 blur-md pointer-events-none filter grayscale">{children}</div>
            </div>
        )
    }
    return (
        <div className="relative group animate-fade-in">
             {children}
             <button onClick={(e) => { e.stopPropagation(); setRevealed(false); }} className="absolute top-0 right-0 -mt-2 -mr-2 bg-bg-core border border-red-500 text-red-500 p-1 rounded-full z-10 shadow-lg"><EyeOff size={10} /></button>
        </div>
    )
}

export const HistoryViewer: React.FC<{ history: EditHistoryEntry[], currentText: string, currentImage?: string, onClose: () => void }> = ({ history, currentText, currentImage, onClose }) => {
    const timeline = [...history].reverse().concat({ text: currentText, image: currentImage, timestamp: Date.now() });
    return (
        <div className="fixed inset-0 z-[7000] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full sm:w-[600px] max-h-[90vh] bg-bg-card border border-border-custom shadow-2xl overflow-hidden flex flex-col sm:octo-clip" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-custom flex justify-between items-center bg-bg-core">
                    <h3 className="text-base sm:text-lg font-bold flex items-center gap-2"><History size={18} /> History</h3>
                    <button onClick={onClose} className="text-text-secondary"><X size={20} /></button>
                </div>
                <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {timeline.map((entry, idx) => {
                        const isOriginal = idx === 0; const isCurrent = idx === timeline.length - 1; const prev = idx > 0 ? timeline[idx-1] : null;
                        return (
                            <div key={idx} className="bg-bg-core/50 border border-border-custom rounded p-3 relative">
                                <div className="text-[9px] sm:text-xs text-text-secondary mb-2 flex justify-between items-center uppercase tracking-widest border-b border-border-custom/30 pb-1">
                                    <span className="font-bold">{isOriginal ? 'Original' : isCurrent ? 'Current' : `Edit #${idx}`}</span>
                                    <span>{timeAgo(entry.timestamp)}</span>
                                </div>
                                <div className="text-xs sm:text-sm text-text-primary whitespace-pre-wrap">{entry.text}</div>
                                {entry.image && <div className="mt-3"><AttachmentDisplay data={entry.image} className="max-w-[150px] rounded opacity-90" /></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface CommentTreeProps {
    comment: Comment; postKey: string; depth?: number; replyingTo: string | null; setReplyingTo: (id: string | null) => void; replyText: string; setReplyText: (text: string) => void; onReplySubmit: (postKey: string, parentId: string, tags?: string[]) => void; onUserClick: (username: string) => void; replyFile: string | null; setReplyFile: (f: string | null) => void; onSpinOff: (comment: Comment) => void; onEditComment?: (postKey: string, commentId: string, newText: string) => void;
}

export const CommentTree: React.FC<CommentTreeProps> = ({ comment, postKey, depth = 0, replyingTo, setReplyingTo, replyText, setReplyText, onReplySubmit, onUserClick, replyFile, setReplyFile, onSpinOff, onEditComment }) => {
    const [isCollapsed, setIsCollapsed] = useState(false); const [isHazard, setIsHazard] = useState(false); const [isEditing, setIsEditing] = useState(false); const [editText, setEditText] = useState(comment.text); const [showHistory, setShowHistory] = useState(false);
    const isReplying = replyingTo === comment.id; const stats = useMemo(() => getThreadStats(comment), [comment]); const isCensored = comment.tags?.includes('nsfw') || comment.tags?.includes('dark_arts') || false; const isAuthor = comment.author === 'guest_user';
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setReplyFile(reader.result as string); reader.readAsDataURL(file); } };
    const submitReply = () => { onReplySubmit(postKey, comment.id, isHazard ? ['nsfw'] : []); setIsHazard(false); };
    const handleEditSave = () => { if(onEditComment && editText.trim()) { onEditComment(postKey, comment.id, editText); setIsEditing(false); } };

    return (
        <div className={`relative mt-3 ${depth > 0 ? 'ml-4 sm:ml-6' : ''}`}>
             {showHistory && comment.editHistory && (<HistoryViewer history={comment.editHistory} currentText={comment.text} currentImage={comment.image} onClose={() => setShowHistory(false)} />)}
             {depth > 0 && (<div className="absolute -left-3 sm:-left-4 top-0 bottom-0 w-3 sm:w-4 cursor-pointer group" onClick={() => setIsCollapsed(!isCollapsed)}><div className={`absolute left-[5px] sm:left-[7px] top-0 bottom-0 w-px ${isCollapsed ? 'bg-accent/50' : 'bg-border-custom/20'}`}></div></div>)}
            {isCollapsed ? (
                <div className="flex items-center gap-2 mb-1 p-1 cursor-pointer bg-bg-core/40 rounded border border-transparent hover:border-border-custom" onClick={() => setIsCollapsed(false)}>
                    <PlusSquare size={12} className="text-accent" />
                    <UserAvatar username={comment.author} size="w-3.5 h-3.5" />
                    <span className="font-bold text-[10px] sm:text-xs">{comment.author}</span>
                    <span className="text-[9px] text-text-secondary">({stats.count} hidden)</span>
                </div>
            ) : (
                <div className="flex flex-col animate-fade-in">
                    <div className="flex gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <button onClick={() => setIsCollapsed(true)} className="text-text-secondary opacity-50"><MinusSquare size={12}/></button>
                                <UserAvatar username={comment.author} size="w-4 h-4 sm:w-5 h-5" onClick={() => onUserClick(comment.author)} />
                                <span className="font-bold text-text-primary text-[11px] sm:text-xs truncate max-w-[80px]" onClick={() => onUserClick(comment.author)}>u/{comment.author}</span>
                                <span className="text-text-secondary text-[9px] sm:text-[10px]">{timeAgo(comment.timestamp)}</span>
                                {comment.editHistory && comment.editHistory.length > 0 && <span className="text-[8px] sm:text-[9px] italic text-text-secondary">(edited)</span>}
                            </div>
                            <CensoredWrapper isCensored={isCensored} type="text">
                                {isEditing ? (
                                    <div className="mt-1 mb-2 animate-fade-in"><textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-bg-card border border-border-custom rounded p-2 text-xs sm:text-sm text-text-primary focus:border-accent outline-none min-h-[60px]" autoFocus/><div className="flex gap-2 mt-1.5"><button onClick={handleEditSave} className="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded">Save</button><button onClick={() => setIsEditing(false)} className="px-2 py-1 bg-bg-card border border-border-custom text-text-secondary text-[10px] font-bold rounded">X</button></div></div>
                                ) : (<div className="text-text-secondary text-xs sm:text-sm whitespace-pre-wrap pl-1 border-l border-transparent transition-colors">{comment.text}</div>)}
                                {comment.image && !isEditing && <div className="mt-2 pl-1"><AttachmentDisplay data={comment.image} className="max-w-full sm:max-w-md" /></div>}
                            </CensoredWrapper>
                            <div className="flex flex-wrap gap-3 sm:gap-4 mt-2 items-center pl-1 text-[9px] sm:text-[10px] font-bold text-text-secondary">
                                <button onClick={() => { setReplyingTo(isReplying ? null : comment.id); setReplyText(''); setReplyFile(null); }} className={`flex items-center gap-1 ${isReplying ? 'text-accent' : ''}`}><MessageSquare size={10}/> Reply</button>
                                {isAuthor && !isEditing && <button onClick={() => setIsEditing(true)} className="flex items-center gap-1"><Edit2 size={10}/> Edit</button>}
                                {comment.editHistory && comment.editHistory.length > 0 && <button onClick={() => setShowHistory(true)} className="flex items-center gap-1"><History size={10}/> History</button>}
                                <button onClick={() => onSpinOff(comment)} className="flex items-center gap-1"><GitFork size={10}/> Spin-off</button>
                            </div>
                        </div>
                        {stats.count > 0 && <div className="pt-1"><HazardOctagon count={stats.count} depth={stats.depth} contributors={stats.contributors} hasHazard={stats.hasHazard} className="w-8 h-8 sm:w-12 sm:h-12" onClick={() => onSpinOff(comment)} /></div>}
                    </div>
                    {isReplying && (
                        <div className="mt-2 flex flex-col gap-2 p-2 bg-bg-core/50 border border-border-custom/50 rounded animate-fade-in">
                            {replyFile && <div className="mb-1"><AttachmentDisplay data={replyFile} className="max-w-[100px]" onClear={() => setReplyFile(null)} /></div>}
                            <div className="flex gap-2 items-center">
                                <input type="text" className="flex-1 bg-bg-core px-3 py-1.5 text-xs outline-none rounded border border-border-custom text-text-primary" placeholder={`Reply to ${comment.author}...`} value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitReply()} />
                                <button onClick={submitReply} className="bg-accent text-white p-1.5 rounded"><CornerDownRight size={14}/></button>
                                <button onClick={() => setReplyingTo(null)} className="text-text-secondary p-1.5"><X size={14}/></button>
                            </div>
                        </div>
                    )}
                    {comment.replies && comment.replies.length > 0 && (<div className="mt-1">{comment.replies.map(reply => (<CommentTree key={reply.id} comment={reply} postKey={postKey} depth={depth + 1} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyText={replyText} setReplyText={setReplyText} onReplySubmit={onReplySubmit} onUserClick={onUserClick} replyFile={replyFile} setReplyFile={setReplyFile} onSpinOff={onSpinOff} onEditComment={onEditComment} />))}</div>)}
                </div>
            )}
        </div>
    );
};