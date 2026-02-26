import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function SecretOverview({ data, metadata, t }) {
    if (!data || !data.data) return null;

    return (
        <DetailSection title={t('data') || "Secret Data"} className="mt-4">
            <div className="space-y-4">
                {Object.entries(data.data).map(([key, value]) => (
                    <div key={key} className="bg-[var(--bg-sidebar)]/30 border border-[var(--border-color)] rounded-xl p-4">
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 border-b border-[var(--border-color)] pb-1 flex justify-between items-center">
                            <span>{key}</span>
                            <span className="text-[9px] lowercase opacity-50">{value.length} bytes</span>
                        </div>
                        <div className="font-mono text-xs text-[var(--text-secondary)] break-all whitespace-pre-wrap">
                            {/* In a real app we might decode base64, here we show length or placeholder if binary */}
                            {value}
                        </div>
                    </div>
                ))}
            </div>
        </DetailSection>
    );
}
