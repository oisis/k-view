import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../ThemeContext';
import { cn } from "@/lib/utils";

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

    if (items.length === 0) return <span className="text-muted-foreground italic text-xs">—</span>;

    const defaultStyle = type === 'images' 
        ? "bg-primary/10 text-primary border-primary/20" 
        : "bg-muted text-muted-foreground border-border";
    
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
                        className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all hover:brightness-95 active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis max-w-full border",
                            tagStyle
                        )}
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
                    className="text-[9px] font-semibold uppercase tracking-wider text-primary hover:underline transition-all w-fit mt-0.5"
                >
                    {isExpanded ? 'Less' : `More (${items.length - limit})`}
                </button>
            )}

            {tooltip.show && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setTooltip({ ...tooltip, show: false })}
                    />
                    
                    {/* Modal Content */}
                    <div 
                        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 fade-in duration-200"
                    >
                        <div className="flex items-center justify-between gap-4 mb-4 border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                {icons.info ? <icons.info size={18} className="text-primary" /> : <div className="w-4 h-4 bg-primary rounded-full" />}
                                <span className="text-sm font-semibold uppercase tracking-wider text-foreground">Detail View</span>
                            </div>
                            <button 
                                onClick={() => setTooltip({ ...tooltip, show: false })}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            >
                                {icons.x ? <icons.x size={20} /> : <span>✕</span>}
                            </button>
                        </div>
                        
                        <div className="bg-muted/30 p-4 rounded-xl border border-border">
                            <div className="text-sm font-mono text-foreground break-all max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar leading-relaxed">
                                {tooltip.content}
                            </div>
                        </div>

                        <div className="flex justify-end mt-6 gap-3">
                            <button
                                onClick={() => setTooltip({ ...tooltip, show: false })}
                                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleCopy(tooltip.content);
                                }}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg transition-all active:scale-95"
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
