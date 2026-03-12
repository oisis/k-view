import React from 'react';

/**
 * DetailSection - RESTORED FROZEN VIEW FROM MAIN
 * Maintaining exact classes and tags for tests.
 */
export default function DetailSection({ title, children, className = "" }) {
    return (
        <div className={`bg-glass glass rounded-2xl border border-border overflow-hidden shadow-xl flex flex-col ${className}`}>
            <div className="detail-section-header px-6 py-2.5 border-b-2 border-border bg-transparent flex-shrink-0 text-center">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h3>
            </div>
            <div className="overflow-auto flex-1">
                {children}
            </div>
        </div>
    );
}
