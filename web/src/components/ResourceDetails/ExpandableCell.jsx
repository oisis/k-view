import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../ThemeContext';

/**
 * ExpandableCell component for displaying long lists of labels, annotations, or images
 */
export default function ExpandableCell({ value, type, customStyle, icons: propIcons, limit = 2 }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [tooltip, setTooltip] = useState({ show: false, content: '' });
    const { icons: themeIcons } = useTheme();
    const icons = propIcons || themeIcons || {};

    const items = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',').map(s => s.trim()).filter(Boolean)
            : Object.entries(value || {}).map(([k, v]) => `${k}: ${v}`);

    if (items.length === 0) return <span className="text-text-muted italic">—</span>;

    const defaultStyle = type === 'images' 
        ? "bg-accent/10 text-accent border-accent/20" 
        : "bg-info/10 text-info border-info/20";
    
    const tagStyle = customStyle || defaultStyle;

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
    };

    const displayItems = isExpanded ? items : items.slice(0, limit);
    const hasMore = items.length > limit;

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className={`flex ${isExpanded ? 'flex-col' : 'flex-wrap'} gap-1`}>
                {displayItems.map((it, idx) => (
                    <div
                        key={idx}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer transition-all hover:brightness-110 active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${tagStyle}`}
                        onClick={(e) => {
                            setTooltip({
                                show: true,
                                content: it
                            });
                        }}
                    >
                        {it}
                    </div>
                ))}
            </div>
            
            {hasMore && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                    className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors w-fit mt-0.5"
                >
                    {isExpanded ? 'Less' : `More (${items.length - limit})`}
                </button>
            )}

            {tooltip.show && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setTooltip({ ...tooltip, show: false })}
                    />
                    
                    {/* Modal Content */}
                    <div 
                        className="relative w-full max-w-2xl bg-[var(--bg-sidebar)] border border-border shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 fade-in duration-200"
                    >
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                {icons.info ? <icons.info size={18} className="text-accent" /> : <div className="w-4 h-4 bg-accent rounded-full" />}
                                <span className="text-sm font-black uppercase tracking-widest text-primary">Detail View</span>
                            </div>
                            <button 
                                onClick={() => setTooltip({ ...tooltip, show: false })}
                                className="p-2 rounded-lg hover:bg-sidebar/50 text-text-muted hover:text-primary transition-all"
                            >
                                {icons.x ? <icons.x size={20} /> : <span>✕</span>}
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-xl border border-border/30">
                            <div className="text-sm font-mono text-primary break-all max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar leading-relaxed">
                                {tooltip.content}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 gap-3">
                            <button
                                onClick={() => setTooltip({ ...tooltip, show: false })}
                                className="px-4 py-2 text-sm font-bold text-text-muted hover:text-primary transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleCopy(tooltip.content)}
                                className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-accent/20 transition-all active:scale-95"
                            >
                                {icons.clipboard ? <icons.clipboard size={16} /> : null}
                                Copy Full Entry
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
