import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

// Table displaying secrets mounted by this ServiceAccount
export default function SecretsTable({ secrets, namespace, t }) {
    const items = Array.isArray(secrets) ? secrets : [];
    return (
        <DetailSection title="Secrets" className="mt-4">
            {items.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-muted italic">No secrets found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
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
                                            className="text-accent hover:underline font-bold"
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
