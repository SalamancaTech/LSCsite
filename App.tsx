
import React, { useState, useMemo, useEffect } from 'react';
import { THEMES, CONTENT_DB, SITE_STRUCTURE, GROUPED_RESOURCES, CLASSIC_THEMES } from './constants';
import { InterfaceMode, InteractionState, PostInteraction, Comment, UserPost, EditHistoryEntry } from './types';
import { HUD } from './components/HUD';
import { ZUIView } from './components/ZUI/ZUIView';
import { ClassicView } from './components/Classic/ClassicView';
import { Web2View } from './components/Web2/Web2View';
import { ReaderModal } from './components/ReaderModal';
import { CreatePostModal } from './components/CreatePostModal';

const LOREM_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const LOREM_LONG = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const MOCK_PY = "data:text/x-python;base64,cHJpbnQoIkhlbGxvIExhdGVudCBTcGFjZSEiKQoKZGVmIGdlbmVyYXRlX2FydChzZWVkKToKICAgIHJldHVybiBmIkFydCBmb3Ige3NlZWR9Ig==";
const MOCK_PDF = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IDU=";

const MOCK_USER_POSTS: UserPost[] = [
    { id: "post-mock-1", title: "Future of Latent Interfaces", body: LOREM_LONG, category: "Club", author: "neural_net_ninja", timestamp: Date.now() - 3600000 * 2, },
    { id: "post-mock-2", title: "Latest Gen (V6.0)", body: "Check out this landscape. " + LOREM_SHORT, image: "https://picsum.photos/seed/latent1/800/600", category: "Arts", author: "guest_user", timestamp: Date.now() - 3600000 * 5, },
    { id: "post-mock-3", title: "Prompt Engineering is Evolving", body: "> " + LOREM_SHORT + "\n\nLayered shifting is the new meta.", category: "Forums", author: "latent_explorer", timestamp: Date.now() - 3600000 * 24, },
    { id: "post-mock-4", title: "LoRA Training Tips", body: "Avoid NaN loss by tuning your learning rate. " + LOREM_SHORT, category: "Forums", author: "gpu_hoarder", timestamp: Date.now() - 3600000 * 48, },
    { id: "post-mock-5", title: "Hackathon 2025 Teams", body: "Forming groups for the spring jam! " + LOREM_SHORT, category: "Events", author: "mod", timestamp: Date.now() - 3600000 * 72, }
];

const generateInitialInteractions = (): InteractionState => {
    const state: InteractionState = {};
    const allKeys = [...Object.keys(CONTENT_DB), ...Object.values(GROUPED_RESOURCES).flat().map(r => r.title), ...MOCK_USER_POSTS.map(p => p.id)];
    allKeys.forEach(key => {
        let comments: Comment[] = [];
        if (key === 'post-mock-1') {
            comments = [{ id: 'c-mock-1', author: 'latent_explorer', text: 'Fascinating. Check this related paper.', timestamp: Date.now() - 1000000, image: MOCK_PDF, replies: [{ id: 'c-mock-1-r1', author: 'neural_net_ninja', text: 'I wrote a script for that.', timestamp: Date.now() - 500000, image: MOCK_PY, replies: [] }] }];
        } else if (key === 'post-mock-4') {
            comments = [{ id: 'c-mock-2', author: 'neural_net_ninja', text: 'Lower LR by 10x.', timestamp: Date.now() - 2000000, replies: [] }];
        } else if (Math.random() > 0.8) {
            comments = [{ id: `c-${Math.random()}`, author: 'guest_user', text: 'Interesting take.', timestamp: Date.now() - 1000000, replies: [] }];
        }
        state[key] = { votes: Math.floor(Math.random() * 500) + 10, userVote: 0, comments: comments, timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000) };
    });
    return state;
};

function App() {
    const [mode, setMode] = useState<InterfaceMode>('web2');
    const [themeKey, setThemeKey] = useState<string>('default');
    const [classicThemeIndex, setClassicThemeIndex] = useState(0); 
    const [readerContent, setReaderContent] = useState<string | null>(null);
    const [spinOffTarget, setSpinOffTarget] = useState<{postId: string, commentId: string} | null>(null);
    const [interactions, setInteractions] = useState<InteractionState>({});
    const [userPosts, setUserPosts] = useState<UserPost[]>(MOCK_USER_POSTS); 
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postModalData, setPostModalData] = useState<{id?: string, title?: string, body?: string, category?: string, image?: string, tags?: string[]} | undefined>(undefined);

    useEffect(() => { setInteractions(generateInitialInteractions()); }, []);
    const activeTheme = useMemo(() => THEMES[themeKey] || THEMES['default'], [themeKey]);
    const openReader = (key: string) => setReaderContent(key);
    const closeModal = () => { if (spinOffTarget) { setSpinOffTarget(null); } else { setReaderContent(null); } };
    const handleOpenSpinOff = (postId: string, commentId: string) => { setSpinOffTarget({ postId, commentId }); };

    const handleModeChange = (newMode: InterfaceMode) => {
        if (newMode === 'classic' && mode === 'classic') { setClassicThemeIndex(prev => (prev + 1) % CLASSIC_THEMES.length); } 
        else { setMode(newMode); }
    };

    const handleVote = (key: string, direction: 1 | -1) => {
        setInteractions(prev => {
            const current = prev[key] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            let newVoteCount = current.votes; let newUserVote = current.userVote;
            if (current.userVote === direction) { newVoteCount -= direction; newUserVote = 0; } 
            else { newVoteCount = newVoteCount - current.userVote + direction; newUserVote = direction; }
            return { ...prev, [key]: { ...current, votes: newVoteCount, userVote: newUserVote as 0 | 1 | -1 } };
        });
    };

    const handleComment = (key: string, text: string, image?: string, parentId?: string, tags: string[] = []) => {
        const newComment: Comment = { id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`, author: 'guest_user', text, timestamp: Date.now(), image, tags: tags, replies: [] };
        setInteractions(prev => {
            const current = prev[key] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            let updatedComments = [...current.comments];
            if (parentId) {
                const insertReply = (list: Comment[]): Comment[] => list.map(c => { if (c.id === parentId) { return { ...c, replies: [...(c.replies || []), newComment] }; } else if (c.replies && c.replies.length > 0) { return { ...c, replies: insertReply(c.replies) }; } return c; });
                updatedComments = insertReply(updatedComments);
            } else { updatedComments = [newComment, ...updatedComments]; }
            return { ...prev, [key]: { ...current, comments: updatedComments } };
        });
    };

    const handleEditComment = (postKey: string, commentId: string, newText: string) => {
        setInteractions(prev => {
            const current = prev[postKey]; if (!current) return prev;
            const updateInList = (list: Comment[]): Comment[] => list.map(c => {
                if (c.id === commentId) {
                    if (c.text === newText) return c;
                    const historyEntry: EditHistoryEntry = { text: c.text, image: c.image, timestamp: Date.now() };
                    return { ...c, text: newText, editHistory: [historyEntry, ...(c.editHistory || [])] };
                }
                if (c.replies && c.replies.length > 0) { return { ...c, replies: updateInList(c.replies) }; }
                return c;
            });
            return { ...prev, [postKey]: { ...current, comments: updateInList(current.comments) } };
        });
    };

    const handlePostSubmit = (postData: { title: string; body: string; category: string; image?: string; tags?: string[] }) => {
        if (postModalData?.id) {
            setUserPosts(prev => prev.map(p => {
                if (p.id === postModalData.id) {
                    let newHistory = p.editHistory || [];
                    if (postData.body !== p.body || postData.image !== p.image) { newHistory = [{ text: p.body, image: p.image, timestamp: Date.now() }, ...newHistory]; }
                    return { ...p, ...postData, tags: postData.tags || [], editHistory: newHistory };
                }
                return p;
            }));
        } else {
            const newPost: UserPost = { id: `post-${Date.now()}`, title: postData.title, body: postData.body, category: postData.category, image: postData.image, author: 'guest_user', timestamp: Date.now(), tags: postData.tags || [] };
            setUserPosts(prev => [newPost, ...prev]);
            setInteractions(prev => ({ ...prev, [newPost.id]: { votes: 1, userVote: 1, comments: [], timestamp: Date.now() } }));
        }
        setIsPostModalOpen(false); setPostModalData(undefined);
    };

    const handleEditPost = (postId: string, data: {title?: string, body?: string}) => { setUserPosts(prev => prev.map(p => p.id === postId ? { ...p, ...data } : p)); };
    const handleOpenPostModal = (data?: {id?: string, title?: string, body?: string, category?: string, image?: string, tags?: string[]}) => { setPostModalData(data); setIsPostModalOpen(true); };
    const themeStyles = useMemo(() => activeTheme.colors as React.CSSProperties, [activeTheme]);

    return (
        <div style={themeStyles} className="w-full h-screen overflow-hidden font-main text-text-primary bg-bg-core transition-colors duration-500">
            {mode === 'zui' && (<ZUIView openReader={openReader} currentTheme={themeKey} onModeChange={handleModeChange} onThemeChange={setThemeKey} />)}
            {mode === 'classic' && (<ClassicView openReader={openReader} themeIndex={classicThemeIndex} onToggleTheme={() => setClassicThemeIndex(prev => (prev + 1) % CLASSIC_THEMES.length)} userPosts={userPosts} onOpenPostModal={handleOpenPostModal} onOpenSpinOff={handleOpenSpinOff} onEditPost={handleEditPost} onModeChange={handleModeChange} />)}
            {mode === 'web2' && (<Web2View openReader={openReader} interactions={interactions} onVote={handleVote} onComment={handleComment} onEditComment={handleEditComment} userPosts={userPosts} onOpenPostModal={handleOpenPostModal} onOpenSpinOff={handleOpenSpinOff} currentMode={mode} currentTheme={themeKey} onModeChange={handleModeChange} onThemeChange={setThemeKey} />)}
            
            <HUD currentMode={mode} currentTheme={themeKey} onModeChange={handleModeChange} onThemeChange={setThemeKey} onCycleMode={() => { const keys = Object.keys(THEMES); const idx = keys.indexOf(themeKey); setThemeKey(keys[(idx + 1) % keys.length]); }} />
            
            <ReaderModal contentKey={readerContent} spinOffTarget={spinOffTarget} onClose={closeModal} interactions={interactions} onComment={handleComment} onEditComment={handleEditComment} userPosts={userPosts} onOpenPostModal={handleOpenPostModal} onOpenSpinOff={handleOpenSpinOff} />
            
            {isPostModalOpen && (<CreatePostModal onClose={() => { setIsPostModalOpen(false); setPostModalData(undefined); }} onSubmit={handlePostSubmit} initialTitle={postModalData?.title} initialBody={postModalData?.body} initialCategory={postModalData?.category} initialImage={postModalData?.image} initialTags={postModalData?.tags} isEditing={!!postModalData?.id} />)}
        </div>
    );
}
export default App;
