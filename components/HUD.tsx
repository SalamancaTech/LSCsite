import React, { useState } from 'react';
import { InterfaceMode } from '../types';
import { THEMES } from '../constants';
import { Monitor, Palette } from 'lucide-react';

interface HUDProps {
    currentMode: InterfaceMode;
    currentTheme: string;
    onModeChange: (mode: InterfaceMode) => void;
    onThemeChange: (theme: string) => void;
    onCycleMode: () => void;
}

export const HUD: React.FC<HUDProps> = ({ 
    currentMode, 
    currentTheme, 
    onModeChange, 
    onThemeChange,
    onCycleMode
}) => {
    const [expandedMenu, setExpandedMenu] = useState<'mode' | 'theme' | null>(null);

    // ZUI LAYOUT - Preserving original design for ZUI
    if (currentMode === 'zui') {
        return (
            <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[2000] flex flex-col gap-3 items-stretch p-3 rounded-xl backdrop-blur-md transition-all duration-300 w-32 shadow-2xl bg-[#0f172a]/90 border border-[#334155] text-slate-300">
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <div className="text-[10px] uppercase font-bold text-center opacity-50 tracking-widest">Mode</div>
                <div className="flex flex-col shadow-sm">
                    <button 
                        className="font-mono text-[10px] px-2 py-2 border w-full text-center transition-colors relative border-[#334155] hover:bg-white/5 bg-black/20 rounded-t-lg"
                        onClick={() => onModeChange('classic')}
                    >
                        v1.0
                    </button>
                    <button 
                        className="font-mono text-[10px] px-2 py-2 border w-full text-center transition-colors relative border-[#334155] hover:bg-white/5 bg-black/20 -mt-px"
                        onClick={() => onModeChange('web2')}
                    >
                        v2.0
                    </button>
                    <button 
                        className="font-mono text-[10px] px-2 py-2 border w-full text-center transition-colors relative bg-accent text-white border-text-primary z-10 rounded-b-lg -mt-px"
                        onClick={() => onModeChange('zui')}
                    >
                        ZUI
                    </button>
                </div>

                <div className="w-full h-px bg-[#334155]"></div>

                <div className="flex flex-col gap-1 max-h-[50vh] overflow-y-auto no-scrollbar">
                     <div className="text-[10px] uppercase font-bold text-center opacity-50 mb-1 tracking-widest">Theme</div>
                    {Object.entries(THEMES).map(([key, config]) => (
                        <button 
                            key={key}
                            className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all text-left truncate ${currentTheme === key ? 'bg-accent text-white' : 'hover:bg-white/10 text-slate-400'}`}
                            onClick={() => onThemeChange(key)}
                        >
                            {config.name}
                        </button>
                    ))}
                    <button className="px-3 py-1.5 rounded-md font-semibold text-xs transition-all text-left truncate hover:bg-white/10 text-slate-400" onClick={onCycleMode}>Cycle</button>
                </div>
            </div>
        );
    }

    // CLASSIC LAYOUT - Minimal, just mode buttons, Retro style
    if (currentMode === 'classic') {
        return (
            <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[2000] flex flex-col gap-0 p-1 border-2 border-white bg-black/80 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]">
                 <div className="bg-white text-black text-[10px] font-bold text-center mb-1 py-0.5 font-mono">SYSTEM</div>
                 <button 
                    onClick={() => onModeChange('classic')}
                    className="px-3 py-1 bg-white text-black font-mono text-xs font-bold border border-black mb-0.5 hover:bg-gray-200"
                >
                    v1.0
                </button>
                <button 
                    onClick={() => onModeChange('web2')}
                    className="px-3 py-1 bg-black text-white border border-white font-mono text-xs font-bold mb-0.5 hover:bg-gray-800"
                >
                    v2.0
                </button>
                <button 
                    onClick={() => onModeChange('zui')}
                    className="px-3 py-1 bg-black text-white border border-white font-mono text-xs font-bold hover:bg-gray-800"
                >
                    ZUI
                </button>
            </div>
        );
    }

    // WEB2 LAYOUT - Expandable Icons
    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[2000] flex flex-col gap-4">
             <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* Mode Switcher */}
            <div className="relative">
                <button 
                    className={`w-12 h-12 bg-bg-card/80 backdrop-blur-md border border-border-custom rounded-xl shadow-lg flex items-center justify-center text-text-secondary hover:text-accent hover:scale-110 transition-all z-20 relative ${expandedMenu === 'mode' ? 'border-accent text-accent' : ''}`}
                    onClick={() => setExpandedMenu(expandedMenu === 'mode' ? null : 'mode')}
                    title="Interface Mode"
                >
                    <Monitor size={20} />
                </button>
                
                {/* Popout */}
                <div className={`absolute left-0 top-0 pl-16 pt-0 transition-all duration-300 ${expandedMenu === 'mode' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                     <div className="bg-bg-card/95 backdrop-blur-md border border-border-custom rounded-xl shadow-xl p-2 w-32 flex flex-col gap-1">
                        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1 px-2">View</div>
                        <button onClick={() => { onModeChange('classic'); setExpandedMenu(null); }} className="px-3 py-2 text-xs font-bold text-text-secondary hover:bg-white/10 rounded text-left transition-colors">v1.0 Retro</button>
                        <button onClick={() => { onModeChange('web2'); setExpandedMenu(null); }} className="px-3 py-2 text-xs font-bold text-bg-core bg-text-primary rounded text-left transition-colors">v2.0 Social</button>
                        <button onClick={() => { onModeChange('zui'); setExpandedMenu(null); }} className="px-3 py-2 text-xs font-bold text-text-secondary hover:bg-white/10 rounded text-left transition-colors">v3.0 ZUI</button>
                     </div>
                </div>
            </div>

            {/* Theme Switcher */}
            <div className="relative">
                <button 
                    className={`w-12 h-12 bg-bg-card/80 backdrop-blur-md border border-border-custom rounded-xl shadow-lg flex items-center justify-center text-text-secondary hover:text-accent hover:scale-110 transition-all z-20 relative ${expandedMenu === 'theme' ? 'border-accent text-accent' : ''}`}
                    onClick={() => setExpandedMenu(expandedMenu === 'theme' ? null : 'theme')}
                    title="Theme"
                >
                    <Palette size={20} />
                </button>

                {/* Popout */}
                 <div className={`absolute left-0 -top-24 pl-16 transition-all duration-300 ${expandedMenu === 'theme' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                     <div className="bg-bg-card/95 backdrop-blur-md border border-border-custom rounded-xl shadow-xl flex flex-col w-40 overflow-hidden">
                         <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider p-2 border-b border-border-custom/50 bg-black/10">Theme</div>
                         <div className="flex flex-col p-1 gap-0.5 max-h-[300px] overflow-y-auto no-scrollbar">
                            {Object.entries(THEMES).map(([key, config]) => (
                                <button 
                                    key={key}
                                    onClick={() => { onThemeChange(key); setExpandedMenu(null); }} 
                                    className={`px-3 py-2 text-xs font-bold rounded text-left flex items-center gap-2 transition-colors ${currentTheme === key ? 'bg-accent text-white' : 'text-text-secondary hover:bg-white/5'}`}
                                >
                                    <div className="w-2 h-2 rounded-full border border-white/20" style={{background: config.colors['--bg-core']}}></div>
                                    {config.name}
                                </button>
                            ))}
                         </div>
                     </div>
                </div>
            </div>

        </div>
    );
};