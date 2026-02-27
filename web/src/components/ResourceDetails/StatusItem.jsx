import React from 'react';

export default function StatusItem({ label, value, children }) {
    return (
        <div className="flex flex-col gap-1 min-w-[100px]">
            <span className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{label}</span>
            <div className="text-base font-bold text-[var(--text-white)] flex items-center min-h-[1.5rem] tracking-tight">
                {children || (value ?? '—')}
            </div>
        </div>
    );
}
