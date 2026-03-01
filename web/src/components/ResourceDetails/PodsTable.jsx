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
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="px-4 py-3 text-center">{t('label_name')}</th>
                            <th className="px-4 py-3 text-center">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-center">Images</th>
                            <th className="px-4 py-3 text-center">Labels</th>
                            <th className="px-4 py-3 text-center">Node</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Restarts</th>
                            <th className="px-4 py-3 text-center">CPU (usage) (cores)</th>
                            <th className="px-4 py-3 text-center">Memory Usage (bytes)</th>
                            <th className="px-4 py-3 text-center">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {pods.length === 0 ? (
                            <tr><td colSpan="11" className="px-4 py-8 text-center text-text-muted italic">No pods found.</td></tr>
                        ) : (
                            pods.map((pod, i) => (
                                <tr key={i} className="hover:bg-[var(--bg-sidebar)]/10 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-accent">
                                        <Link to={`/pods/${pod.namespace}/${pod.name}`} className="hover:underline">
                                            {pod.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary text-center">
                                        <Link to={`/namespaces/-/${pod.namespace}`} className="hover:underline">
                                            {pod.namespace}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary min-w-[150px]">
                                        <ExpandableCell value={pod.extra?.images} type="images" />
                                    </td>
                                    <td className="px-4 py-3 text-secondary min-w-[150px] text-center">
                                        <ExpandableCell value={pod.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-3 text-secondary font-mono text-xs text-center">
                                        {pod.extra?.node ? (
                                            <Link to={`/nodes/-/${pod.extra.node}`} className="hover:underline text-info">
                                                {pod.extra.node}
                                            </Link>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pod.status === 'Running' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                            {pod.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-secondary text-center">{pod.extra?.restarts || 0}</td>
                                    <td className="px-4 py-3 text-secondary font-mono text-xs">{pod.extra?.cpu || '—'}</td>
                                    <td className="px-4 py-3 text-secondary font-mono text-xs">{pod.extra?.ram || '—'}</td>
                                    <td className="px-4 py-3 text-text-muted text-xs text-center">{pod.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-center">
                                            <ResourceActionMenu
                                                kind="pods"
                                                namespace={pod.namespace}
                                                name={pod.name}
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
