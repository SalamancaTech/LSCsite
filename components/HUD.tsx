
import React, { useState, useRef, useEffect } from 'react';
import { InterfaceMode } from '../types';
import { THEMES } from '../constants';
import { Monitor, Palette, LayoutGrid } from 'lucide-react';

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
    const [openMenu, setOpenMenu] = useState<'mode' | 'theme' | null>(null);
    const modeRef = useRef<HTMLDivElement>(null);
    const themeRef = useRef<HTMLDivElement>(null);

    // Only show HUD in ZUI mode
    if (currentMode !== 'zui') return null;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modeRef.current && !modeRef.current.contains(event.target as Node) && 
                themeRef.current && !themeRef.current.contains(event.target as Node)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Regular octagon clip path (approximate values for 8 equal sides)
    const octagonClip = "polygon(29.29% 0%, 70.71% 0%, 100% 29.29%, 100% 70.71%, 70.71% 100%, 29.29% 100%, 0% 70.71%, 0% 29.29%)";

    const HUDButton = ({ icon: Icon, label, active, onClick }: any) => (
        <div className="relative group">
            <button 
                onClick={onClick}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-lg ${active ? 'bg-accent text-white' : 'bg-black/50 text-text-primary hover:bg-accent/80'}`}
                style={{ clipPath: octagonClip }}
            >
                <Icon size={20} />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[10px] uppercase font-bold tracking-wider text-text-primary bg-black/80 px-2 py-1 rounded whitespace-nowrap z-50">
                {label}
            </div>
        </div>
    );

    const Dropdown = ({ title, children, right = false }: any) => (
        <div className={`absolute top-full ${right ? 'right-0' : 'left-0'} mt-4 p-4 bg-bg-card/90 backdrop-blur-xl border border-border-custom shadow-[0_0_30px_rgba(0,0,0,0.5)] w-64 animate-fade-in flex flex-col gap-2 z-[2000] rounded-xl`}>
             <div className="text-[10px] uppercase font-bold text-text-secondary tracking-[0.2em] mb-2 border-b border-border-custom pb-2 text-center">{title}</div>
             <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {children}
             </div>
        </div>
    );

    return (
        <div className="fixed top-4 right-4 z-[5000] flex gap-3 font-main">
            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 2px; }`}</style>
            
            {/* Interface Mode Switcher */}
            <div className="relative" ref={modeRef}>
                <HUDButton 
                    icon={LayoutGrid} 
                    label="View" 
                    active={openMenu === 'mode'} 
                    onClick={() => setOpenMenu(openMenu === 'mode' ? null : 'mode')} 
                />
                {openMenu === 'mode' && (
                    <Dropdown title="Interface System" right>
                        {['classic', 'web2', 'zui'].map((m) => (
                            <button
                                key={m}
                                onClick={() => { onModeChange(m as InterfaceMode); setOpenMenu(null); }}
                                className={`group flex items-center justify-between p-3 text-left uppercase text-xs font-bold tracking-wider border border-transparent transition-all relative overflow-hidden ${currentMode === m ? 'bg-accent text-white border-white/20' : 'bg-black/20 hover:bg-white/5 text-text-secondary hover:text-white'}`}
                                style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                            >
                                <span>v{m === 'classic' ? '1.0' : m === 'web2' ? '2.0' : '3.0'} // {m}</span>
                                {currentMode === m && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                            </button>
                        ))}
                    </Dropdown>
                )}
            </div>

            {/* Theme Switcher */}
            <div className="relative" ref={themeRef}>
                 <HUDButton 
                    icon={Palette} 
                    label="Theme" 
                    active={openMenu === 'theme'} 
                    onClick={() => setOpenMenu(openMenu === 'theme' ? null : 'theme')} 
                />
                {openMenu === 'theme' && (
                    <Dropdown title="Visual Theme" right>
                         {Object.entries(THEMES).map(([key, config]) => (
                            <button 
                                key={key}
                                onClick={() => { onThemeChange(key); setOpenMenu(null); }}
                                className={`flex items-center gap-3 p-2 rounded transition-colors ${currentTheme === key ? 'bg-white/10 text-accent' : 'hover:bg-white/5 text-text-secondary hover:text-text-primary'}`}
                            >
                                <div className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ background: config.colors['--bg-core'] }}></div>
                                <span className="text-xs font-bold uppercase">{config.name}</span>
                                {currentTheme === key && <Monitor size={12} className="ml-auto" />}
                            </button>
                        ))}
                        <button 
                            onClick={() => { onCycleMode(); setOpenMenu(null); }}
                            className="mt-2 p-2 text-center text-[10px] uppercase font-bold text-accent hover:text-white border border-accent/20 hover:bg-accent/10 rounded transition-colors"
                        >
                            Randomize
                        </button>
                    </Dropdown>
                )}
            </div>
        </div>
    );
};
