import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function CrdOverview({ data, metadata, spec, status, t }) {
    const versions = spec?.versions || [];
    const names = spec?.names || {};

    return (
        <>
            <DetailSection title={t('resource_info') || "CRD Info"}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Group">
                            <span className="font-mono text-info font-bold">{spec?.group}</span>
                        </DetailRow>
                        <DetailRow label="Scope">
                            <span className="text-primary">{spec?.scope}</span>
                        </DetailRow>
                        <DetailRow label="Kind">
                            <span className="font-bold text-primary">{names.kind}</span>
                        </DetailRow>
                        <DetailRow label="Plural">
                            <span className="font-mono text-secondary">{names.plural}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            <DetailSection title="Versions" className="mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-[var(--font-size-sm)] border-collapse">
                        <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-border">
                            <tr>
                                <th className="px-4 py-3 text-left">Version</th>
                                <th className="px-4 py-3 text-center">Served</th>
                                <th className="px-4 py-3 text-center">Storage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {versions.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-8 text-center text-text-muted italic">No versions defined.</td></tr>
                            ) : (
                                versions.map((v, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2 font-bold text-accent font-mono">{v.name}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${v.served ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                {String(v.served)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${v.storage ? 'bg-info/10 text-info' : 'bg-slate-500/10 text-text-muted'}`}>
                                                {String(v.storage)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </>
    );
}
