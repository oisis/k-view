import React from 'react';

export default function DetailSection({ title, children, className = "" }) {
    return (
        <div className={`bg-glass glass rounded-2xl border border-border overflow-hidden shadow-xl flex flex-col ${className}`}>
            <div className="px-6 py-2.5 border-b-2 border-border bg-transparent flex-shrink-0 text-center">
                <h3 className="text-[13px] font-bold text-accent uppercase tracking-widest">{title}</h3>
            </div>
            <div className="overflow-auto flex-1">
                {children}
            </div>
        </div>
    );
}
