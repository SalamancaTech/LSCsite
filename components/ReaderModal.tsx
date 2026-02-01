import React, { useState, useRef, useMemo } from 'react';
import { X, MessageSquare, Send, Image as ImageIcon, Trash2, ArrowBigUp, Shield, Bot, Paperclip, ChevronLeft, AlertTriangle } from 'lucide-react';
import { CONTENT_DB } from '../constants';
import { InteractionState, UserPost, Comment } from '../types';
import { CommentTree, AttachmentDisplay, CensoredWrapper } from './SharedComponents';

interface ReaderModalProps {
    contentKey: string | null;
    spinOffTarget?: { postId: string, commentId: string } | null;
    onClose: () => void;
    interactions: InteractionState;
    onComment: (key: string, text: string, image?: string, parentId?: string, tags?: string[]) => void;
    userPosts?: UserPost[];
    onOpenPostModal?: (data?: {title?: string, body?: string, category?: string}) => void;
    onOpenSpinOff: (postId: string, commentId: string) => void;
}

const ALLOWED_FILE_TYPES = "image/*,application/pdf,.pdf,application/zip,.zip,.rar,application/x-rar-compressed,text/x-python,.py,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.tif,.tiff";

// Helper to find a comment recursively
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
    userPosts = [], 
    onOpenPostModal,
    onOpenSpinOff
}) => {
    // Main comment state
    const [commentText, setCommentText] = useState('');
    const [commentImage, setCommentImage] = useState<string | null>(null);
    const [isHazard, setIsHazard] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reply state for nesting
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyFile, setReplyFile] = useState<string | null>(null);

    // If neither active, return null
    if (!contentKey && !spinOffTarget) return null;

    // --- DETERMINE CONTENT MODE (Post vs Thread) ---
    
    let displayTitle = '';
    let displayBody = '';
    let displayAuthor = '';
    let displayTimestamp = 0;
    let displayImage: string | undefined = undefined;
    let isUserPost = false; // Controls formatting
    let interactionKey = ''; // The Key to update in interactions
    let commentsList: Comment[] = []; // The comments to display
    let rootCommentForThread: Comment | null = null; // If in thread mode
    let displayTags: string[] = [];

    if (spinOffTarget) {
        // --- THREAD MODE ---
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
            isUserPost = true; // Use the "Post" layout for the comment content
        } else {
            displayBody = "<p>Comment not found.</p>";
        }

    } else if (contentKey) {
        // --- POST MODE ---
        const userPost = userPosts.find(p => p.id === contentKey || p.title === contentKey);
        const staticContent = CONTENT_DB[contentKey];

        interactionKey = userPost ? userPost.id : contentKey;
        const interaction = interactions[interactionKey] || { votes: 0, userVote: 0, comments: [] };

        if (userPost) {
            displayTitle = userPost.title;
            displayBody = userPost.body;
            isUserPost = true;
            displayAuthor = userPost.author;
            displayTimestamp = userPost.timestamp;
            displayImage = userPost.image;
            displayTags = userPost.tags || [];
            commentsList = interaction.comments;
        } else if (staticContent) {
            displayTitle = staticContent.title;
            displayBody = staticContent.body;
            commentsList = interaction.comments;
        } else {
             displayBody = "<p>Content not found.</p>";
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCommentImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (commentText.trim() || commentImage) {
            // If in thread mode, parentId is the root comment ID
            const parentId = spinOffTarget ? spinOffTarget.commentId : undefined;
            onComment(interactionKey, commentText, commentImage || undefined, parentId, isHazard ? ['nsfw'] : []);
            setCommentText('');
            setCommentImage(null);
            setIsHazard(false);
        }
    };

    const handleReplySubmit = (postKey: string, parentId: string, tags?: string[]) => {
        if (!replyText.trim() && !replyFile) return;
        onComment(postKey, replyText, replyFile || undefined, parentId, tags);
        setReplyingTo(null);
        setReplyText('');
        setReplyFile(null);
    };

    const handleSpinOffClick = (comment: Comment) => {
        // Trigger the spin-off handler from App.tsx
        onOpenSpinOff(interactionKey, comment.id);
    };

    const isCensored = displayTags.includes('nsfw') || displayTags.includes('dark_arts');

    return (
        <div 
            className="fixed inset-0 z-[5000] flex justify-center items-center bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative w-[800px] max-w-[90vw] h-[80vh] bg-bg-core border border-border-custom octo-clip flex flex-col shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <style>{`
                    .octo-clip { clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px); }
                    .octo-btn { clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }
                    .octo-tag { clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px); }
                `}</style>

                {/* Header/Close */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-text-secondary hover:text-accent transition-colors bg-bg-core/50 rounded-full p-1"
                >
                    <X size={28} />
                </button>
                
                {/* Back Button (Only if Thread Mode active and we came from a post) */}
                {spinOffTarget && contentKey && (
                     <button 
                        onClick={onClose} // onClose acts as "Back" in thread mode
                        className="absolute top-4 left-4 z-10 text-text-secondary hover:text-accent transition-colors bg-bg-core/50 rounded-full p-1 flex items-center gap-1 pr-3"
                    >
                        <ChevronLeft size={28} />
                        <span className="text-sm font-bold">Back to Post</span>
                    </button>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pt-16">
                    
                    {isUserPost ? (
                        <div className="mb-8">
                             <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                                <span className="font-bold text-text-primary">u/{displayAuthor}</span>
                                {spinOffTarget && <span className="bg-bg-card border border-border-custom px-2 py-0.5 rounded text-[10px] font-bold text-text-secondary uppercase">Thread</span>}
                                {isCensored && <span className="text-[9px] text-red-500 border border-red-500 px-1 rounded uppercase font-bold">NSFW</span>}
                                <span>•</span>
                                <span>{new Date(displayTimestamp).toLocaleDateString()}</span>
                             </div>
                             <h1 className="text-3xl font-black text-text-primary mb-6 border-b border-border-custom pb-4">{displayTitle}</h1>
                             
                             <CensoredWrapper isCensored={isCensored} type="post">
                                 <div className="text-lg leading-relaxed text-text-primary whitespace-pre-wrap">{displayBody}</div>
                                 {displayImage && (
                                     <div className="mt-6">
                                         <AttachmentDisplay data={displayImage} className="max-w-full" />
                                     </div>
                                 )}
                             </CensoredWrapper>
                        </div>
                    ) : (
                        <div 
                            className="reader-body font-main text-lg leading-relaxed text-text-primary [&>h1]:text-accent [&>h1]:text-4xl [&>h1]:border-b [&>h1]:border-border-custom [&>h1]:pb-4 [&>h1]:mb-6 [&>h2]:text-2xl [&>h2]:mt-8 [&>h2]:mb-4 [&>p]:mb-4 [&>ol]:list-decimal [&>ol]:ml-8 [&>ul]:list-disc [&>ul]:ml-8 mb-12"
                            dangerouslySetInnerHTML={{ __html: displayBody.includes('<h1>') ? displayBody : `<h1>${displayTitle}</h1>${displayBody}` }}
                        />
                    )}

                    {/* Discussion Section */}
                    <div className="border-t border-border-custom pt-8 mt-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-secondary">
                            <MessageSquare /> {spinOffTarget ? 'Thread Replies' : 'Discussion'} ({commentsList.length})
                        </h3>

                        {/* Image Preview */}
                        {commentImage && (
                            <div className="mb-4 relative inline-block">
                                <img src={commentImage} alt="Preview" className="h-32 rounded-lg border border-border-custom" />
                                <button 
                                    onClick={() => setCommentImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {/* Main Comment Input */}
                        <div className="flex gap-2 mb-8 items-end">
                             <div className="relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept={ALLOWED_FILE_TYPES}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-3 octo-btn border border-border-custom transition-colors ${commentImage ? 'text-accent bg-accent/10 border-accent' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}
                                    title="Add Image"
                                >
                                    <Paperclip size={20} />
                                </button>
                            </div>

                            <div className="flex-1 bg-bg-card p-[1px] octo-btn focus-within:bg-accent transition-colors">
                                <input 
                                    type="text" 
                                    className="w-full h-full bg-bg-card px-4 py-3 outline-none octo-btn text-text-primary placeholder:text-text-secondary"
                                    placeholder={spinOffTarget ? `Reply to ${displayAuthor}...` : "Add to the discussion..."}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                />
                            </div>
                            
                            <button 
                                onClick={() => setIsHazard(!isHazard)}
                                className={`p-3 octo-btn border border-border-custom transition-colors ${isHazard ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-bg-card text-text-secondary hover:text-red-500'}`}
                                title="Mark Sensitive"
                            >
                                <AlertTriangle size={20} />
                            </button>

                            <button 
                                onClick={handleSubmit}
                                className="bg-accent text-white px-4 py-3 octo-btn hover:opacity-90 transition-opacity disabled:opacity-50"
                                disabled={!commentText && !commentImage}
                            >
                                <Send size={20} />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {commentsList.length === 0 && (
                                <p className="text-text-secondary italic">No replies yet.</p>
                            )}
                            {commentsList.map(c => (
                                <CommentTree 
                                    key={c.id} 
                                    comment={c} 
                                    postKey={interactionKey}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    onReplySubmit={handleReplySubmit}
                                    onUserClick={() => {}} // Placeholder
                                    replyFile={replyFile}
                                    setReplyFile={setReplyFile}
                                    onSpinOff={handleSpinOffClick}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};