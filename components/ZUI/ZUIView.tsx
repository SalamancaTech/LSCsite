import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SITE_STRUCTURE, CONTENT_DB, THEMES } from '../../constants';
import { InterfaceMode } from '../../types';

interface ZUIViewProps {
    openReader: (key: string) => void;
    currentTheme: string;
    onModeChange: (mode: InterfaceMode) => void;
    onThemeChange: (theme: string) => void;
}

function generateAbstractSVG(seed: string) {
    const hue = (seed.length * 50) % 360;
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${hue}, 20%, 20%)"/><circle cx="50" cy="50" r="40" fill="none" stroke="hsl(${hue}, 70%, 60%)" stroke-width="2" opacity="0.5"/><path d="M0 100 L100 0" stroke="hsl(${hue}, 70%, 60%)" stroke-width="1" opacity="0.3"/></svg>`;
}

export const ZUIView: React.FC<ZUIViewProps> = ({ openReader, currentTheme, onModeChange, onThemeChange }) => {
    // Refs for physics loop
    const stateRef = useRef({
        x: 0,
        y: 0,
        zoom: 0.5,
        targetX: 0,
        targetY: 0,
        targetZoom: 0.5,
        keys: { w: false, a: false, s: false, d: false, shift: false }
    });
    
    // Multi-touch tracking
    const touchStateRef = useRef({
        lastTouchX: 0,
        lastTouchY: 0,
        lastDist: 0,
        isPanning: false
    });

    const requestRef = useRef<number | null>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const cloudLayerRef = useRef<HTMLDivElement>(null);
    const introVisibleRef = useRef(true);

    // State for cycling mode (Cycle themes lens)
    const [isCycling, setIsCycling] = useState(false);
    const [blobPath, setBlobPath] = useState('');
    const mouseRef = useRef({ x: 0, y: 0 });

    const animate = useCallback(() => {
        const state = stateRef.current;
        const CONFIG = { minZoom: 0.2, maxZoom: 50.0, baseSpeed: 15, damping: 0.2 };
        
        // Keyboard Movement
        let speed = CONFIG.baseSpeed / state.zoom;
        if (state.keys.shift) speed *= 0.7;
        if (state.keys.w) state.targetY += speed;
        if (state.keys.s) state.targetY -= speed;
        if (state.keys.a) state.targetX += speed;
        if (state.keys.d) state.targetX -= speed;

        // Physics
        state.x += (state.targetX - state.x) * CONFIG.damping;
        state.y += (state.targetY - state.y) * CONFIG.damping;
        state.zoom += (state.targetZoom - state.zoom) * CONFIG.damping;

        // Apply Transform
        if (worldRef.current) {
            worldRef.current.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.zoom})`;
        }

        // Visibility Logic
        const detailLevel = state.zoom;
        const clouds = cloudLayerRef.current;
        
        const grids = document.querySelectorAll('.neighborhood-grid');
        grids.forEach((g) => {
             const el = g as HTMLElement;
             el.style.opacity = detailLevel > 3.5 ? '1' : '0';
             el.style.pointerEvents = detailLevel > 3.5 ? 'auto' : 'none';
        });

        if (clouds) {
             if (!introVisibleRef.current) {
                 clouds.style.opacity = '0';
                 clouds.style.pointerEvents = 'none';
             } else {
                 const cloudOpacity = Math.max(0, Math.min(1, 1.5 - detailLevel));
                 clouds.style.opacity = String(cloudOpacity);
                 clouds.style.pointerEvents = cloudOpacity < 0.1 ? 'none' : 'auto';
             }
        }

        requestRef.current = requestAnimationFrame(animate);
    }, []);

    // Blob Animation Loop
    useEffect(() => {
        let frame = 0;
        const animateBlob = (time: number) => {
            if (isCycling) {
                 const POINTS = 24, RADIUS_BASE = 140, VARIANCE = 70;
                 const getNoise = (i: number, t: number) => Math.sin(i * 0.4 + t) + Math.cos(i * 1.5 - t * 2) * 0.3;
                 const t = time * 0.0005;
                 let d = "";
                 const points = [];
                 for (let i = 0; i <= POINTS; i++) {
                     const angle = (Math.PI * i) / POINTS;
                     const r = RADIUS_BASE + getNoise(i, t) * VARIANCE;
                     points.push({ x: Math.sin(angle) * r, y: Math.cos(angle) * r });
                 }
                 const mx = mouseRef.current.x;
                 const my = mouseRef.current.y;
                 const safeY = Math.min(my, window.innerHeight - 300); 

                 if (points.length > 0) {
                    d += `M ${mx + points[0].x} ${safeY - points[0].y}`;
                    for (let i = 1; i < points.length; i++) d += ` L ${mx + points[i].x} ${safeY - points[i].y}`;
                    for (let i = points.length - 1; i >= 0; i--) d += ` L ${mx - points[i].x} ${safeY - points[i].y}`;
                    d += " Z";
                 }
                 setBlobPath(d);
            }
            frame = requestAnimationFrame(animateBlob);
        };
        frame = requestAnimationFrame(animateBlob);
        return () => cancelAnimationFrame(frame);
    }, [isCycling]);

    useEffect(() => {
        const timer = setTimeout(() => {
            introVisibleRef.current = false;
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey) {
                const keys = Object.keys(THEMES);
                const idx = keys.indexOf(currentTheme);
                const direction = e.deltaY > 0 ? 1 : -1;
                let nextIdx = (idx + direction) % keys.length;
                if (nextIdx < 0) nextIdx = keys.length - 1;
                onThemeChange(keys[nextIdx]);
                return;
            }

            const zoomSensitivity = 0.001;
            const state = stateRef.current;
            let newZoom = state.targetZoom - e.deltaY * zoomSensitivity;
            newZoom = Math.max(0.2, Math.min(50.0, newZoom));
            const scaleRatio = newZoom / state.targetZoom;
            const mouseX = e.clientX - window.innerWidth / 2;
            const mouseY = e.clientY - window.innerHeight / 2;
            state.targetX = state.targetX * scaleRatio + mouseX * (1 - scaleRatio);
            state.targetY = state.targetY * scaleRatio + mouseY * (1 - scaleRatio);
            state.targetZoom = newZoom;
        };

        // TOUCH GESTURES
        const handleTouchStart = (e: TouchEvent) => {
            const touch = touchStateRef.current;
            if (e.touches.length === 1) {
                touch.lastTouchX = e.touches[0].clientX;
                touch.lastTouchY = e.touches[0].clientY;
                touch.isPanning = true;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touch.lastDist = Math.sqrt(dx * dx + dy * dy);
                touch.isPanning = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = touchStateRef.current;
            const state = stateRef.current;

            if (e.touches.length === 1 && touch.isPanning) {
                const dx = e.touches[0].clientX - touch.lastTouchX;
                const dy = e.touches[0].clientY - touch.lastTouchY;
                state.targetX += dx;
                state.targetY += dy;
                touch.lastTouchX = e.touches[0].clientX;
                touch.lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const delta = dist - touch.lastDist;
                
                const zoomFactor = 0.005;
                let newZoom = state.targetZoom + delta * zoomFactor * state.targetZoom;
                newZoom = Math.max(0.2, Math.min(50.0, newZoom));
                
                // Zoom towards center of two fingers
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - window.innerWidth / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - window.innerHeight / 2;
                const scaleRatio = newZoom / state.targetZoom;
                
                state.targetX = state.targetX * scaleRatio + midX * (1 - scaleRatio);
                state.targetY = state.targetY * scaleRatio + midY * (1 - scaleRatio);
                state.targetZoom = newZoom;
                touch.lastDist = dist;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (k in stateRef.current.keys) stateRef.current.keys[k as keyof typeof stateRef.current.keys] = true;
            if (e.key === 'Control') setIsCycling(true);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            if (k in stateRef.current.keys) stateRef.current.keys[k as keyof typeof stateRef.current.keys] = false;
            if (e.key === 'Control') setIsCycling(false);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.pageX, y: e.pageY };
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 1) { 
                e.preventDefault();
                onModeChange('web2');
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, [animate, currentTheme, onThemeChange, onModeChange]);

    const RegionNode = ({ id, top, left, title, sub, colorVar, onClick, children, image }: any) => (
        <div 
            id={id}
            className="absolute group backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[280px] md:w-[320px] transition-all duration-500 hover:scale-110 hover:border-[color:var(--active-color)] hover:bg-bg-core/90 cursor-pointer flex flex-col items-center justify-center overflow-hidden"
            style={{ 
                top: top, 
                left: left, 
                '--active-color': `var(${colorVar})`,
                backgroundColor: 'color-mix(in srgb, var(--bg-card), transparent 20%)',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
            } as React.CSSProperties}
            onClick={onClick}
        >
            <div className="absolute inset-0 z-0">
                 <img src={image} className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-card/50 to-bg-card/90"></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase mb-1 drop-shadow-md text-white" style={{ textShadow: `0 0 20px var(${colorVar})` }}>{title}</h3>
                <div className="h-0.5 w-12 bg-current mb-3 opacity-80" style={{ color: `var(${colorVar})` }}></div>
                <p className="text-text-primary font-bold text-[10px] md:text-sm tracking-widest uppercase opacity-90">{sub}</p>
            </div>
            {children}
        </div>
    );

    const HouseNode = ({ title, desc, icon }: any) => (
        <div 
            className="house-node bg-bg-card/80 border border-border-custom rounded-lg p-2 overflow-hidden flex flex-col cursor-pointer transition-transform hover:scale-105 hover:border-accent min-h-[100px]"
            onClick={(e) => { e.stopPropagation(); openReader(title); }}
        >
            <div className="h-[60px] md:h-[80px] bg-black/20 overflow-hidden rounded mb-2 flex items-center justify-center">
                 {icon ? <span className="text-2xl md:text-3xl">{icon}</span> : <img src={generateAbstractSVG(title)} className="w-full h-full object-cover" alt="" />}
            </div>
            <h4 className="text-text-primary font-bold text-[11px] md:text-sm leading-tight line-clamp-2">{title}</h4>
            <div className="mt-auto pt-1 text-[8px] md:text-[10px] text-text-secondary uppercase">
                {desc}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full absolute top-0 left-0 overflow-hidden bg-bg-core transition-colors duration-500 touch-none">
            
            <div ref={worldRef} className="absolute top-1/2 left-1/2 w-0 h-0 preserve-3d will-change-transform">
                <div className="absolute w-[3000px] h-[2200px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center select-none pointer-events-none">
                    <img 
                        src="https://github.com/SalamancaTech/LSC_Homepage/blob/main/assets/0_Island%20Maps/01_Island_Basic01.png?raw=true" 
                        className="w-full h-full object-contain" 
                        alt="Map" 
                    />
                </div>

                <RegionNode 
                    id="region-club" top="0" left="0" 
                    title="The Club" sub="Central Hub" 
                    colorVar="--c-club" 
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/17_Club/17_Club_basic2.png"
                    onClick={() => openReader('Club')} 
                />

                <RegionNode 
                    id="region-info" top="-650px" left="0" 
                    title="Information" sub="Governance" 
                    colorVar="--c-info" 
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/11_Info/11_Info_basic.png"
                >
                    <div className="neighborhood-grid absolute inset-0 pt-20 px-4 pb-4 opacity-0 pointer-events-none grid grid-cols-2 gap-2 md:gap-4 bg-bg-core/95 backdrop-blur-xl rounded-xl transition-opacity duration-300 z-20 overflow-y-auto custom-scrollbar">
                         {(SITE_STRUCTURE['Information'].items || []).map((itemKey: string) => (
                             <HouseNode key={itemKey} title={itemKey} desc="Doc" icon="📜" />
                         ))}
                    </div>
                </RegionNode>

                <RegionNode 
                    id="region-resources" top="0" left="1000px" 
                    title="Resources" sub="The Toolkit" 
                    colorVar="--c-resources" 
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/12_Resources/12_Resources_basic1.png"
                >
                    <div className="neighborhood-grid absolute inset-0 pt-20 px-4 pb-4 opacity-0 pointer-events-none flex flex-col gap-3 bg-bg-core/95 backdrop-blur-xl rounded-xl transition-opacity duration-300 z-20 overflow-y-auto scrollbar-hide">
                        {Object.entries(SITE_STRUCTURE['Resources'].groups || {}).map(([cat, items]: [string, any]) => (
                            <div key={cat} className="rounded p-2 bg-black/5 border border-white/5">
                                <h4 className="text-[9px] md:text-[10px] uppercase tracking-wider text-accent mb-2 font-bold opacity-70">{cat}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {items.map((item: any) => <HouseNode key={item.title} title={item.title} desc={item.desc} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </RegionNode>

                <RegionNode 
                    id="region-forums" top="700px" left="700px" 
                    title="Forums" sub="Discuss" 
                    colorVar="--c-forums"
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/13_Forums/13_Forums_basic.png"
                    onClick={() => openReader('Forums')}
                />

                <RegionNode 
                    id="region-events" top="850px" left="0" 
                    title="Events" sub="Gather" 
                    colorVar="--c-events" 
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/14_Events/14_Events_basic.png"
                    onClick={() => openReader('Events')}
                />

                <RegionNode 
                    id="region-arts" top="700px" left="-700px" 
                    title="Arts" sub="Gallery" 
                    colorVar="--c-arts"
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/15_Arts/15_Arts_basic.png"
                    onClick={() => openReader('Arts')}
                />

                <RegionNode 
                    id="region-dark" top="-650px" left="-800px" 
                    title="Dark Arts" sub="Restricted" 
                    colorVar="--c-nsfw" 
                    image="https://raw.githubusercontent.com/salamancatech/lsc_homepage/main/assets/1_Regions/16_DA/16_DarkArts_basic1.png"
                    onClick={() => openReader('Dark Arts')}
                />
            </div>

            {/* CLOUD LAYER */}
            <div 
                ref={cloudLayerRef} 
                className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-700 px-6"
            >
                <div className="bg-bg-core/30 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] text-center shadow-[0_0_100px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-1000">
                    <h1 className="text-4xl md:text-8xl mb-4 md:mb-6 font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-accent to-text-primary drop-shadow-2xl font-main tracking-tighter">
                        Latent Space
                    </h1>
                    <p className="text-sm md:text-2xl text-text-secondary font-light tracking-[0.2em] uppercase">Accessing Hub...</p>
                </div>
                <div className="absolute bottom-10 md:bottom-20 left-1/2 -translate-x-1/2 text-accent font-bold tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-xs animate-pulse opacity-70 whitespace-nowrap">
                    PAN & PINCH TO EXPLORE
                </div>
            </div>

            {isCycling && (
                 <div className="fixed inset-0 pointer-events-none z-[9999] bg-bg-core mix-blend-color" style={{ clipPath: `url(#rorschach-clip)` }}></div>
            )}
            
            <svg width="0" height="0" className="absolute">
                <defs>
                    <clipPath id="rorschach-clip" clipPathUnits="userSpaceOnUse">
                        <path d={blobPath} />
                    </clipPath>
                </defs>
            </svg>
        </div>
    );
};