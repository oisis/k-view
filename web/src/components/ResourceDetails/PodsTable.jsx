import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function PodsTable({ pods, t }) {
    return (
        <DetailSection title="Pods" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-left">Node</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-center">Restarts</th>
                            <th className="px-4 py-3 text-left">CPU Usage (cores)</th>
                            <th className="px-4 py-3 text-left">Memory Usage (bytes)</th>
                            <th className="px-4 py-3 text-left">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {pods.length === 0 ? (
                            <tr><td colSpan="11" className="px-4 py-8 text-center text-[var(--text-muted)] italic">No pods found.</td></tr>
                        ) : (
                            pods.map((pod, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2">
                                        <Link to={`/pods/${pod.namespace}/${pod.name}`} className="font-bold text-[var(--accent)] hover:underline font-mono">
                                            {pod.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{pod.namespace}</td>
                                    <td className="px-4 py-2"><ExpandableCell value={pod.extra?.images} type="images" /></td>
                                    <td className="px-4 py-2"><ExpandableCell value={pod.extra?.labels} type="labels" /></td>
                                    <td className="px-4 py-2 text-xs font-mono text-info truncate max-w-[120px]">{pod.extra?.node || '—'}</td>
                                    <td className="px-4 py-2">
                                                                                 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${pod.status === 'Running' || pod.status === 'Succeeded' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>                                            {pod.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold">{pod.extra?.restarts || 0}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-info">{pod.extra?.cpu || '—'}</td>
                                    <td className="px-4 py-2 font-mono text-xs text-teal-400">{pod.extra?.ram || '—'}</td>
                                    <td className="px-4 py-2 text-[var(--text-muted)] text-xs">{pod.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="pods" namespace={pod.namespace} name={pod.name} onRefresh={() => window.location.reload()} />
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
