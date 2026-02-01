import React from 'react';
import { SITE_STRUCTURE, CONTENT_DB, CLASSIC_THEMES } from '../../constants';
import { UserPost } from '../../types';

interface ClassicViewProps {
    openReader: (key: string) => void;
    themeIndex: number;
    onToggleTheme: () => void;
    userPosts: UserPost[];
    onOpenPostModal: (data?: {title?: string, body?: string, category?: string}) => void;
    onOpenSpinOff: (postId: string, commentId: string) => void;
}

export const ClassicView: React.FC<ClassicViewProps> = ({ openReader, themeIndex, onToggleTheme, userPosts, onOpenPostModal, onOpenSpinOff }) => {
    const theme = CLASSIC_THEMES[themeIndex];

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
    `;

    const renderUserPosts = (category: string) => {
        const posts = userPosts.filter(p => p.category === category);
        if (posts.length === 0) return null;
        return (
            <div className="mt-4 pt-4 border-t border-inherit border-dashed">
                <b>*** Recent Guestbook Entries ({category}) ***</b>
                <ul className="list-square ml-6 mt-2">
                    {posts.map(post => (
                        <li key={post.id} className="mb-2">
                            <b>{post.title}</b> by {post.author} on {new Date(post.timestamp).toLocaleDateString()}
                            <br />
                            <span className="text-sm">"{post.body}"</span>
                            {post.image && <div className="text-xs">[Attached Image]</div>}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderSectionContent = (key: string, data: any) => {
        let content = null;
        if (data.type === 'single') {
            const item = CONTENT_DB[data.key];
            content = item ? <p dangerouslySetInnerHTML={{__html: item.body.replace(/<[^>]*>?/gm, '') + ` <a style="cursor:pointer; text-decoration:underline">[Read More]</a>`}} onClick={(e) => {if((e.target as HTMLElement).tagName === 'A') openReader(data.key)}}></p> : <p>Under construction.</p>;
        } else if (data.type === 'list') {
            content = (
                <ul className="list-disc ml-8">
                    {data.items.map((itemKey: string) => (
                        <li key={itemKey} className="mb-2">
                             <a onClick={() => openReader(itemKey)}>{CONTENT_DB[itemKey]?.title || itemKey}</a>
                        </li>
                    ))}
                </ul>
            );
        } else if (data.type === 'grouped') {
            content = (
                <table className="w-full border border-black border-collapse text-sm">
                    <tbody>
                        {Object.entries(data.groups).map(([category, items]: [string, any]) => (
                            <React.Fragment key={category}>
                                <tr>
                                    <td colSpan={2} className="bg-black text-white font-bold p-1 border border-black">{category}</td>
                                </tr>
                                {items.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-black p-1">
                                            <a onClick={() => openReader(item.title)}><b>{item.title}</b></a> - {item.desc}
                                        </td>
                                        <td className="border border-black p-1 text-center w-12">[LINK]</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            );
        }

        return (
            <div>
                {content}
                {renderUserPosts(key)}
            </div>
        );
    };

    return (
        <div className={`w-full h-full overflow-y-auto p-5 ${theme.class}`}>
            <style>{retroStyles}</style>
            
            <div className="classic-container max-w-[800px] mx-auto p-3 mb-12 relative">
                {/* Browser Toolbar Simulation */}
                <div className="flex justify-between items-center mb-4 border-b-2 border-inherit pb-2">
                    <h1 className="text-2xl font-bold uppercase m-0">Latent Space Club</h1>
                    <div className="throbber w-8 h-8 flex items-center justify-center text-lg shadow-inner">
                        <span className="throbber-icon">{theme.name === 'Netscape' ? 'N' : theme.name === 'AOL' ? 'e' : '*'}</span>
                    </div>
                </div>

                <div className="text-center mb-5">
                    <div className="bg-black text-[#ffff00] font-mono p-1 overflow-hidden border-2 border-inset border-white font-bold">
                         <div className="animate-marquee whitespace-nowrap">
                            <span>*** UNDER CONSTRUCTION *** WELCOME TO THE FUTURE OF ART *** SIGN THE GUESTBOOK ***</span>
                         </div>
                    </div>
                </div>

                <div className="classic-nav text-center mb-5 p-2 select-none flex flex-wrap justify-center gap-2">
                    {Object.keys(SITE_STRUCTURE).map(link => (
                        <button 
                            key={link}
                            onClick={() => document.getElementById(`classic-${link.toLowerCase()}`)?.scrollIntoView({behavior: 'smooth'})}
                            className="text-lg font-bold cursor-pointer bg-transparent border-none font-inherit underline"
                        >
                            [{link}]
                        </button>
                    ))}
                    <button onClick={() => onOpenPostModal()} className="text-lg font-bold cursor-pointer bg-transparent border-none font-inherit underline text-red-600 animate-pulse">
                        [NEW POST]
                    </button>
                    <button onClick={onToggleTheme} className="text-xs cursor-pointer bg-transparent border-none font-inherit ml-4">[Switch Style: {theme.name}]</button>
                </div>

                <table className="w-full border-collapse border-2 border-inset border-white">
                    <tbody>
                        <tr>
                            <td className="w-[150px] align-top bg-[#d0d0d0] p-3 border-r-2 border-inset border-white text-black hidden sm:table-cell">
                                <b>Links:</b><br/><br/>
                                <a href="#">Home</a><br/>
                                <a href="#">Webring</a><br/>
                                <a href="#">Email</a><br/><br/>
                                <b>Status:</b><br/>
                                Online<br/><br/>
                                <div className="border border-black bg-black text-red-500 font-mono text-center mt-4">
                                    02481
                                </div>
                            </td>
                            <td className="align-top p-5 bg-white text-black">
                                {Object.entries(SITE_STRUCTURE).map(([key, data]) => (
                                    <div key={key} id={`classic-${key.toLowerCase()}`} className="mb-8 scroll-mt-6">
                                        <h2 className="border-b border-black text-2xl mb-3 font-serif">{key}</h2>
                                        {renderSectionContent(key, data)}
                                    </div>
                                ))}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="text-center text-xs border-t border-black pt-3 mt-5">
                    (c) 1999 Latent Space Club. Best viewed in Netscape Navigator 4.0.
                </div>
            </div>
        </div>
    );
}