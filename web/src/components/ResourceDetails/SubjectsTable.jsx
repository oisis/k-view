import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function SubjectsTable({ subjects, t }) {
    if (!subjects || subjects.length === 0) {
        return null;
    }

    return (
        <DetailSection title="Subjects" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-[var(--bg-sidebar)]/10 text-text-muted border-b border-border">
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Namespace</th>
                            <th className="px-4 py-3 text-left">Kind</th>
                            <th className="px-4 py-3 text-left">API Group</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {subjects.map((sub, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-2 font-bold text-accent font-mono">
                                    {sub.kind === 'ServiceAccount' ? (
                                        <Link to={`/serviceaccounts/${sub.namespace || '-'}/${sub.name}`} className="hover:underline text-primary">
                                            {sub.name}
                                        </Link>
                                    ) : (
                                        <span className="text-primary">{sub.name}</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 font-mono text-xs text-secondary">
                                    {sub.namespace ? (
                                        <Link to={`/namespaces/-/${sub.namespace}`} className="text-accent hover:underline">
                                            {sub.namespace}
                                        </Link>
                                    ) : '—'}
                                </td>
                                <td className="px-4 py-2 text-xs text-info font-bold uppercase tracking-wider">
                                    {sub.kind}
                                </td>
                                <td className="px-4 py-2 text-xs text-text-muted font-mono">
                                    {sub.apiGroup || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
