import React from 'react';
import DetailSection from '../ResourceDetails/DetailSection';

/**
 * CommonTable - Standardized table component for resource details.
 * Matches the structure expected by frozen view tests.
 */
export default function CommonTable({ 
    title, 
    columns = [], 
    data = [], 
    className = "", 
    t,
    icon
}) {
    const hasData = data && Array.isArray(data) && data.length > 0;

    return (
        <DetailSection title={title} icon={icon} className={className}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-border/30 uppercase text-[10px] tracking-widest font-black text-text-muted">
                            {columns.map((col, idx) => (
                                <th 
                                    key={idx} 
                                    className={`px-4 py-3 ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {!hasData ? (
                            <tr>
                                <td 
                                    colSpan={columns.length} 
                                    className="px-4 py-8 text-center text-text-muted italic bg-sidebar/5"
                                >
                                    {t?.('no_data_available') || 'No data available'}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIdx) => (
                                <tr 
                                    key={rowIdx} 
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    {columns.map((col, colIdx) => (
                                        <td 
                                            key={colIdx} 
                                            className={`px-4 py-3 ${col.className || ''}`}
                                        >
                                            {typeof col.accessor === 'function' 
                                                ? col.accessor(item) 
                                                : (item[col.accessor] ?? '—')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
