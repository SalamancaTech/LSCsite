import React, { useState } from 'react';
import { SITE_STRUCTURE, CONTENT_DB, CLASSIC_THEMES } from '../../constants';
import { UserPost } from '../../types';

interface ClassicViewProps {
    openReader: (key: string) => void;
    themeIndex: number;
    onToggleTheme: () => void;
    userPosts: UserPost[];
    onOpenPostModal: (data?: {title?: string, body?: string, category?: string}) => void;
    onOpenSpinOff: (postId: string, commentId: string) => void;
    onEditPost?: (postId: string, data: {title?: string, body?: string}) => void;
}

export const ClassicView: React.FC<ClassicViewProps> = ({ openReader, themeIndex, onToggleTheme, userPosts, onOpenPostModal, onOpenSpinOff, onEditPost }) => {
    const theme = CLASSIC_THEMES[themeIndex];
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', body: '' });

    const retroStyles = `
        .classic-netscape { background: #c0c0c0; color: #000000; font-family: 'Times New Roman', serif; }
        .classic-netscape .classic-container { background: #fff; border: 2px outset #ffffff; }
        .classic-netscape a { color: #0000ff; text-decoration: underline; cursor: pointer; }
        .classic-netscape .classic-nav { background: #e0e0e0; border: 2px outset #fff; }
        .classic-netscape .throbber { background: #000088; color: #fff; font-weight: bold; font-family: sans-serif; }
        
        .classic-aol { background: #000099; color: #ffff00; font-family: 'Comic Sans MS', cursive, sans-serif; }
        .classic-aol .classic-container { background: #0000cc; border: 4px ridge #0099ff; color: #ffffff; }
        .classic-aol a { color: #ffff00; font-weight: bold; cursor: pointer; }
        .classic-aol .classic-nav { background: #0000cc; border: 2px dashed #ffff00; }
        .classic-aol .throbber { background: #ffff00; color: #0000cc; border-radius: 50%; }

        .classic-angelfire { background: #000000; color: #00ff00; font-family: 'Courier Prime', monospace; background-image: radial-gradient(#111 15%, transparent 16%), radial-gradient(#111 15%, transparent 16%); background-size: 20px 20px; }
        .classic-angelfire .classic-container { background: #000; border: 1px solid #00ff00; }
        .classic-angelfire a { color: #ff00ff; text-decoration: none; cursor: pointer; }
        .classic-angelfire a:hover { background: #ff00ff; color: #000; }
        .classic-angelfire .classic-nav { border: 1px solid #00ff00; }
        .classic-angelfire .throbber { border: 1px solid #00ff00; color: #00ff00; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .throbber-icon { animation: spin 2s linear infinite; display: inline-block; }

        @media (max-width: 640px) {
            .classic-main-table { display: block; }
            .classic-main-table tbody, .classic-main-table tr { display: block; }
            .classic-sidebar { display: block; width: 100% !important; border-bottom: 2px solid white; margin-bottom: 10px; }
            .classic-content { display: block; padding: 15px !important; }
            .classic-nav { gap: 4px; padding: 5px; }
            .classic-nav button { font-size: 14px !important; }
        }
    `;

    const handleEditClick = (post: UserPost) => {
        setEditingPostId(post.id);
        setEditForm({ title: post.title, body: post.body });
    };

    const handleSaveEdit = (postId: string) => {
        if (onEditPost) { onEditPost(postId, editForm); }
        setEditingPostId(null);
    };

    const renderUserPosts = (category: string) => {
        const posts = userPosts.filter(p => p.category === category);
        if (posts.length === 0) return null;
        return (
            <div className="mt-4 pt-4 border-t border-inherit border-dashed">
                <b>*** Guestbook ({category}) ***</b>
                <ul className="list-square ml-4 sm:ml-6 mt-2">
                    {posts.map(post => {
                        const isEditing = editingPostId === post.id;
                        const isAuthor = post.author === 'guest_user';
                        if (isEditing) {
                            return (
                                <li key={post.id} className="mb-4 border border-current p-2">
                                    <div className="flex flex-col gap-2">
                                        <input type="text" value={editForm.title} onChange={e => setEditForm(prev => ({...prev, title: e.target.value}))} className="bg-transparent border border-current p-1 text-xs" />
                                        <textarea value={editForm.body} onChange={e => setEditForm(prev => ({...prev, body: e.target.value}))} className="bg-transparent border border-current p-1 min-h-[60px] text-xs" />
                                        <div className="flex gap-2 text-[10px]">
                                            <button onClick={() => handleSaveEdit(post.id)} className="underline">[Save]</button>
                                            <button onClick={() => setEditingPostId(null)} className="underline">[Cancel]</button>
                                        </div>
                                    </div>
                                </li>
                            );
                        }
                        return (
                            <li key={post.id} className="mb-3 text-xs sm:text-sm">
                                <b>{post.title}</b> <br/> <span className="opacity-80">By {post.author} on {new Date(post.timestamp).toLocaleDateString()}</span>
                                {isAuthor && <button onClick={() => handleEditClick(post)} className="ml-2 underline opacity-70">[Edit]</button>}
                                <div className="mt-1 italic">"{post.body}"</div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    const renderSectionContent = (key: string, data: any) => {
        let content = null;
        if (data.type === 'single') {
            const item = CONTENT_DB[data.key];
            content = item ? <p className="text-xs sm:text-base" dangerouslySetInnerHTML={{__html: item.body.replace(/<[^>]*>?/gm, '') + ` <a style="cursor:pointer; text-decoration:underline">[More]</a>`}} onClick={(e) => {if((e.target as HTMLElement).tagName === 'A') openReader(data.key)}}></p> : <p>Under construction.</p>;
        } else if (data.type === 'list') {
            content = (<ul className="list-disc ml-6 sm:ml-8 text-xs sm:text-base">{data.items.map((itemKey: string) => (<li key={itemKey} className="mb-1"><a onClick={() => openReader(itemKey)}>{CONTENT_DB[itemKey]?.title || itemKey}</a></li>))}</ul>);
        } else if (data.type === 'grouped') {
            content = (
                <div className="overflow-x-auto">
                    <table className="w-full border border-black border-collapse text-[10px] sm:text-sm">
                        <tbody>
                            {Object.entries(data.groups).map(([category, items]: [string, any]) => (
                                <React.Fragment key={category}>
                                    <tr><td colSpan={2} className="bg-black text-white font-bold p-1 border border-black uppercase tracking-tighter">{category}</td></tr>
                                    {items.map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-1"><a onClick={() => openReader(item.title)}><b>{item.title}</b></a></td>
                                            <td className="border border-black p-1 text-center w-10">[GO]</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        return (<div>{content}{renderUserPosts(key)}</div>);
    };

    return (
        <div className={`w-full h-full overflow-y-auto p-2 sm:p-5 ${theme.class}`}>
            <style>{retroStyles}</style>
            <div className="classic-container max-w-[800px] mx-auto p-2 sm:p-3 mb-12 relative">
                <div className="flex justify-between items-center mb-4 border-b-2 border-inherit pb-2">
                    <h1 className="text-sm sm:text-2xl font-bold uppercase m-0">Latent Space v1.0</h1>
                    <div className="throbber w-6 h-6 sm:w-8 h-8 flex items-center justify-center text-sm sm:text-lg">
                        <span className="throbber-icon">{theme.name[0]}</span>
                    </div>
                </div>

                <div className="text-center mb-4">
                    <div className="bg-black text-[#ffff00] font-mono p-1 overflow-hidden border-2 border-white text-[10px] sm:text-xs">
                         <div className="animate-marquee whitespace-nowrap"><span>*** WELCOME TO 1999 *** UNDER CONSTRUCTION *** BEST VIEWED IN 800x600 ***</span></div>
                    </div>
                </div>

                <div className="classic-nav text-center mb-4 p-1 sm:p-2 flex flex-wrap justify-center gap-1 sm:gap-2">
                    {Object.keys(SITE_STRUCTURE).map(link => (
                        <button key={link} onClick={() => document.getElementById(`classic-${link.toLowerCase()}`)?.scrollIntoView({behavior: 'smooth'})} className="text-xs sm:text-lg font-bold underline bg-transparent border-none">[{link}]</button>
                    ))}
                    <button onClick={() => onOpenPostModal()} className="text-xs sm:text-lg font-bold underline text-red-600 animate-pulse bg-transparent border-none">[NEW]</button>
                    <button onClick={onToggleTheme} className="text-[9px] sm:text-xs bg-transparent border-none ml-2">[{theme.name}]</button>
                </div>

                <table className="classic-main-table w-full border-collapse border-2 border-inset border-white">
                    <tbody>
                        <tr>
                            <td className="classic-sidebar w-[120px] sm:w-[150px] align-top bg-[#d0d0d0] p-3 border-r-2 border-inset border-white text-black">
                                <div className="text-[10px] sm:text-xs">
                                    <b>Quick Links:</b><br/>
                                    <a href="#">Home</a><br/>
                                    <a href="#">Webring</a><br/><br/>
                                    <b>Hit Counter:</b><br/>
                                    <div className="border border-black bg-black text-red-500 font-mono text-center mt-1 p-1">02481</div>
                                </div>
                            </td>
                            <td className="classic-content align-top p-3 sm:p-5 bg-white text-black">
                                {Object.entries(SITE_STRUCTURE).map(([key, data]) => (
                                    <div key={key} id={`classic-${key.toLowerCase()}`} className="mb-6 sm:mb-8 scroll-mt-2">
                                        <h2 className="border-b border-black text-lg sm:text-2xl mb-2 sm:mb-3 font-serif">{key}</h2>
                                        {renderSectionContent(key, data)}
                                    </div>
                                ))}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="text-center text-[9px] sm:text-xs border-t border-black pt-3 mt-5">Copyright (c) 1999 LSC. All rights reserved.</div>
            </div>
        </div>
    );
}