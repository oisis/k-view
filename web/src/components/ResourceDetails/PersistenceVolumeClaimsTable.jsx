import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function PersistenceVolumeClaimsTable({ pvcNames, namespace, t }) {
    return (
        <DetailSection title="Persistence Volume Claims" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Capacity</th>
                            <th className="px-4 py-3 text-left">Access Modes</th>
                            <th className="px-4 py-3 text-left">Storage Class</th>
                            <th className="px-4 py-3 text-left">Age</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {(!pvcNames || pvcNames.length === 0) ? (
                            <tr><td colSpan="7" className="px-4 py-8 text-center text-text-muted italic">No PVCs found.</td></tr>
                        ) : (
                            pvcNames.map((pvc, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-bold text-accent font-mono text-xs">
                                        <Link to={`/pvcs/${namespace}/${pvc}`} className="hover:underline">{pvc}</Link>
                                    </td>
                                    <td className="px-4 py-2 text-secondary">{namespace}</td>
                                    <td className="px-4 py-2 text-center text-text-muted">—</td>
                                    <td className="px-4 py-2 text-center text-text-muted">—</td>
                                    <td className="px-4 py-2 text-center text-text-muted">—</td>
                                    <td className="px-4 py-2 text-center text-text-muted">—</td>
                                    <td className="px-4 py-2 text-center text-text-muted">—</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
