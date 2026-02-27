import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function ReplicaSetsTable({ title, replicaSets, t }) {
    return (
        <DetailSection title={title} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name') || "Name"}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace') || "Namespace"}</th>
                            <th className="px-4 py-3 text-left">Age</th>
                            <th className="px-4 py-3 text-center">Pods</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {replicaSets.length === 0 ? (
                            <tr><td colSpan="7" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No replica sets found.</td></tr>
                        ) : (
                            replicaSets.map((rs, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-bold text-[var(--accent)] font-mono">
                                        <Link to={`/replicasets/${rs.namespace}/${rs.name}`} className="hover:underline">{rs.name}</Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{rs.namespace}</td>
                                    <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{rs.age}</td>
                                    <td className="px-4 py-2 text-center font-bold">
                                        {rs.extra?.ready || '0'}/{rs.extra?.desired || '0'}
                                    </td>
                                    <td className="px-4 py-2"><ExpandableCell value={rs.extra?.labels} type="labels" /></td>
                                    <td className="px-4 py-2"><ExpandableCell value={rs.extra?.images} type="images" /></td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="replicasets" namespace={rs.namespace} name={rs.name} onRefresh={() => window.location.reload()} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
