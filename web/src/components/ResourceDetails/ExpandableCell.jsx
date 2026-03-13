import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../ThemeContext';
import { cn } from "@/lib/utils";

/**
 * ExpandableCell - Option 1: Inline label + counter below
 * Displays only one line of labels to keep the table compact.
 * If more than 2 items exist, shows a "+ N more" counter below.
 */
export default function ExpandableCell({ value, type, customStyle, icons: propIcons }) {
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

    // Show only the first item in the main view
    const firstItem = items[0];
    const hasMore = items.length > 2;
    const remainingCount = items.length - 1;

    return (
        <div className="flex flex-col gap-0.5 w-full">
            {/* The single visible label */}
            <div
                className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all hover:brightness-95 active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis max-w-full border w-fit",
                    tagStyle
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    setTooltip({ show: true, content: items.join('\n') });
                }}
            >
                {firstItem}
            </div>
            
            {/* The counter badge below */}
            {hasMore && (
                <div 
                    className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1 cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        setTooltip({ show: true, content: items.join('\n') });
                    }}
                >
                    + {remainingCount} more
                </div>
            )}

            {/* Detail Modal (identical to previous for consistency) */}
            {tooltip.show && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setTooltip({ ...tooltip, show: false })} />
                    <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl p-6">
                        <div className="flex items-center justify-between gap-4 mb-4 border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                {icons.info ? <icons.info size={18} className="text-primary" /> : <div className="w-4 h-4 bg-primary rounded-full" />}
                                <span className="text-sm font-semibold uppercase tracking-wider text-foreground">Complete List</span>
                            </div>
                            <button onClick={() => setTooltip({ ...tooltip, show: false })} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                                {icons.x ? <icons.x size={20} /> : <span>✕</span>}
                            </button>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl border border-border">
                            <div className="text-sm font-mono text-foreground break-all max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar leading-relaxed">
                                {items.map((it, idx) => <div key={idx} className="mb-1 pb-1 border-b border-border/20 last:border-0">{it}</div>)}
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={() => setTooltip({ ...tooltip, show: false })} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg active:scale-95 transition-all">Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
