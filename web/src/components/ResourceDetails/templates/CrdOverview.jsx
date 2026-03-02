import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import ObjectsTable from '../ObjectsTable';

export default function CrdOverview({ data, metadata, spec, status, relatedCrdObjects, t }) {
    const extra = data.extra || {};
    const versions = spec?.versions || [];
    // Ensure we look into data.status.conditions or just status.conditions
    const conditions = status?.conditions || data?.status?.conditions || [];
    const objects = Array.isArray(relatedCrdObjects) ? relatedCrdObjects : [];

    return (
        <div className="space-y-6">
            <DetailSection title="Resource Info">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Version</span>
                        <span className="text-sm font-mono text-info font-bold">{extra.version || '—'}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Scope</span>
                        <span className="text-sm font-bold text-primary">{extra.scope || '—'}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Group</span>
                        <span className="text-sm font-mono text-accent font-bold">{extra.group || '—'}</span>
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Accepted Names">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <div className="px-4 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Plural</span>
                        <span className="text-sm font-bold text-primary">{extra.plural || '—'}</span>
                    </div>
                    <div className="px-4 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Singular</span>
                        <span className="text-sm text-secondary">{extra.singular || '—'}</span>
                    </div>
                    <div className="px-4 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Kind</span>
                        <span className="text-sm font-bold text-accent">{extra['crd-kind'] || '—'}</span>
                    </div>
                    <div className="px-4 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">List Kind</span>
                        <span className="text-sm text-secondary">{extra.listKind || '—'}</span>
                    </div>
                    <div className="px-4 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Short Names</span>
                        <span className="text-sm font-mono text-info">{extra.shortNames || '—'}</span>
                    </div>
                    <div className="px-4 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Categories</span>
                        <span className="text-sm text-text-muted">{extra.categories || '—'}</span>
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Versions">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-center">Served</th>
                                <th className="px-4 py-3 text-center">Storage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {versions.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">No versions defined.</td></tr>
                            ) : (
                                versions.map((v, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-mono font-bold text-primary">{v.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${v.served ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                                {String(v.served)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${v.storage ? 'bg-info/10 text-info border-info/20' : 'bg-white/5 text-text-muted border-border'}`}>
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

            <DetailSection title="Conditions">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Last Transition</th>
                                <th className="px-4 py-3 text-left">Reason</th>
                                <th className="px-4 py-3 text-left">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {conditions.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">No conditions reported.</td></tr>
                            ) : (
                                conditions.map((c, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-primary">{c.type}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${c.status === 'True' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-text-muted text-xs font-mono">{c.lastTransitionTime}</td>
                                        <td className="px-4 py-3 text-secondary font-medium">{c.reason || '—'}</td>
                                        <td className="px-4 py-3 text-text-muted text-xs break-words max-w-xs">{c.message || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <ObjectsTable title="Objects" objects={objects} t={t} kind={extra.plural} />
        </div>
    );
}
