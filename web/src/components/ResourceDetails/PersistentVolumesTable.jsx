import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ResourceActionMenu from '../ResourceActionMenu';

export default function PersistentVolumesTable({ title, pvs, t, icons }) {
    return (
        <DetailSection title={title || "Persistent Volumes"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-center">Capacity</th>
                            <th className="px-4 py-3 text-center">Access Modes</th>
                            <th className="px-4 py-3 text-center">Reclaim Policy</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-left">Claim</th>
                            <th className="px-4 py-3 text-left">StorageClass</th>
                            <th className="px-4 py-3 text-left">Reason</th>
                            <th className="px-4 py-3 text-right">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!pvs || pvs.length === 0) ? (
                            <tr>
                                <td colSpan="10" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">
                                    No persistent volumes found.
                                </td>
                            </tr>
                        ) : (
                            pvs.map((pv, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <Link to={`/pvs/${pv.namespace || '-'}/${pv.name}`} className="font-bold text-accent hover:underline font-mono">
                                            {pv.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-primary">{pv.extra?.capacity || '—'}</td>
                                    <td className="px-4 py-3 text-center text-secondary text-xs">{pv.extra?.['access-modes'] || '—'}</td>
                                    <td className="px-4 py-3 text-center text-secondary text-xs">{pv.extra?.['reclaim-policy'] || '—'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                            pv.status === 'Bound' ? 'bg-success/10 text-success border-success/20' : 
                                            pv.status === 'Available' ? 'bg-info/10 text-info border-info/20' : 
                                            'bg-warning/10 text-warning border-warning/20'
                                        }`}>
                                            {pv.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-secondary font-mono text-xs truncate max-w-[150px]" title={pv.extra?.claim}>
                                        {pv.extra?.claim || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-secondary italic text-xs">{pv.extra?.['storage-class'] || '—'}</td>
                                    <td className="px-4 py-3 text-warning italic text-xs">{pv.extra?.reason || '—'}</td>
                                    <td className="px-4 py-3 text-right text-text-muted font-mono text-xs whitespace-nowrap">{pv.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <ResourceActionMenu
                                            kind="persistentvolumes"
                                            namespace="-"
                                            name={pv.name}
                                            onRefresh={() => window.location.reload()}
                                        />
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
