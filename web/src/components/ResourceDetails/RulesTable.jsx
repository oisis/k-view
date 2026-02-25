import React from 'react';
import DetailSection from './DetailSection';

export default function RulesTable({ rules = [], t }) {
    if (!rules || rules.length === 0) {
        return (
            <DetailSection title="Rules" className="mt-4">
                <div className="p-4 text-center text-sm text-[var(--text-muted)] italic">
                    {t('no_rules_found') || 'No rules defined.'}
                </div>
            </DetailSection>
        );
    }

    return (
        <DetailSection title="Rules" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Resources</th>
                            <th className="px-4 py-3 text-left">Non-resource URL</th>
                            <th className="px-4 py-3 text-left">Resource Names</th>
                            <th className="px-4 py-3 text-left">Verbs</th>
                            <th className="px-4 py-3 text-left">API Groups</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {rules.map((rule, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.resources?.map((r, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-black/30 text-[var(--text-primary)] rounded text-xs font-mono">{r}</span>
                                        )) || <span className="text-[var(--text-muted)] italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.nonResourceURLs?.map((n, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-black/30 text-emerald-400 rounded text-xs font-mono">{n}</span>
                                        )) || <span className="text-[var(--text-muted)] italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.resourceNames?.map((n, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-black/30 text-amber-300 rounded text-xs font-mono">{n}</span>
                                        )) || <span className="text-[var(--text-muted)] italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.verbs?.map((v, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-info/10 text-info border border-info/20 rounded text-xs font-bold uppercase">{v}</span>
                                        )) || <span className="text-[var(--text-muted)] italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.apiGroups?.map((g, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-black">{g === '' ? 'core' : g}</span>
                                        )) || <span className="text-[var(--text-muted)] italic">—</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
