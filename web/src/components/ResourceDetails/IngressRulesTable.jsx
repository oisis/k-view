import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function IngressRulesTable({ spec, t }) {
    const rules = spec?.rules || [];

    return (
        <DetailSection title={t('rules') || "Rules"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left">Host</th>
                            <th className="px-4 py-3 text-left">Path</th>
                            <th className="px-4 py-3 text-left">Path type</th>
                            <th className="px-4 py-3 text-left">Service name</th>
                            <th className="px-4 py-3 text-left">Service port</th>
                            <th className="px-4 py-3 text-left">TLS secret</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {rules.length === 0 ? (
                            <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">No rules defined.</td></tr>
                        ) : (
                            rules.map((rule, ri) => (
                                (rule.http?.paths || [{}]).map((path, pi) => (
                                    <tr key={`${ri}-${pi}`} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-info font-mono text-xs">{rule.host || '*'}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-primary">{path.path || '/'}</td>
                                        <td className="px-4 py-3 text-xs text-text-muted">{path.pathType || 'ImplementationSpecific'}</td>
                                        <td className="px-4 py-3 font-bold text-accent font-mono text-xs">
                                            {path.backend?.service?.name ? (
                                                <Link to={`/services/${spec.namespace || '-'}/${path.backend.service.name}`} className="hover:underline">
                                                    {path.backend.service.name}
                                                </Link>
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono text-secondary">{path.backend?.service?.port?.number || path.backend?.service?.port?.name || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-purple-400 font-mono">
                                            {spec.tls?.find(tls => tls.hosts?.includes(rule.host))?.secretName || '—'}
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
