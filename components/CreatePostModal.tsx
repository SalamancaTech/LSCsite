import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Send, AlertTriangle } from 'lucide-react';
import { SITE_STRUCTURE } from '../constants';

interface CreatePostModalProps {
    onClose: () => void;
    onSubmit: (post: { title: string; body: string; category: string; image?: string; tags?: string[] }) => void;
    initialCategory?: string;
    initialTitle?: string;
    initialBody?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
    onClose, 
    onSubmit, 
    initialCategory = 'Club',
    initialTitle = '',
    initialBody = ''
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [category, setCategory] = useState(initialCategory);
    const [image, setImage] = useState<string | null>(null);
    const [isHazard, setIsHazard] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !body.trim()) return;
        onSubmit({ 
            title, 
            body, 
            category, 
            image: image || undefined,
            tags: isHazard ? ['nsfw'] : [] 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[6000] flex justify-center items-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-[600px] max-w-[90vw] bg-bg-card border border-border-custom rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border-custom flex justify-between items-center bg-bg-core">
                    <h2 className="text-xl font-bold text-text-primary font-main">Create Post</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-accent"><X /></button>
                </div>
                
                <div className="p-6 flex flex-col gap-4 font-main">
                    {/* Category Select */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-text-secondary uppercase">Community</label>
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="bg-bg-core border border-border-custom rounded p-2 text-text-primary focus:border-accent outline-none"
                        >
                            {Object.keys(SITE_STRUCTURE).map(key => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                    </div>

                    <input 
                        type="text" 
                        placeholder="Title"
                        className="bg-bg-core border border-border-custom rounded p-3 text-lg font-bold text-text-primary focus:border-accent outline-none"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />

                    <textarea 
                        placeholder="What's on your mind?"
                        className="bg-bg-core border border-border-custom rounded p-3 min-h-[150px] text-text-primary focus:border-accent outline-none resize-none"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />

                    {image && (
                        <div className="relative inline-block self-start">
                            <img src={image} alt="Preview" className="max-h-40 rounded border border-border-custom" />
                            <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        <div className="flex gap-2">
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 text-text-secondary hover:text-text-primary px-3 py-2 rounded hover:bg-white/5 transition-colors"
                            >
                                <ImageIcon size={20} />
                                <span className="text-sm font-bold">Add Image</span>
                            </button>
                            
                            <button 
                                onClick={() => setIsHazard(!isHazard)}
                                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${isHazard ? 'bg-red-500/20 text-red-500' : 'text-text-secondary hover:text-red-500 hover:bg-white/5'}`}
                            >
                                <AlertTriangle size={20} />
                                <span className="text-sm font-bold">Mark Sensitive</span>
                            </button>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={!title.trim() || !body.trim()}
                            className="bg-accent text-white px-6 py-2 rounded-full font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send size={16} /> Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};