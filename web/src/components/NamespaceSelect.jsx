import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../SettingsContext';
import { cn } from "@/lib/utils";

export default function NamespaceSelect({ namespaces, selected, onChange }) {
    const { icons } = useTheme();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [rect, setRect] = useState(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handle(e) {
            if (containerRef.current && containerRef.current.contains(e.target)) return;
            const dropdownPortal = document.getElementById('namespace-portal-root');
            if (dropdownPortal && dropdownPortal.contains(e.target)) return;
            setOpen(false);
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (open) inputRef.current?.focus();
        else setQuery('');
    }, [open]);

    const filtered = ['All namespaces', ...namespaces].filter(ns =>
        (ns || '').toLowerCase().includes((query || '').toLowerCase())
    );

    const selectNs = (ns) => {
        onChange(ns === 'All namespaces' ? '' : ns);
        setOpen(false);
    };

    const displayValue = selected === '' ? 'All namespaces' : selected;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={(e) => {
                    if (!open) setRect(e.currentTarget.getBoundingClientRect());
                    setOpen(o => !o);
                }}
                className="flex items-center gap-2 bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all min-w-[200px] justify-between shadow-sm"
            >
                <span className="flex items-center gap-2">
                    {icons.nodes && <icons.nodes size={14} className="text-muted-foreground" />}
                    <span className="font-medium truncate">{displayValue}</span>
                </span>
                {icons.chevron_down && <icons.chevron_down size={14} className={cn("text-muted-foreground transition-transform duration-200", open && "rotate-180")} />}
            </button>

            {open && rect && createPortal(
                <div 
                    id="namespace-portal-root"
                    style={{
                        position: 'fixed',
                        top: rect.bottom + 4,
                        left: (rect.left + Math.max(220, rect.width)) > window.innerWidth 
                            ? rect.right - Math.max(220, rect.width) 
                            : rect.left,
                        width: Math.max(220, rect.width),
                        zIndex: 9999
                    }}
                    className="bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                    {/* Search input */}
                    <div className="p-2 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2 py-1.5">
                            {icons.search && <icons.search size={13} className="text-muted-foreground shrink-0" />}
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search namespaces..."
                                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1 w-full font-medium"
                            />
                            {query && (
                                <button onClick={() => setQuery('')}>
                                    {icons.close && <icons.close size={13} className="text-muted-foreground hover:text-foreground" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-6 text-xs text-muted-foreground text-center italic font-medium">No matches found</li>
                        ) : (
                            filtered.map(ns => {
                                const value = ns === 'All namespaces' ? '' : ns;
                                const isSelected = selected === value;
                                const isSystem = ['kube-system', 'kube-public', 'kube-node-lease'].includes(ns || '');
                                return (
                                    <li
                                        key={ns}
                                        onClick={() => selectNs(ns)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-all rounded-lg mx-1 my-0.5",
                                            isSelected 
                                                ? "bg-accent text-accent-foreground font-bold shadow-sm" 
                                                : cn(
                                                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                                                    isSystem && "text-muted-foreground font-semibold hover:text-destructive"
                                                  )
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1 rounded",
                                            isSelected ? "bg-background/50" : "bg-muted/50"
                                        )}>
                                            {icons.nodes && <icons.nodes size={12} className={cn(isSelected ? "text-accent-foreground" : (isSystem ? "text-destructive" : "text-muted-foreground"))} />}
                                        </div>
                                        <span className="flex-1 text-left truncate">{ns}</span>
                                        {isSelected && <icons.check size={14} className="text-accent-foreground" />}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>,
                document.body
            )}
        </div>
    );
}
