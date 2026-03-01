import React from 'react';
import DetailSection from './DetailSection';

export default function RulesTable({ rules = [], t }) {
    if (!rules || rules.length === 0) {
        return (
            <DetailSection title="Rules" className="mt-4">
                <div className="p-4 text-center text-sm text-text-muted italic">
                    {t('no_rules_found') || 'No rules defined.'}
                </div>
            </DetailSection>
        );
    }

    return (
        <DetailSection title="Rules" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
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
                                            <span key={i} className="px-1.5 py-0.5 bg-success/10 text-success rounded text-xs font-mono font-bold">{r}</span>
                                        )) || <span className="text-text-muted italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.nonResourceURLs?.map((n, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs font-mono">{n}</span>
                                        )) || <span className="text-text-muted italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.resourceNames?.map((n, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded text-xs font-mono">{n}</span>
                                        )) || <span className="text-text-muted italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.verbs?.map((v, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-info/10 text-info rounded text-xs font-bold uppercase">{v}</span>
                                        )) || <span className="text-text-muted italic">—</span>}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {rule.apiGroups?.map((g, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs font-black">{g === '' ? 'core' : g}</span>
                                        )) || <span className="text-text-muted italic">—</span>}
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
