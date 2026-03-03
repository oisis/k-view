import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ResourceActionMenu from '../ResourceActionMenu';

export default function HpaTable({ hpas, t }) {
    return (
        <DetailSection title="Horizontal Pod Autoscalers" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-secondary border-b border-border bg-white/5 uppercase text-[10px] tracking-widest font-bold">
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-center">Min</th>
                            <th className="px-4 py-3 text-center">Max</th>
                            <th className="px-4 py-3 text-center">Replicas</th>
                            <th className="px-4 py-3 text-left">Target</th>
                            <th className="px-4 py-3 text-left">Age</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {hpas.length === 0 ? (
                            <tr><td colSpan="8" className="px-4 py-8 text-center text-text-muted italic">No HPAs found.</td></tr>
                        ) : (
                            (hpas || []).map((hpa, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-bold text-accent font-mono">
                                        <Link to={`/hpas/${hpa.namespace}/${hpa.name}`} className="hover:underline">{hpa.name}</Link>
                                    </td>
                                    <td className="px-4 py-2 text-secondary">{hpa.namespace}</td>
                                    <td className="px-4 py-2 text-center">{hpa.extra?.min || '—'}</td>
                                    <td className="px-4 py-2 text-center">{hpa.extra?.max || '—'}</td>
                                    <td className="px-4 py-2 text-center font-bold text-info">{hpa.extra?.current || '—'}</td>
                                    <td className="px-4 py-2 text-xs font-mono">{hpa.extra?.target || '—'}</td>
                                    <td className="px-4 py-2 text-text-muted text-xs">{hpa.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu kind="hpas" namespace={hpa.namespace} name={hpa.name} onRefresh={() => window.location.reload()} />
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
