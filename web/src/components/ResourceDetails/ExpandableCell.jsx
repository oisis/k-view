import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../ThemeContext';

export default function ExpandableCell({ value, type }) {
    const [expanded, setExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const { activeTheme } = useTheme();
    const buttonRef = useRef(null);

    if (!value || value === '—') return <span className="text-text-muted">—</span>;

    const items = typeof value === 'string' ? value.split(',').map(s => s.trim()) : (Array.isArray(value) ? value : [String(value)]);
    if (items.length === 0) return <span className="text-text-muted">—</span>;

    const handleMouseEnter = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ top: rect.top - 10, left: rect.left });
        }
        setIsHovered(true);
    };

    const hideColor = activeTheme === 'light' ? 'var(--accent)' : 'var(--text-white)';

    return (
        <div className="relative group/expandable">
            <div className="flex flex-col gap-1 py-1 max-w-[300px]">
                {(expanded ? items : items.slice(0, 2)).map((it, idx) => (
                    <div key={idx} className="text-[12px] font-mono bg-transparent px-2 py-0.5 rounded text-secondary truncate" title={it}>
                        {it}
                    </div>
                ))}
                
                {items.length > 2 && (
                    !expanded ? (
                        <button
                            ref={buttonRef}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                            className="text-[11px] font-bold text-accent hover:text-primary mt-1 text-left px-1 flex items-center gap-1 active:scale-95"
                        >
                            Show all ({items.length})
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                            className="text-[11px] font-bold mt-1 text-left px-1 underline active:scale-95"
                            style={{ color: hideColor }}
                        >
                            Hide
                        </button>
                    )
                )}
            </div>

            {isHovered && !expanded && createPortal(
                <div 
                    style={{ 
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-100%)',
                        zIndex: 9999
                    }}
                    className="mb-2 bg-[var(--bg-tooltip)] border border-[var(--border-tooltip)] rounded-lg shadow-2xl p-3 min-w-[240px] pointer-events-none glass animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
                >
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-2 border-b border-[var(--border-tooltip)] pb-1">
                        {type === 'labels' ? 'Labels' : 'Images'}
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-2">
                        {items.map((it, idx) => (
                            <div key={idx} className="text-[12px] font-mono text-[var(--text-tooltip)] break-all leading-tight">
                                {it}
                            </div>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
