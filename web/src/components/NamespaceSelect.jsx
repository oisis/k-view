import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../SettingsContext';

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
        ns.toLowerCase().includes(query.toLowerCase())
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
                className="flex items-center gap-2 bg-card border border-border text-primary text-sm rounded-lg px-3 py-2 hover:border-info focus:outline-none focus:ring-1 focus:ring-info transition-colors min-w-[200px] justify-between"
            >
                <span className="flex items-center gap-2">
                    {icons.nodes && <icons.nodes size={14} className="text-text-muted" />}
                    <span className="truncate">{displayValue}</span>
                </span>
                {icons.chevron_down && <icons.chevron_down size={14} className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
            </button>

            {open && rect && createPortal(
                <div 
                    id="namespace-portal-root"
                    style={{
                        position: 'fixed',
                        top: rect.bottom + 4,
                        left: rect.left,
                        width: Math.max(220, rect.width),
                        zIndex: 9999
                    }}
                    className="bg-[var(--bg-dropdown)] border border-border rounded-lg shadow-xl overflow-hidden"
                >
                    {/* Search input */}
                    <div className="p-2 border-b border-border">
                        <div className="flex items-center gap-2 bg-[var(--bg-input)] rounded px-2 py-1.5">
                            {icons.search && <icons.search size={13} className="text-text-muted shrink-0" />}
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search namespaces..."
                                className="bg-transparent text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] outline-none flex-1 w-full"
                            />
                            {query && (
                                <button onClick={() => setQuery('')}>
                                    {icons.close && <icons.close size={13} className="text-text-muted hover:text-secondary" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-xs text-text-muted text-center">No matches</li>
                        ) : (
                            filtered.map(ns => {
                                const value = ns === 'All namespaces' ? '' : ns;
                                const isSelected = selected === value;
                                const isSystem = ['kube-system', 'kube-public', 'kube-node-lease'].includes(ns);
                                return (
                                    <li
                                        key={ns}
                                        onClick={() => selectNs(ns)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors rounded-md mx-1
                      ${isSelected ? 'bg-accent text-white font-bold' : 'text-primary hover:bg-sidebar/20'}`}
                                    >
                                        {icons.nodes && <icons.nodes size={12} className={isSystem ? 'text-purple-400' : 'text-text-muted'} />}
                                        <span className="flex-1 text-left">{ns}</span>
                                        {isSystem && (
                                            <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-800/30 uppercase font-bold tracking-wider">system</span>
                                        )}
                                        {isSelected && <span className="text-accent text-xs text-right">✓</span>}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
