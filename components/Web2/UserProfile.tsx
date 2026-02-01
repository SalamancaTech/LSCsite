import React, { useState } from 'react';
import { UserProfile, UserPost, InteractionState, ArtPiece, SubGallery } from '../../types';
import { ArrowLeft, Grid, List, Image as ImageIcon, Heart, MessageSquare, Shield, Star, Bookmark, Share2, ArrowBigUp, ArrowBigDown, Send, X, ChevronDown, Sparkles, Tag } from 'lucide-react';

interface UserProfileProps {
    profile: UserProfile;
    userPosts: UserPost[];
    onBack: () => void;
    interactions: InteractionState;
    onVote: (key: string, direction: 1 | -1) => void;
    onComment: (key: string, text: string, image?: string, parentId?: string) => void;
    openReader: (key: string) => void;
}

export const UserProfileView: React.FC<UserProfileProps> = ({ 
    profile, 
    userPosts, 
    onBack, 
    interactions, 
    onVote, 
    onComment,
    openReader
}) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'art' | 'collection' | 'inspiration'>('posts');
    const [selectedGallery, setSelectedGallery] = useState<SubGallery | null>(null);
    const [selectedArt, setSelectedArt] = useState<ArtPiece | null>(null);
    const [commentText, setCommentText] = useState('');
    
    // Toggle for demo purposes (simulates changing user settings if it's the current user)
    // In a real app this would trigger an API call.
    // We check if it's "guest_user" (ourselves) to allow toggling.
    const isSelf = profile.username === 'guest_user';
    const [isCreatorMode, setIsCreatorMode] = useState(!!profile.isCreator);

    const toggleCreatorMode = () => {
        if (!isSelf) return;
        setIsCreatorMode(!isCreatorMode);
        // HACK: Update the reference object for this session so it reflects in other components
        profile.isCreator = !isCreatorMode;
    };

    const renderPostList = () => {
        if (userPosts.length === 0) return <div className="p-8 text-center text-text-secondary italic">No posts yet.</div>;
        
        return userPosts.map(post => {
            const interaction = interactions[post.id] || { votes: 0, comments: [] };
            const TRUNCATE_LIMIT = 141;
            const shouldTruncate = post.body.length > TRUNCATE_LIMIT;

            return (
                <div key={post.id} className="mb-4 relative group cursor-pointer" onClick={() => openReader(post.id)}>
                     <div className="absolute inset-0 bg-border-custom group-hover:bg-accent octo-clip transition-colors"></div>
                     <div className="relative p-[1px] m-[1px] bg-bg-card octo-clip h-[calc(100%-2px)] w-[calc(100%-2px)]">
                        <div className="bg-bg-card p-4 octo-clip">
                            <div className="text-xs text-text-secondary mb-1">Posted in r/{post.category} • {new Date(post.timestamp).toLocaleDateString()}</div>
                            <div className="text-lg font-bold text-text-primary mb-2">{post.title}</div>
                            <div className="text-sm text-text-secondary">
                                {shouldTruncate ? `${post.body.substring(0, TRUNCATE_LIMIT)}` : post.body}
                                {shouldTruncate && (
                                    <button 
                                        className="ml-2 inline-flex items-center gap-1 bg-bg-core border border-border-custom px-2 py-0.5 text-[10px] uppercase font-bold text-accent hover:bg-accent hover:text-white transition-colors octo-btn"
                                    >
                                        ...Continue <ChevronDown size={10} className="-rotate-90"/>
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-4 mt-3 text-xs font-bold text-text-secondary">
                                <span className="flex items-center gap-1"><ArrowBigUp size={14}/> {interaction.votes}</span>
                                <span className="flex items-center gap-1"><MessageSquare size={14}/> {interaction.comments.length}</span>
                            </div>
                        </div>
                     </div>
                </div>
            );
        });
    };

    const renderArtModal = () => {
        if (!selectedArt) return null;
        const interaction = interactions[selectedArt.id] || { votes: 0, userVote: 0, comments: [] };
        const isUpvoted = interaction.userVote === 1;

        return (
            <div className="fixed inset-0 z-[6000] flex justify-center items-center bg-black/90 backdrop-blur-md animate-fade-in p-4" onClick={() => setSelectedArt(null)}>
                <div className="w-[1000px] max-w-full h-[85vh] bg-bg-core border border-border-custom flex flex-col md:flex-row octo-clip shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Image Side */}
                    <div className="flex-1 bg-black flex items-center justify-center p-4 relative border-b md:border-b-0 md:border-r border-border-custom">
                        <img src={selectedArt.imageUrl} className="max-w-full max-h-full object-contain" alt={selectedArt.title} />
                        <button onClick={() => setSelectedArt(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    {/* Details Side */}
                    <div className="w-full md:w-[350px] bg-bg-card flex flex-col h-full">
                        <div className="p-6 border-b border-border-custom bg-bg-core/50">
                            <h2 className="text-2xl font-bold text-text-primary mb-1">{selectedArt.title}</h2>
                            <p className="text-xs text-text-secondary mb-4 italic">{selectedArt.description}</p>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onVote(selectedArt!.id, 1)}
                                    className={`flex-1 py-2 octo-btn flex items-center justify-center gap-2 font-bold transition-colors ${isUpvoted ? 'bg-accent text-white' : 'bg-bg-core border border-border-custom text-text-secondary hover:text-primary'}`}
                                >
                                    <ArrowBigUp /> {interaction.votes}
                                </button>
                                <button className="p-2 octo-btn bg-bg-core border border-border-custom text-text-secondary hover:text-accent">
                                    <Bookmark size={20} />
                                </button>
                                <button className="p-2 octo-btn bg-bg-core border border-border-custom text-text-secondary hover:text-accent">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {interaction.comments.length === 0 && <div className="text-center text-text-secondary text-sm italic mt-10">No comments yet.</div>}
                            {interaction.comments.map(c => (
                                <div key={c.id} className="bg-bg-core/50 p-3 rounded text-sm border border-border-custom/30">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-accent text-xs">{c.author}</span>
                                        <span className="text-[10px] text-text-secondary">{new Date(c.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-text-primary">{c.text}</div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border-custom bg-bg-core/50">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Leave a comment..."
                                    className="flex-1 bg-bg-core border border-border-custom px-3 py-2 text-sm outline-none octo-btn text-text-primary"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    onKeyDown={e => {if(e.key === 'Enter' && commentText.trim()) { onComment(selectedArt!.id, commentText); setCommentText(''); }}}
                                />
                                <button 
                                    onClick={() => {if(commentText.trim()) { onComment(selectedArt!.id, commentText); setCommentText(''); }}}
                                    className="bg-accent text-white p-2 octo-btn hover:opacity-90"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderGalleryView = () => {
        // If viewing a specific sub-gallery folder
        if (selectedGallery) {
            return (
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedGallery(null)} className="mb-4 flex items-center gap-2 text-text-secondary hover:text-accent text-sm font-bold transition-colors">
                        <ArrowLeft size={16} /> Back to Galleries
                    </button>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-text-primary">{selectedGallery.title}</h2>
                        <p className="text-text-secondary">{selectedGallery.description}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedGallery.items.map(item => (
                            <div key={item.id} className="group relative aspect-square cursor-pointer" onClick={() => setSelectedArt(item)}>
                                <div className="absolute inset-0 bg-border-custom group-hover:bg-accent octo-clip transition-colors"></div>
                                <div className="absolute inset-[1px] bg-bg-core octo-clip overflow-hidden">
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                                        <span className="font-bold text-sm">{item.title}</span>
                                        <span className="text-[10px] uppercase tracking-wider mt-1 flex items-center gap-1"><Heart size={10} fill="currentColor"/> {(interactions[item.id]?.votes || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // List of Galleries (Folders)
        if (profile.galleries.length === 0) return <div className="p-12 text-center text-text-secondary italic border border-dashed border-border-custom rounded">No galleries created yet.</div>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {profile.galleries.map(gallery => (
                    <div key={gallery.id} className="group cursor-pointer" onClick={() => setSelectedGallery(gallery)}>
                        <div className="relative aspect-[4/3] mb-3">
                            {/* Stack effect */}
                            <div className="absolute top-2 -right-2 w-full h-full bg-border-custom/30 octo-clip"></div>
                            <div className="absolute top-1 -right-1 w-full h-full bg-border-custom/60 octo-clip"></div>
                            
                            {/* Main Cover */}
                            <div className="relative w-full h-full p-[1px] bg-border-custom group-hover:bg-accent transition-colors octo-clip">
                                <div className="w-full h-full bg-bg-card octo-clip overflow-hidden relative">
                                    <img src={gallery.coverImage} alt={gallery.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                        <div className="flex items-center gap-2 text-white/90">
                                            <ImageIcon size={14} />
                                            <span className="text-xs font-bold">{gallery.items.length} items</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-text-primary group-hover:text-accent transition-colors">{gallery.title}</h3>
                        <p className="text-xs text-text-secondary line-clamp-1">{gallery.description}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderGrid = (items: ArtPiece[]) => {
        if (items.length === 0) return <div className="p-12 text-center text-text-secondary italic border border-dashed border-border-custom rounded">Nothing here yet.</div>;
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
                {items.map(item => (
                    <div key={item.id} className="group relative aspect-square cursor-pointer" onClick={() => setSelectedArt(item)}>
                        <div className="absolute inset-0 bg-border-custom group-hover:bg-accent octo-clip transition-colors"></div>
                        <div className="absolute inset-[1px] bg-bg-core octo-clip overflow-hidden">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                                <span className="font-bold text-sm">{item.title}</span>
                                <span className="text-[10px] text-white/70 italic mt-1">{item.description}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full min-h-full bg-bg-core flex flex-col">
            {renderArtModal()}

            {/* Header Banner */}
            <div className="h-48 md:h-64 w-full bg-bg-card relative overflow-hidden">
                <img src={profile.banner} className="w-full h-full object-cover opacity-60" alt="Banner" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-core to-transparent"></div>
                <button 
                    onClick={onBack}
                    className="absolute top-4 left-4 bg-black/50 hover:bg-accent text-white p-2 rounded-full backdrop-blur-sm transition-colors z-20"
                >
                    <ArrowLeft />
                </button>
            </div>

            {/* Profile Info */}
            <div className="max-w-5xl mx-auto w-full px-4 -mt-16 md:-mt-20 relative z-10 mb-8">
                <div className="flex flex-col md:flex-row gap-6 items-end md:items-start">
                    {/* Avatar */}
                    <div className="p-1 bg-bg-core octo-avatar shrink-0 relative group/pfp">
                        <div className={`w-32 h-32 md:w-40 md:h-40 bg-bg-card octo-avatar overflow-hidden border-4 ${isCreatorMode ? 'border-accent creator-glow' : 'border-bg-core'}`}>
                            <img src={profile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            {isCreatorMode && <div className="creator-shimmer absolute inset-0 pointer-events-none"></div>}
                        </div>
                        {isSelf && (
                            <div className="absolute bottom-0 right-0 z-20">
                                <button 
                                    onClick={toggleCreatorMode}
                                    className={`p-2 rounded-full border border-border-custom shadow-lg transition-all active:scale-95 ${isCreatorMode ? 'bg-accent text-white' : 'bg-bg-card text-text-secondary hover:text-primary'}`}
                                    title={isCreatorMode ? "Creator Mode Active" : "Enable Creator Mode"}
                                >
                                    <Sparkles size={16} fill={isCreatorMode ? "currentColor" : "none"} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 flex flex-col gap-2 md:pt-20 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <h1 className="text-3xl font-black text-text-primary tracking-tight">{profile.displayName}</h1>
                            <span className="text-text-secondary text-sm">@{profile.username}</span>
                            {profile.username === 'neural_net_ninja' && <span className="inline-flex items-center gap-1 bg-accent text-white text-[10px] font-bold px-2 py-0.5 octo-tag"><Shield size={10} fill="currentColor"/> PRO</span>}
                        </div>
                        
                        {/* User Tags */}
                        {profile.userTags && profile.userTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {profile.userTags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 bg-bg-card border border-border-custom text-text-secondary text-[10px] font-bold px-2 py-1 octo-tag uppercase tracking-wide">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-text-primary whitespace-pre-wrap text-sm max-w-xl mt-1">{profile.bio}</p>
                        
                        <div className="flex gap-6 mt-2 justify-center md:justify-start text-sm">
                            <div className="flex flex-col">
                                <span className="font-bold text-text-primary">{profile.stats.followers}</span>
                                <span className="text-text-secondary text-xs uppercase tracking-wider">Followers</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-text-primary">{profile.stats.following}</span>
                                <span className="text-text-secondary text-xs uppercase tracking-wider">Following</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-text-primary">{userPosts.length + profile.galleries.reduce((acc, g) => acc + g.items.length, 0)}</span>
                                <span className="text-text-secondary text-xs uppercase tracking-wider">Creations</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-4 md:mb-0 md:pt-20">
                         <button className="bg-accent text-white px-6 py-2 octo-btn font-bold hover:opacity-90">Follow</button>
                         <button className="bg-bg-card border border-border-custom text-text-primary p-2 octo-btn hover:text-accent"><MessageSquare size={20} /></button>
                         <button className="bg-bg-card border border-border-custom text-text-primary p-2 octo-btn hover:text-accent"><Share2 size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Tab Nav */}
            <div className="border-b border-border-custom sticky top-14 bg-bg-core/95 backdrop-blur z-20 mb-6">
                <div className="max-w-5xl mx-auto flex gap-6 px-4 overflow-x-auto">
                    {[
                        { id: 'posts', label: 'Posts', icon: <List size={16} /> },
                        { id: 'art', label: 'Art Galleries', icon: <ImageIcon size={16} /> },
                        { id: 'collection', label: 'Collection', icon: <Bookmark size={16} /> },
                        { id: 'inspiration', label: 'Inspiration', icon: <Star size={16} /> }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setSelectedGallery(null); }}
                            className={`py-4 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto w-full px-4 pb-20">
                {activeTab === 'posts' && renderPostList()}
                {activeTab === 'art' && renderGalleryView()}
                {activeTab === 'collection' && renderGrid(profile.collection)}
                {activeTab === 'inspiration' && renderGrid(profile.inspiration)}
            </div>
        </div>
    );
};