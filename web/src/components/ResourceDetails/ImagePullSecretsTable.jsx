import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

// Table displaying imagePullSecrets used by this ServiceAccount
export default function ImagePullSecretsTable({ imagePullSecrets, namespace, t }) {
    const items = Array.isArray(imagePullSecrets) ? imagePullSecrets : [];
    return (
        <DetailSection title="Image Pull Secrets" className="mt-4">
            {items.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--text-muted)] italic">No image pull secrets found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                            <tr>
                                <th className="px-4 py-3 text-left">Name</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {items.map((s, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-mono text-sm">
                                        <Link
                                            to={`/secrets/${namespace || '-'}/${s.name}`}
                                            className="text-purple-400 hover:underline font-bold"
                                        >
                                            {s.name}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DetailSection>
    );
}
