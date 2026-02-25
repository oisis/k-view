import React from 'react';

export default function DetailRow({ label, value, children }) {
    return (
        <tr className="group">
            <td className="px-4 py-3 w-48 text-[var(--font-size-xs)] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10">
                {label}
            </td>
            <td className="px-4 py-3 text-[var(--font-size-sm)] text-[var(--text-primary)]">
                {children || (
                    <span className={label === 'UID' || label === 'Name' ? 'font-mono text-info' : 'text-[var(--text-[var(--text-white)])]'}>
                        {value ?? '—'}
                    </span>
                )}
            </td>
        </tr>
    );
}
