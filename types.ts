
export interface ContentItem {
    title: string;
    body: string;
}

export interface ContentDB {
    [key: string]: ContentItem;
}

export interface ResourceItem {
    title: string;
    desc: string;
    link: string;
}

export interface ResourceGroup {
    [category: string]: ResourceItem[];
}

export type InterfaceMode = 'zui' | 'classic' | 'web2';

export interface ThemeColors {
    '--bg-core': string;
    '--bg-card': string;
    '--text-primary': string;
    '--text-secondary': string;
    '--accent': string;
    '--border': string;
    '--font-main': string;
    
    // Category colors (static mostly, but good to include if we want to theme them)
    '--c-info': string;
    '--c-resources': string;
    '--c-forums': string;
    '--c-events': string;
    '--c-arts': string;
    '--c-nsfw': string;
    '--c-club': string;
}

export interface ThemeConfig {
    name: string;
    colors: ThemeColors;
}

export interface EditHistoryEntry {
    text: string;
    image?: string;
    timestamp: number;
}

export interface Comment {
    id: string;
    author: string;
    text: string;
    timestamp: number;
    image?: string;
    replies?: Comment[];
    tags?: string[]; // Added tags for hazard diamond
    editHistory?: EditHistoryEntry[];
}

export interface PostInteraction {
    votes: number;
    userVote: 0 | 1 | -1; // 0 none, 1 up, -1 down
    comments: Comment[];
    timestamp: number;
}

export type InteractionState = Record<string, PostInteraction>;

export interface UserPost {
    id: string;
    title: string;
    body: string;
    image?: string;
    category: string;
    timestamp: number;
    author: string;
    tags?: string[];
    editHistory?: EditHistoryEntry[];
}

// --- NEW PROFILE TYPES ---

export interface ArtPiece {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    timestamp: number;
}

export interface SubGallery {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    items: ArtPiece[];
}

export interface UserProfile {
    username: string;
    displayName: string;
    avatar: string;
    banner: string;
    bio: string;
    isCreator?: boolean;
    userTags?: string[];
    stats: {
        followers: number;
        following: number;
        posts: number;
    };
    galleries: SubGallery[]; // Self-made art organized in folders
    collection: ArtPiece[];  // Art made by others
    inspiration: ArtPiece[]; // Mood board
}