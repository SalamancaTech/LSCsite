
import { ContentDB, ResourceGroup, ThemeConfig, UserProfile } from './types';

export const LOGO_URL = "https://github.com/SalamancaTech/LSCsite/blob/main/components/icons/LSC_icon_small_01.png?raw=true";

export const CONTENT_DB: ContentDB = {
    "Charter": { title: "Community Charter", body: "<h1>Core Values</h1><p>We believe that AI is a tool for human expression, not a replacement for human spirit.</p><h2>Transparency</h2><p>We share workflows, prompts, and seeds openly. Gatekeeping is discouraged.</p><h2>Respect</h2><p>We critique the output, not the creator. Harassment is not tolerated.</p>" },
    "Rules": { title: "Code of Conduct", body: "<h1>Official Rules</h1><ol><li>No Hate Speech</li><li>Credit Artists</li><li>Label NSFW content appropriately</li></ol>" },
    "FAQ": { title: "Frequently Asked Questions", body: "<h1>FAQ</h1><p><strong>Q: How do I join?</strong><br>A: Just start creating and sharing.</p>" },
    "Contact": { title: "Contact Admin", body: "<h1>Reach Out</h1><p>Email: admin@latentspace.club</p>" },
    "Midjourney Docs": { title: "Midjourney Documentation", body: "<h1>MJ Docs</h1><p>Comprehensive guide to parameter tuning.</p>" },
    "Stable Diffusion": { title: "Stable Diffusion Guide", body: "<h1>SD Local Install</h1><p>How to run A1111 locally.</p>" },
    "Forums": { title: "Forums", body: "<h1>Discussion Board</h1><p>This is where the forum threads would live.</p>" },
    "Events": { title: "Events Calendar", body: "<h1>Upcoming Events</h1><p>Hackathon 2026 dates TBD.</p>" },
    "Arts": { title: "Art Gallery", body: "<h1>Member Showcase</h1><p>Gallery view goes here.</p>" },
    "Dark Arts": { title: "Dark Arts", body: "<h1>Restricted Section</h1><p>Experimental content. Proceed with caution.</p>" },
    "Club": { title: "The Club", body: "<h1>Welcome Home</h1><p>The central hub for all members.</p>" }
};

export const GROUPED_RESOURCES: ResourceGroup = {
    "Generative Art": [
        { title: "Midjourney Docs", desc: "Parameter guide", link: "#" },
        { title: "Stable Diffusion", desc: "Local generation", link: "#" },
        { title: "PromptHero", desc: "Inspiration", link: "#" }
    ],
    "Models & Training": [
        { title: "Hugging Face", desc: "Model hub", link: "#" },
        { title: "Civitai", desc: "Fine-tuning", link: "#" }
    ],
    "Tools": [
        { title: "ControlNet", desc: "Composition", link: "#" }
    ]
};

// Single Source of Truth for Navigation Structure
export const SITE_STRUCTURE: Record<string, { type: 'single' | 'list' | 'grouped', key?: string, items?: string[], groups?: ResourceGroup }> = {
    "Club": { type: "single", key: "Club" },
    "Information": { 
        type: "list", 
        items: ["Charter", "Rules", "FAQ", "Contact"] 
    },
    "Resources": { 
        type: "grouped", 
        groups: GROUPED_RESOURCES 
    },
    "Forums": { type: "single", key: "Forums" },
    "Events": { type: "single", key: "Events" },
    "Arts": { type: "single", key: "Arts" },
    "Dark Arts": { type: "single", key: "Dark Arts" }
};

const BASE_COLORS = {
    '--c-info': '#f97316',
    '--c-resources': '#3b82f6',
    '--c-forums': '#15803d',
    '--c-events': '#86efac',
    '--c-arts': '#a855f7',
    '--c-nsfw': '#94a3b8',
    '--c-club': '#ef4444',
};

export const THEMES: Record<string, ThemeConfig> = {
    default: {
        name: 'Default',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#0f172a',
            '--bg-card': '#1e293b',
            '--text-primary': '#f8fafc',
            '--text-secondary': '#94a3b8',
            '--accent': '#6366f1',
            '--border': '#334155',
            '--font-main': "'Inter', system-ui, -apple-system, sans-serif",
        }
    },
    cozy: {
        name: 'Cozy',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#2c2520',
            '--bg-card': '#3e3630',
            '--text-primary': '#e6e1db',
            '--text-secondary': '#d2a679',
            '--accent': '#d97757',
            '--border': '#5c4d44',
            '--font-main': "'Lora', serif",
        }
    },
    futuristic: {
        name: 'Futuristic',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#030712',
            '--bg-card': '#111827',
            '--text-primary': '#00ff41',
            '--text-secondary': '#008f11',
            '--accent': '#00ff41',
            '--border': '#003b00',
            '--font-main': "'Michroma', sans-serif",
        }
    },
    city: {
        name: 'City',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#18181b',
            '--bg-card': '#27272a',
            '--text-primary': '#f4f4f5',
            '--text-secondary': '#a1a1aa',
            '--accent': '#f59e0b',
            '--border': '#3f3f46',
            '--font-main': "'Montserrat', sans-serif",
        }
    },
    candy: {
        name: 'Candy',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#1f1016',
            '--bg-card': '#381a26',
            '--text-primary': '#fbcfe8',
            '--text-secondary': '#f472b6',
            '--accent': '#db2777',
            '--border': '#831843',
            '--font-main': "'Quicksand', sans-serif",
        }
    },
    nightmare: {
        name: 'Nightmare',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#000000',
            '--bg-card': '#1a0505',
            '--text-primary': '#ef4444',
            '--text-secondary': '#7f1d1d',
            '--accent': '#b91c1c',
            '--border': '#450a0a',
            '--font-main': "'Nosifer', cursive",
        }
    },
    'forest-light': {
        name: 'Forest Light',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#ecfdf5',
            '--bg-card': '#d1fae5',
            '--text-primary': '#064e3b',
            '--text-secondary': '#047857',
            '--accent': '#10b981',
            '--border': '#6ee7b7',
            '--font-main': "'Nunito', sans-serif",
        }
    },
    'forest-dark': {
        name: 'Forest Dark',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#022c22',
            '--bg-card': '#064e3b',
            '--text-primary': '#ecfdf5',
            '--text-secondary': '#a7f3d0',
            '--accent': '#d97706',
            '--border': '#065f46',
            '--font-main': "'Spectral', serif",
        }
    },
    'icy-cave': {
        name: 'Icy Cave',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#1e1b4b',
            '--bg-card': '#312e81',
            '--text-primary': '#c7d2fe',
            '--text-secondary': '#818cf8',
            '--accent': '#67e8f9',
            '--border': '#4338ca',
            '--font-main': "'Cinzel', serif",
        }
    },
    'icy-moon': {
        name: 'Icy Moon',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#f8fafc',
            '--bg-card': '#e2e8f0',
            '--text-primary': '#0f172a',
            '--text-secondary': '#475569',
            '--accent': '#3b82f6',
            '--border': '#cbd5e1',
            '--font-main': "'Audiowide', sans-serif",
        }
    },
    'desert-planet': {
        name: 'Desert Planet',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#451a03',
            '--bg-card': '#78350f',
            '--text-primary': '#fef3c7',
            '--text-secondary': '#fbbf24',
            '--accent': '#f59e0b',
            '--border': '#92400e',
            '--font-main': "'Orbitron', sans-serif",
        }
    },
    'desert-island': {
        name: 'Desert Island',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#134e4a',
            '--bg-card': '#115e59',
            '--text-primary': '#ccfbf1',
            '--text-secondary': '#5eead4',
            '--accent': '#fde047',
            '--border': '#2dd4bf',
            '--font-main': "'Permanent Marker', cursive",
        }
    },
    'digital-realm': {
        name: 'Digital Realm',
        colors: {
            ...BASE_COLORS,
            '--bg-core': '#000000',
            '--bg-card': '#001100',
            '--text-primary': '#00ff00',
            '--text-secondary': '#008f00',
            '--accent': '#00ff00',
            '--border': '#003300',
            '--font-main': "'VT323', monospace",
        }
    }
};

export const CLASSIC_THEMES = [
    { name: 'Netscape', class: 'classic-netscape', bg: '#c0c0c0', text: '#000000' },
    { name: 'AOL', class: 'classic-aol', bg: '#000099', text: '#ffff00' },
    { name: 'Angelfire', class: 'classic-angelfire', bg: '#000000', text: '#00ff00' }
];

// --- MOCK PROFILES ---

export const MOCK_PROFILES: Record<string, UserProfile> = {
    "neural_net_ninja": {
        username: "neural_net_ninja",
        displayName: "Neural Ninja",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ninja",
        banner: "https://picsum.photos/seed/ninja/800/300",
        bio: "Exploring the depths of the latent space. \nPrompt Engineer | Digital Surrealist",
        isCreator: true,
        userTags: ["Prompt Engineer", "3D Model", "VFX"],
        stats: { followers: 1205, following: 45, posts: 12 },
        galleries: [
            {
                id: "gal-1",
                title: "Cyberpunk Dreams",
                description: "Neon soaked streets and chrome reflections.",
                coverImage: "https://picsum.photos/seed/cyber/300/300",
                items: [
                    { id: "art-1", title: "Neo Tokyo", description: "Midjourney V6, Chaos 50", imageUrl: "https://picsum.photos/seed/neotokyo/600/600", timestamp: Date.now() },
                    { id: "art-2", title: "Chrome Heart", description: "Stable Diffusion XL", imageUrl: "https://picsum.photos/seed/chrome/600/600", timestamp: Date.now() - 100000 }
                ]
            },
            {
                id: "gal-2",
                title: "Organic Glitch",
                description: "Where nature meets code error.",
                coverImage: "https://picsum.photos/seed/glitch/300/300",
                items: [
                    { id: "art-3", title: "Fern Error", description: "Glitch LoRA", imageUrl: "https://picsum.photos/seed/fern/600/600", timestamp: Date.now() - 500000 }
                ]
            }
        ],
        collection: [
            { id: "col-1", title: "Saved Art 1", description: "By guest_user", imageUrl: "https://picsum.photos/seed/saved1/600/600", timestamp: Date.now() }
        ],
        inspiration: [
            { id: "insp-1", title: "Mood 1", description: "Color palette ref", imageUrl: "https://picsum.photos/seed/mood1/600/600", timestamp: Date.now() },
            { id: "insp-2", title: "Mood 2", description: "Lighting ref", imageUrl: "https://picsum.photos/seed/mood2/600/600", timestamp: Date.now() }
        ]
    },
    "guest_user": {
        username: "guest_user",
        displayName: "Guest Explorer",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=guest",
        banner: "https://picsum.photos/seed/guest/800/300",
        bio: "Just visiting this universe. \nLearning to prompt.",
        isCreator: false,
        userTags: ["Novice", "Explorer"],
        stats: { followers: 2, following: 1, posts: 0 },
        galleries: [],
        collection: [],
        inspiration: []
    },
    "latent_explorer": {
        username: "latent_explorer",
        displayName: "Latent Explorer",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=explorer",
        banner: "https://picsum.photos/seed/explore/800/300",
        bio: "Mapping the coordinates of imagination.",
        isCreator: true,
        userTags: ["Researcher", "Mod"],
        stats: { followers: 8500, following: 120, posts: 450 },
        galleries: [
             {
                id: "gal-3",
                title: "Landscapes",
                description: "Worlds that don't exist.",
                coverImage: "https://picsum.photos/seed/landscape/300/300",
                items: [
                     { id: "art-4", title: "Mars Oasis", description: "Terraforming concept", imageUrl: "https://picsum.photos/seed/mars/600/600", timestamp: Date.now() }
                ]
            }
        ],
        collection: [],
        inspiration: []
    }
};