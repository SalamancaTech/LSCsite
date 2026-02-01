import React, { useState, useMemo, useEffect } from 'react';
import { THEMES, CONTENT_DB, SITE_STRUCTURE, GROUPED_RESOURCES, CLASSIC_THEMES } from './constants';
import { InterfaceMode, InteractionState, PostInteraction, Comment, UserPost } from './types';
import { HUD } from './components/HUD';
import { ZUIView } from './components/ZUI/ZUIView';
import { ClassicView } from './components/Classic/ClassicView';
import { Web2View } from './components/Web2/Web2View';
import { ReaderModal } from './components/ReaderModal';
import { CreatePostModal } from './components/CreatePostModal';

const LOREM_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const LOREM_LONG = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. \n\nCurabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, orci. In hac habitasse platea dictumst.";

const MOCK_PY = "data:text/x-python;base64,cHJpbnQoIkhlbGxvIExhdGVudCBTcGFjZSEiKQoKZGVmIGdlbmVyYXRlX2FydChzZWVkKToKICAgIHJldHVybiBmIkFydCBmb3Ige3NlZWR9Ig==";
const MOCK_PDF = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKICA8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAo3MCA1MCBUZAovRjEgMTIgVGYKKEhlbGxvLCB3b3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNTcgMDAwMDAgbiAKMDAwMDAwMDI1NSAwMDAwMCBuIAowMDAwMDAwMzQ0IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQxMwolJUVPRgo=";

const MOCK_USER_POSTS: UserPost[] = [
    {
        id: "post-mock-1",
        title: "The Future of Latent Interface Design",
        body: LOREM_LONG,
        category: "Club",
        author: "neural_net_ninja",
        timestamp: Date.now() - 3600000 * 2,
    },
    {
        id: "post-mock-2",
        title: "My latest generation (V6.0)",
        body: "Check out this landscape I generated using the new parameters. " + LOREM_SHORT,
        image: "https://picsum.photos/seed/latent1/800/600",
        category: "Arts",
        author: "guest_user",
        timestamp: Date.now() - 3600000 * 5,
    },
    {
        id: "post-mock-3",
        title: "Re: Is prompt engineering dead?",
        body: "> " + LOREM_SHORT + "\n\nI strongly disagree. The nuance is just shifting layer by layer.",
        category: "Forums",
        author: "latent_explorer",
        timestamp: Date.now() - 3600000 * 24,
    },
     {
        id: "post-mock-4",
        title: "Troubleshooting LoRA training errors",
        body: "I keep getting NaN loss after epoch 5. Here is my config. " + LOREM_SHORT,
        category: "Forums",
        author: "gpu_hoarder",
        timestamp: Date.now() - 3600000 * 48,
    },
    {
        id: "post-mock-5",
        title: "Hackathon 2025: Team Formation",
        body: "Looking for teammates for the upcoming event! " + LOREM_SHORT,
        category: "Events",
        author: "mod",
        timestamp: Date.now() - 3600000 * 72,
    }
];

// Helper to seed initial random data so it feels alive but consistent per session
const generateInitialInteractions = (): InteractionState => {
    const state: InteractionState = {};
    const allKeys = [
        ...Object.keys(CONTENT_DB),
        ...Object.values(GROUPED_RESOURCES).flat().map(r => r.title),
        ...MOCK_USER_POSTS.map(p => p.id)
    ];

    allKeys.forEach(key => {
        // Custom seeded comments for mock posts
        let comments: Comment[] = [];
        
        if (key === 'post-mock-1') {
            comments = [
                {
                    id: 'c-mock-1', author: 'latent_explorer', text: 'This is a fascinating take. I attached a related paper.', timestamp: Date.now() - 1000000,
                    image: MOCK_PDF,
                    tags: [],
                    replies: [
                        {
                            id: 'c-mock-1-r1', author: 'neural_net_ninja', text: 'Thanks! I wrote a script to analyze this.', timestamp: Date.now() - 500000,
                            image: MOCK_PY,
                            tags: [],
                            replies: [
                                 { id: 'c-mock-1-r1-r1', author: 'guest_user', text: 'Does this run on Python 3.11?', timestamp: Date.now() - 200000, replies: [] }
                            ]
                        },
                        {
                            id: 'c-mock-1-r2', author: 'gpu_hoarder', text: 'I ran this on my cluster. It works.', timestamp: Date.now() - 400000,
                            tags: [],
                            replies: []
                        }
                    ]
                }
            ];
        } else if (key === 'post-mock-4') {
            comments = [
                { id: 'c-mock-2', author: 'neural_net_ninja', text: 'Lower your learning rate by 10x.', timestamp: Date.now() - 2000000, replies: [] }
            ];
        } else {
             // Random noise with occasional nesting and tags
             if (Math.random() > 0.7) {
                 const hasReplies = Math.random() > 0.5;
                 const isNSFW = Math.random() > 0.9;
                 comments = [
                    { 
                        id: `c-${Math.random()}`, 
                        author: 'system_daemon', 
                        text: isNSFW ? 'Hidden content due to policy.' : 'Welcome to the latent space.', 
                        timestamp: Date.now() - 1000000, 
                        tags: isNSFW ? ['nsfw'] : [],
                        replies: hasReplies ? [
                            {
                                id: `c-${Math.random()}-r`,
                                author: 'guest_user',
                                text: 'Acknowledged.',
                                timestamp: Date.now() - 500000,
                                tags: [],
                                replies: []
                            }
                        ] : []
                    }
                ];
             }
        }

        state[key] = {
            votes: Math.floor(Math.random() * 500) + 10,
            userVote: 0,
            comments: comments,
            timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        };
    });
    return state;
};

function App() {
    const [mode, setMode] = useState<InterfaceMode>('web2');
    const [themeKey, setThemeKey] = useState<string>('default');
    const [classicThemeIndex, setClassicThemeIndex] = useState(0); // Lifted state for Classic Mode
    const [readerContent, setReaderContent] = useState<string | null>(null);
    const [spinOffTarget, setSpinOffTarget] = useState<{postId: string, commentId: string} | null>(null);
    
    // Social State
    const [interactions, setInteractions] = useState<InteractionState>({});
    const [userPosts, setUserPosts] = useState<UserPost[]>(MOCK_USER_POSTS); // Initialize with mock posts
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postModalData, setPostModalData] = useState<{title?: string, body?: string, category?: string} | undefined>(undefined);

    // Initialize data once on mount
    useEffect(() => {
        setInteractions(generateInitialInteractions());
    }, []);

    const activeTheme = useMemo(() => THEMES[themeKey] || THEMES['default'], [themeKey]);

    const openReader = (key: string) => setReaderContent(key);
    
    // Updated close handler to handle navigation stack (SpinOff -> Post -> Closed)
    const closeModal = () => {
        if (spinOffTarget) {
            setSpinOffTarget(null);
        } else {
            setReaderContent(null);
        }
    };

    const handleOpenSpinOff = (postId: string, commentId: string) => {
        setSpinOffTarget({ postId, commentId });
    };

    // Handlers
    const handleModeChange = (newMode: InterfaceMode) => {
        if (newMode === 'classic' && mode === 'classic') {
            // If clicking v1.0 while already in v1.0, cycle the classic themes (Browser Styles)
            setClassicThemeIndex(prev => (prev + 1) % CLASSIC_THEMES.length);
        } else {
            setMode(newMode);
        }
    };

    const handleVote = (key: string, direction: 1 | -1) => {
        setInteractions(prev => {
            const current = prev[key] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            let newVoteCount = current.votes;
            let newUserVote = current.userVote;

            if (current.userVote === direction) {
                // Toggle off
                newVoteCount -= direction;
                newUserVote = 0;
            } else {
                // Change vote
                newVoteCount = newVoteCount - current.userVote + direction;
                newUserVote = direction;
            }

            return {
                ...prev,
                [key]: {
                    ...current,
                    votes: newVoteCount,
                    userVote: newUserVote as 0 | 1 | -1
                }
            };
        });
    };

    const handleComment = (key: string, text: string, image?: string, parentId?: string, tags: string[] = []) => {
        const newComment: Comment = {
            id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            author: 'guest_user',
            text,
            timestamp: Date.now(),
            image,
            tags: tags,
            replies: []
        };
        
        setInteractions(prev => {
            const current = prev[key] || { votes: 0, userVote: 0, comments: [], timestamp: Date.now() };
            let updatedComments = [...current.comments];

            if (parentId) {
                const insertReply = (list: Comment[]): Comment[] => {
                    return list.map(c => {
                        if (c.id === parentId) {
                            return { ...c, replies: [...(c.replies || []), newComment] };
                        } else if (c.replies && c.replies.length > 0) {
                            return { ...c, replies: insertReply(c.replies) };
                        }
                        return c;
                    });
                };
                updatedComments = insertReply(updatedComments);
            } else {
                updatedComments = [newComment, ...updatedComments];
            }
            
            return {
                ...prev,
                [key]: {
                    ...current,
                    comments: updatedComments
                }
            };
        });
    };

    const handleAddPost = (postData: { title: string; body: string; category: string; image?: string; tags?: string[] }) => {
        const newPost: UserPost = {
            id: `post-${Date.now()}`,
            title: postData.title,
            body: postData.body,
            category: postData.category,
            image: postData.image,
            author: 'guest_user',
            timestamp: Date.now(),
            tags: postData.tags || []
        };
        
        setUserPosts(prev => [newPost, ...prev]);
        
        // Initialize interactions for the new post
        setInteractions(prev => ({
            ...prev,
            [newPost.id]: {
                votes: 1, // Start with 1 vote (self-vote)
                userVote: 1, // Auto-upvote own post
                comments: [],
                timestamp: Date.now()
            }
        }));
    };

    const handleOpenPostModal = (data?: {title?: string, body?: string, category?: string}) => {
        setPostModalData(data);
        setIsPostModalOpen(true);
    };

    // Construct style object from theme colors
    const themeStyles = useMemo(() => {
        return activeTheme.colors as React.CSSProperties;
    }, [activeTheme]);

    return (
        <div 
            style={themeStyles} 
            className="w-full h-screen overflow-hidden font-main text-text-primary bg-bg-core transition-colors duration-500"
        >
            {/* Main View Switcher */}
            {mode === 'zui' && <ZUIView openReader={openReader} currentTheme={themeKey} />}
            {mode === 'classic' && (
                <ClassicView 
                    openReader={openReader} 
                    themeIndex={classicThemeIndex}
                    onToggleTheme={() => setClassicThemeIndex(prev => (prev + 1) % CLASSIC_THEMES.length)}
                    userPosts={userPosts}
                    onOpenPostModal={() => handleOpenPostModal()}
                    onOpenSpinOff={handleOpenSpinOff}
                />
            )}
            {mode === 'web2' && (
                <Web2View 
                    openReader={openReader} 
                    interactions={interactions}
                    onVote={handleVote}
                    onComment={handleComment}
                    userPosts={userPosts}
                    onOpenPostModal={handleOpenPostModal}
                    onOpenSpinOff={handleOpenSpinOff}
                />
            )}

            {/* Overlays */}
            <HUD 
                currentMode={mode} 
                currentTheme={themeKey} 
                onModeChange={handleModeChange} 
                onThemeChange={setThemeKey}
                onCycleMode={() => {
                    const keys = Object.keys(THEMES);
                    const idx = keys.indexOf(themeKey);
                    setThemeKey(keys[(idx + 1) % keys.length]);
                }}
            />

            <ReaderModal 
                contentKey={readerContent} 
                spinOffTarget={spinOffTarget}
                onClose={closeModal} 
                interactions={interactions}
                onComment={handleComment}
                userPosts={userPosts}
                onOpenPostModal={handleOpenPostModal}
                onOpenSpinOff={handleOpenSpinOff}
            />

            {isPostModalOpen && (
                <CreatePostModal 
                    onClose={() => setIsPostModalOpen(false)} 
                    onSubmit={handleAddPost}
                    initialTitle={postModalData?.title}
                    initialBody={postModalData?.body}
                    initialCategory={postModalData?.category}
                />
            )}
        </div>
    );
}

export default App;