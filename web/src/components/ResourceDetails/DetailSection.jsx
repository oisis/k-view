import React from 'react';

export default function DetailSection({ title, children, className = "" }) {
    return (
        <div className={`bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col ${className}`}>
            <div className="px-6 py-2.5 border-b-2 border-slate-600 bg-transparent flex-shrink-0 text-center">
                <h3 className="text-[13px] font-bold text-[var(--accent)] uppercase tracking-widest">{title}</h3>
            </div>
            <div className="overflow-auto flex-1">
                {children}
            </div>
        </div>
    );
}
