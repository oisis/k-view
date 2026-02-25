import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function IngressRulesTable({ spec, t }) {
    return (
        <DetailSection title="Rules" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Host</th>
                            <th className="px-4 py-3 text-left">Path</th>
                            <th className="px-4 py-3 text-left">Path type</th>
                            <th className="px-4 py-3 text-left">Service name</th>
                            <th className="px-4 py-3 text-left">Service port</th>
                            <th className="px-4 py-3 text-left">TLS secret</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {(!spec.rules || spec.rules.length === 0) ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No rules defined.</td></tr>
                        ) : (
                            spec.rules.map((rule, ri) => (
                                rule.http?.paths?.map((path, pi) => (
                                    <tr key={`${ri}-${pi}`} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2 font-bold text-info font-mono text-xs">{rule.host || '*'}</td>
                                        <td className="px-4 py-2 font-mono text-xs text-[var(--text-primary)]">{path.path || '/'}</td>
                                        <td className="px-4 py-2 text-xs text-[var(--text-muted)]">{path.pathType || 'ImplementationSpecific'}</td>
                                        <td className="px-4 py-2 font-bold text-[var(--accent)] font-mono text-xs">
                                            <Link to={`/services/${spec.namespace || '-'}/${path.backend?.service?.name}`} className="hover:underline">
                                                {path.backend?.service?.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-2 text-xs font-mono">{path.backend?.service?.port?.number || path.backend?.service?.port?.name || '—'}</td>
                                        <td className="px-4 py-2 text-xs text-purple-400 font-mono">
                                            {spec.tls?.find(t => t.hosts?.includes(rule.host))?.secretName || '—'}
                                        </td>
                                    </tr>
                                ))
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
