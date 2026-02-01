import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Send, AlertTriangle, Save } from 'lucide-react';
import { SITE_STRUCTURE } from '../constants';

interface CreatePostModalProps {
    onClose: () => void;
    onSubmit: (post: { title: string; body: string; category: string; image?: string; tags?: string[] }) => void;
    initialCategory?: string;
    initialTitle?: string;
    initialBody?: string;
    initialImage?: string;
    initialTags?: string[];
    isEditing?: boolean;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
    onClose, 
    onSubmit, 
    initialCategory = 'Club',
    initialTitle = '',
    initialBody = '',
    initialImage = '',
    initialTags = [],
    isEditing = false
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [category, setCategory] = useState(initialCategory);
    const [image, setImage] = useState<string | null>(initialImage || null);
    const [isHazard, setIsHazard] = useState(initialTags.includes('nsfw'));
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(initialTitle);
        setBody(initialBody);
        setCategory(initialCategory);
        setImage(initialImage || null);
        setIsHazard(initialTags.includes('nsfw'));
    }, [initialTitle, initialBody, initialCategory, initialImage, initialTags]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !body.trim()) return;
        onSubmit({ title, body, category, image: image || undefined, tags: isHazard ? ['nsfw'] : [] });
    };

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-center bg-black/85 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-full sm:w-[600px] h-full sm:h-auto bg-bg-card sm:border border-border-custom sm:rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-custom flex justify-between items-center bg-bg-core">
                    <h2 className="text-lg sm:text-xl font-bold text-text-primary uppercase tracking-widest">{isEditing ? 'Edit' : 'Create'} Post</h2>
                    <button onClick={onClose} className="text-text-secondary bg-bg-card/50 p-2 rounded-full"><X size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 font-main">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-text-secondary uppercase">Community</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-bg-core border border-border-custom rounded p-2 text-text-primary focus:border-accent outline-none text-sm" disabled={isEditing}>
                            {Object.keys(SITE_STRUCTURE).map(key => (<option key={key} value={key}>{key}</option>))}
                        </select>
                    </div>

                    <input type="text" placeholder="Title" className="bg-bg-core border border-border-custom rounded p-3 text-base sm:text-lg font-bold text-text-primary focus:border-accent outline-none" value={title} onChange={e => setTitle(e.target.value)} />
                    <textarea placeholder="Describe your creation..." className="flex-1 sm:flex-none bg-bg-core border border-border-custom rounded p-3 min-h-[150px] sm:min-h-[200px] text-sm sm:text-base text-text-primary focus:border-accent outline-none resize-none" value={body} onChange={e => setBody(e.target.value)} />

                    {image && (
                        <div className="relative inline-block self-start">
                            <img src={image} alt="Preview" className="max-h-32 sm:max-h-40 rounded border border-border-custom" />
                            <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"><X size={14}/></button>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 justify-between items-center pt-2 pb-6 sm:pb-0">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        <div className="flex gap-1 sm:gap-2">
                             <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-1.5 text-text-secondary px-2 sm:px-3 py-2 rounded border border-transparent ${image ? 'text-accent border-accent bg-accent/5' : 'hover:bg-white/5'}`}><ImageIcon size={18} /><span className="text-[10px] sm:text-xs font-bold uppercase">{image ? 'Change' : 'Image'}</span></button>
                             <button onClick={() => setIsHazard(!isHazard)} className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded border border-transparent ${isHazard ? 'bg-red-500/10 text-red-500 border-red-500' : 'text-text-secondary hover:text-red-500'}`}><AlertTriangle size={18} /><span className="text-[10px] sm:text-xs font-bold uppercase">NSFW</span></button>
                        </div>
                        <button onClick={handleSubmit} disabled={!title.trim() || !body.trim()} className="bg-accent text-white px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 flex items-center gap-2 active:scale-95 transition-transform">{isEditing ? <><Save size={16} /> Save</> : <><Send size={16} /> Post</>}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};