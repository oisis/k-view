import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ResourceActionMenu from '../ResourceActionMenu';

export default function PersistentVolumesTable({ pvs, t }) {
    return (
        <DetailSection title="Persistent Volumes" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name') || 'Name'}</th>
                            <th className="px-4 py-3 text-left">{t('label_status') || 'Status'}</th>
                            <th className="px-4 py-3 text-left">Capacity</th>
                            <th className="px-4 py-3 text-left">Access Mode</th>
                            <th className="px-4 py-3 text-left">Reclaim Policy</th>
                            <th className="px-4 py-3 text-left">Storage Class</th>
                            <th className="px-4 py-3 text-left">Claim</th>
                            <th className="px-4 py-3 text-left">{t('label_age') || 'Age'}</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {(!pvs || pvs.length === 0) ? (
                            <tr><td colSpan="9" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No persistent volumes found.</td></tr>
                        ) : (
                            pvs.map((pv, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2">
                                        <Link to={`/persistentvolumes/-/${pv.name}`} className="font-bold text-[var(--accent)] hover:underline font-mono">
                                            {pv.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">
                                                                                 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${pv.status === 'Bound' ? 'bg-success/10 text-success' : (pv.status === 'Available' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning')}`}>                                            {pv.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-mono text-xs text-info">{pv.extra?.capacity || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{pv.extra?.['access-mode'] || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)] text-xs">{pv.extra?.['reclaim-policy'] || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)] text-xs">{pv.extra?.['storage-class'] || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)] max-w-[200px] truncate">{pv.extra?.claim || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{pv.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="persistentvolumes" namespace="-" name={pv.name} onRefresh={() => window.location.reload()} />
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
