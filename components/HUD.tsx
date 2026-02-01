import React, { useState } from 'react';
import { InterfaceMode } from '../types';
import { THEMES } from '../constants';
import { Monitor, Palette, Menu, X, Plus, Minus } from 'lucide-react';

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const ModeButtons = () => (
        <div className="flex flex-col md:shadow-sm">
            <button 
                className={`font-mono text-[10px] md:text-xs px-2 py-2 md:py-3 border w-full text-center transition-colors relative border-border-custom hover:bg-white/5 ${currentMode === 'classic' ? 'bg-accent text-white' : 'bg-black/20'} rounded-t-lg`}
                onClick={() => { onModeChange('classic'); setIsMobileMenuOpen(false); }}
            >
                v1.0
            </button>
            <button 
                className={`font-mono text-[10px] md:text-xs px-2 py-2 md:py-3 border w-full text-center transition-colors relative border-border-custom hover:bg-white/5 ${currentMode === 'web2' ? 'bg-accent text-white' : 'bg-black/20'} -mt-px`}
                onClick={() => { onModeChange('web2'); setIsMobileMenuOpen(false); }}
            >
                v2.0
            </button>
            <button 
                className={`font-mono text-[10px] md:text-xs px-2 py-2 md:py-3 border w-full text-center transition-colors relative border-border-custom hover:bg-white/5 ${currentMode === 'zui' ? 'bg-accent text-white' : 'bg-black/20'} rounded-b-lg -mt-px`}
                onClick={() => { onModeChange('zui'); setIsMobileMenuOpen(false); }}
            >
                v3.0
            </button>
        </div>
    );

    const ThemeSelector = () => (
        <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto no-scrollbar py-2">
            <div className="text-[9px] md:text-[10px] uppercase font-bold text-center opacity-50 mb-1 tracking-widest">Theme</div>
            {Object.entries(THEMES).map(([key, config]) => (
                <button 
                    key={key}
                    className={`px-3 py-2 rounded-md font-semibold text-[11px] md:text-xs transition-all text-left truncate ${currentTheme === key ? 'bg-accent text-white' : 'hover:bg-white/10 text-text-secondary'}`}
                    onClick={() => { onThemeChange(key); setIsMobileMenuOpen(false); }}
                >
                    {config.name}
                </button>
            ))}
            <button className="px-3 py-2 rounded-md font-semibold text-[11px] md:text-xs transition-all text-left truncate hover:bg-white/10 text-text-secondary italic" onClick={onCycleMode}>Cycle Random</button>
        </div>
    );

    // Mobile Bottom/Floating HUD
    return (
        <>
            {/* Desktop HUD */}
            <div className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-[2000] flex-col gap-3 items-stretch p-3 rounded-xl backdrop-blur-md transition-all duration-300 w-32 shadow-2xl bg-bg-core/90 border border-border-custom text-text-primary">
                <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                <div className="text-[10px] uppercase font-bold text-center opacity-50 tracking-widest">Interface</div>
                <ModeButtons />
                <div className="w-full h-px bg-border-custom"></div>
                <ThemeSelector />
            </div>

            {/* Mobile Toggle Button */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden fixed bottom-6 right-6 z-[3000] w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[2500] bg-bg-core/95 backdrop-blur-lg flex flex-col items-center justify-center p-8 animate-fade-in">
                    <div className="w-full max-w-xs flex flex-col gap-8">
                         <div>
                            <h2 className="text-accent text-xs font-black uppercase tracking-[0.2em] mb-4 text-center">Switch Interface</h2>
                            <div className="grid grid-cols-3 gap-2">
                                {(['classic', 'web2', 'zui'] as InterfaceMode[]).map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => { onModeChange(m); setIsMobileMenuOpen(false); }}
                                        className={`py-4 rounded-xl border border-border-custom font-bold text-xs uppercase tracking-widest transition-all ${currentMode === m ? 'bg-accent border-accent text-white' : 'bg-bg-card text-text-secondary'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                         </div>

                         <div>
                            <h2 className="text-accent text-xs font-black uppercase tracking-[0.2em] mb-4 text-center">Visual Theme</h2>
                            <div className="grid grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                                {Object.entries(THEMES).map(([key, config]) => (
                                    <button 
                                        key={key}
                                        onClick={() => { onThemeChange(key); setIsMobileMenuOpen(false); }}
                                        className={`py-3 rounded-lg border border-border-custom text-xs font-bold transition-all ${currentTheme === key ? 'bg-accent border-accent text-white' : 'bg-bg-card text-text-secondary'}`}
                                    >
                                        {config.name}
                                    </button>
                                ))}
                            </div>
                         </div>

                         <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="mt-4 w-full py-4 text-text-secondary font-bold uppercase tracking-widest text-xs"
                         >
                            Close Menu
                         </button>
                    </div>
                </div>
            )}
        </>
    );
};