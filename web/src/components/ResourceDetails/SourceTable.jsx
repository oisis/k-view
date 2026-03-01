import React from 'react';
import DetailSection from './DetailSection';

export default function SourceTable({ source, t }) {
    if (!source) return null;

    return (
        <DetailSection title={t('label_source')}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 font-black">{t('label_type')}</th>
                            <th className="px-4 py-3 font-black">{t('label_server')}</th>
                            <th className="px-4 py-3 font-black">{t('label_path')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        <tr className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 font-bold text-info">{source.type || '—'}</td>
                            <td className="px-4 py-3 font-mono text-primary">{source.server || '—'}</td>
                            <td className="px-4 py-3 font-mono text-primary">{source.path || '—'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
