import React, { useState, useRef, useMemo } from 'react';
import { X, MessageSquare, Send, Image as ImageIcon, Trash2, ArrowBigUp, Shield, Bot, Paperclip, ChevronLeft, AlertTriangle, Edit2 } from 'lucide-react';
import { CONTENT_DB } from '../constants';
import { InteractionState, UserPost, Comment } from '../types';
import { CommentTree, AttachmentDisplay, CensoredWrapper } from './SharedComponents';

interface ReaderModalProps {
    contentKey: string | null;
    spinOffTarget?: { postId: string, commentId: string } | null;
    onClose: () => void;
    interactions: InteractionState;
    onComment: (key: string, text: string, image?: string, parentId?: string, tags?: string[]) => void;
    onEditComment?: (postKey: string, commentId: string, newText: string) => void;
    userPosts?: UserPost[];
    onOpenPostModal?: (data?: {id?: string, title?: string, body?: string, category?: string, image?: string, tags?: string[]}) => void;
    onOpenSpinOff: (postId: string, commentId: string) => void;
}

const ALLOWED_FILE_TYPES = "image/*,application/pdf,.pdf,application/zip,.zip,.rar,application/x-rar-compressed,text/x-python,.py,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.tif,.tiff";

const findComment = (comments: Comment[], id: string): Comment | null => {
    for (const c of comments) {
        if (c.id === id) return c;
        if (c.replies) {
            const found = findComment(c.replies, id);
            if (found) return found;
        }
    }
    return null;
};

export const ReaderModal: React.FC<ReaderModalProps> = ({ 
    contentKey, 
    spinOffTarget,
    onClose, 
    interactions, 
    onComment, 
    onEditComment,
    userPosts = [], 
    onOpenPostModal,
    onOpenSpinOff
}) => {
    const [commentText, setCommentText] = useState('');
    const [commentImage, setCommentImage] = useState<string | null>(null);
    const [isHazard, setIsHazard] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyFile, setReplyFile] = useState<string | null>(null);

    if (!contentKey && !spinOffTarget) return null;

    let displayTitle = '';
    let displayBody = '';
    let displayAuthor = '';
    let displayTimestamp = 0;
    let displayImage: string | undefined = undefined;
    let isUserPost = false; 
    let interactionKey = ''; 
    let commentsList: Comment[] = []; 
    let rootCommentForThread: Comment | null = null; 
    let displayTags: string[] = [];
    let postIdForEdit: string | undefined = undefined;
    let categoryForEdit: string | undefined = undefined;

    if (spinOffTarget) {
        interactionKey = spinOffTarget.postId;
        const postInteraction = interactions[interactionKey];
        if (postInteraction) {
            rootCommentForThread = findComment(postInteraction.comments, spinOffTarget.commentId);
        }
        if (rootCommentForThread) {
            displayTitle = `Thread by @${rootCommentForThread.author}`;
            displayBody = rootCommentForThread.text;
            displayAuthor = rootCommentForThread.author;
            displayTimestamp = rootCommentForThread.timestamp;
            displayImage = rootCommentForThread.image;
            displayTags = rootCommentForThread.tags || [];
            commentsList = rootCommentForThread.replies || [];
            isUserPost = true;
        } else { displayBody = "<p>Comment not found.</p>"; }
    } else if (contentKey) {
        const userPost = userPosts.find(p => p.id === contentKey || p.title === contentKey);
        const staticContent = CONTENT_DB[contentKey];
        interactionKey = userPost ? userPost.id : contentKey;
        const interaction = interactions[interactionKey] || { votes: 0, userVote: 0, comments: [] };

        if (userPost) {
            displayTitle = userPost.title; displayBody = userPost.body; isUserPost = true;
            displayAuthor = userPost.author; displayTimestamp = userPost.timestamp;
            displayImage = userPost.image; displayTags = userPost.tags || [];
            commentsList = interaction.comments; postIdForEdit = userPost.id; categoryForEdit = userPost.category;
        } else if (staticContent) {
            displayTitle = staticContent.title; displayBody = staticContent.body; commentsList = interaction.comments;
        } else { displayBody = "<p>Content not found.</p>"; }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCommentImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (commentText.trim() || commentImage) {
            const parentId = spinOffTarget ? spinOffTarget.commentId : undefined;
            onComment(interactionKey, commentText, commentImage || undefined, parentId, isHazard ? ['nsfw'] : []);
            setCommentText(''); setCommentImage(null); setIsHazard(false);
        }
    };

    const handleReplySubmit = (postKey: string, parentId: string, tags?: string[]) => {
        if (!replyText.trim() && !replyFile) return;
        onComment(postKey, replyText, replyFile || undefined, parentId, tags);
        setReplyingTo(null); setReplyText(''); setReplyFile(null);
    };

    const isCensored = displayTags.includes('nsfw') || displayTags.includes('dark_arts');
    const isAuthor = displayAuthor === 'guest_user';

    return (
        <div className="fixed inset-0 z-[5000] flex justify-center items-center bg-black/85 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="relative w-full sm:w-[800px] h-full sm:h-[80vh] bg-bg-core sm:border border-border-custom sm:octo-clip flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 z-20 text-text-secondary hover:text-accent bg-bg-core/50 rounded-full p-2"><X size={24} /></button>
                {spinOffTarget && contentKey && (<button onClick={onClose} className="absolute top-4 left-4 z-20 text-text-secondary hover:text-accent bg-bg-core/50 rounded-full p-2 flex items-center gap-1 pr-4"><ChevronLeft size={24} /><span className="text-xs font-bold uppercase">Back</span></button>)}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar pt-16">
                    {isUserPost ? (
                        <div className="mb-6 relative">
                             <div className="flex items-center gap-2 text-[10px] sm:text-sm text-text-secondary mb-2 flex-wrap">
                                <span className="font-bold text-text-primary">u/{displayAuthor}</span>
                                {spinOffTarget && <span className="bg-bg-card border border-border-custom px-1.5 py-0.5 rounded text-[8px] font-bold text-text-secondary uppercase">Thread</span>}
                                {isCensored && <span className="text-[8px] text-red-500 border border-red-500 px-1 rounded uppercase font-bold">NSFW</span>}
                                <span>•</span>
                                <span>{new Date(displayTimestamp).toLocaleDateString()}</span>
                                {isAuthor && !spinOffTarget && onOpenPostModal && (<button onClick={() => onOpenPostModal({ id: postIdForEdit, title: displayTitle, body: displayBody, category: categoryForEdit, image: displayImage, tags: displayTags })} className="ml-auto text-accent"><Edit2 size={14}/></button>)}
                             </div>
                             <h1 className="text-xl sm:text-3xl font-black text-text-primary mb-4 border-b border-border-custom pb-4">{displayTitle}</h1>
                             <CensoredWrapper isCensored={isCensored} type="post">
                                 <div className="text-sm sm:text-lg leading-relaxed text-text-primary whitespace-pre-wrap">{displayBody}</div>
                                 {displayImage && <div className="mt-4"><AttachmentDisplay data={displayImage} className="w-full rounded-xl" /></div>}
                             </CensoredWrapper>
                        </div>
                    ) : (
                        <div className="reader-body font-main text-base sm:text-lg leading-relaxed text-text-primary [&>h1]:text-2xl sm:[&>h1]:text-4xl [&>h1]:border-b [&>h1]:border-border-custom [&>h1]:pb-4 [&>h1]:mb-4 [&>h2]:text-xl sm:[&>h2]:text-2xl [&>p]:mb-4 mb-8" dangerouslySetInnerHTML={{ __html: displayBody.includes('<h1>') ? displayBody : `<h1>${displayTitle}</h1>${displayBody}` }} />
                    )}

                    <div className="border-t border-border-custom pt-6 mt-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-text-secondary"><MessageSquare size={20}/> Discussion ({commentsList.length})</h3>
                        {commentImage && (<div className="mb-4 relative inline-block"><img src={commentImage} alt="Preview" className="h-24 rounded border border-border-custom" /><button onClick={() => setCommentImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={10} /></button></div>)}
                        <div className="flex gap-2 mb-6 items-end">
                            <input type="file" ref={fileInputRef} accept={ALLOWED_FILE_TYPES} className="hidden" onChange={handleFileSelect} />
                            <button onClick={() => fileInputRef.current?.click()} className={`p-2.5 sm:p-3 octo-btn border border-border-custom ${commentImage ? 'text-accent border-accent' : 'bg-bg-card text-text-secondary'}`}><Paperclip size={20}/></button>
                            <div className="flex-1 bg-bg-card p-[1px] octo-btn focus-within:bg-accent transition-colors">
                                <input type="text" className="w-full h-full bg-bg-card px-4 py-2.5 sm:py-3 outline-none octo-btn text-text-primary text-sm" placeholder="Add a thought..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
                            </div>
                            <button onClick={handleSubmit} className="bg-accent text-white px-3 sm:px-4 py-2.5 sm:py-3 octo-btn disabled:opacity-50" disabled={!commentText && !commentImage}><Send size={20}/></button>
                        </div>

                        <div className="space-y-4 pb-12">
                            {commentsList.length === 0 && <p className="text-text-secondary italic text-xs">No replies yet.</p>}
                            {commentsList.map(c => (
                                <CommentTree key={c.id} comment={c} postKey={interactionKey} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyText={replyText} setReplyText={setReplyText} onReplySubmit={handleReplySubmit} onUserClick={() => {}} replyFile={replyFile} setReplyFile={setReplyFile} onSpinOff={(comment) => onOpenSpinOff(interactionKey, comment.id)} onEditComment={onEditComment} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};