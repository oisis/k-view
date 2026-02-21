import React, { useState, useEffect, useRef } from 'react';
import { Server, ChevronDown, X, Search } from 'lucide-react';

export default function NamespaceSelect({ namespaces, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handle(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
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
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded-lg px-3 py-2 hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors min-w-[200px] justify-between"
            >
                <span className="flex items-center gap-2">
                    <Server size={14} className="text-[var(--text-muted)]" />
                    <span className="truncate">{displayValue}</span>
                </span>
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 right-0 w-full min-w-[220px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-[var(--border-color)]">
                        <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 rounded px-2 py-1.5">
                            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search namespaces..."
                                className="bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none flex-1 w-full"
                            />
                            {query && (
                                <button onClick={() => setQuery('')}>
                                    <X size={13} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-xs text-[var(--text-muted)] text-center">No matches</li>
                        ) : (
                            filtered.map(ns => {
                                const value = ns === 'All namespaces' ? '' : ns;
                                const isSelected = selected === value;
                                const isSystem = ['kube-system', 'kube-public', 'kube-node-lease'].includes(ns);
                                return (
                                    <li
                                        key={ns}
                                        onClick={() => selectNs(ns)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors
                      ${isSelected ? 'bg-blue-900/50 text-blue-300' : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)]'}`}
                                    >
                                        <Server size={12} className={isSystem ? 'text-purple-400' : 'text-[var(--text-muted)]'} />
                                        <span className="flex-1 text-left">{ns}</span>
                                        {isSystem && (
                                            <span className="text-[10px] text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-800/30 uppercase font-bold tracking-wider">system</span>
                                        )}
                                        {isSelected && <span className="text-blue-400 text-xs text-right">✓</span>}
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
