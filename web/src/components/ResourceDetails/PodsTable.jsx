import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';
import { useTranslation } from '../../SettingsContext';

export default function PodsTable({ pods, onRefresh }) {
    const { t } = useTranslation();

    return (
        <DetailSection title="Pods" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse table-fixed">
                    <thead>
                        <tr className="bg-white/5 border-b border-border/20 uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left w-48">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left w-32">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left w-48">Images</th>
                            <th className="px-4 py-3 text-left w-48">Labels</th>
                            <th className="px-4 py-3 text-left w-32">Node</th>
                            <th className="px-4 py-3 text-center w-28">Status</th>
                            <th className="px-4 py-3 text-center w-24">Restarts</th>
                            <th className="px-4 py-3 text-center w-24">CPU</th>
                            <th className="px-4 py-3 text-center w-24">RAM</th>
                            <th className="px-4 py-3 text-center w-24">Created</th>
                            <th className="px-4 py-3 text-right w-12"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {pods.length === 0 ? (
                            <tr><td colSpan="11" className="px-4 py-8 text-center text-text-muted italic">No pods found.</td></tr>
                        ) : (
                            (pods || []).map((pod, i) => (
                                <tr key={pod.uid || `${pod.namespace}/${pod.name}`} className="hover:bg-[var(--bg-sidebar)]/10 transition-colors group">
                                    <td className="px-4 py-3 font-mono font-bold text-accent truncate">
                                        <Link to={`/resources/Pods/${pod.namespace}/${pod.name}`} className="hover:underline block truncate" title={pod.name}>
                                            {pod.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary truncate">
                                        <Link to={`/resources/Namespaces/-/${pod.namespace}`} className="hover:underline block truncate" title={pod.namespace}>
                                            {pod.namespace}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary overflow-hidden">
                                        <ExpandableCell value={pod.extra?.images} type="images" />
                                    </td>
                                    <td className="px-4 py-3 text-secondary overflow-hidden">
                                        <ExpandableCell value={pod.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-3 text-secondary truncate font-mono text-xs">
                                        {pod.extra?.node || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pod.status === 'Running' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                            {pod.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-secondary text-center font-bold">{pod.extra?.restarts || 0}</td>
                                    <td className="px-4 py-3 text-secondary font-mono text-xs text-center">{pod.extra?.cpu || '—'}</td>
                                    <td className="px-4 py-3 text-secondary font-mono text-xs text-center">{pod.extra?.ram || '—'}</td>
                                    <td className="px-4 py-3 text-text-muted text-xs text-center">{pod.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-center">
                                            <ResourceActionMenu
                                                kind="pods"
                                                namespace={pod.namespace}
                                                name={pod.name}
                                                uid={pod.uid}
                                                onRefresh={onRefresh}
                                            />
                                        </div>
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
