import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

/**
 * RbacBindingOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function RbacBindingOverview({ data, spec, t }) {
    if (!data) return null;
    const roleRef = spec?.roleRef || data.roleRef || {};
    const subjects = spec?.subjects || data.subjects || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Role References">
                            <span className="font-bold text-primary">
                                {roleRef.kind}: 
                                <span className="text-accent ml-1">{roleRef.name}</span>
                            </span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            <DetailSection title="Subjects">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black text-text-muted">
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Namespaces</th>
                                <th className="px-4 py-3 text-left">Kind</th>
                                <th className="px-4 py-3 text-left">API Group</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {subjects.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">No subjects defined.</td></tr>
                            ) : (
                                (subjects || []).map((s, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-primary">{s.name}</td>
                                        <td className="px-4 py-3 text-secondary font-medium">{s.namespace || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-black uppercase border border-accent/20">{s.kind}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-text-muted">{s.apiGroup || (s.kind === 'ServiceAccount' ? 'core' : 'rbac.authorization.k8s.io')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </div>
    );
}
