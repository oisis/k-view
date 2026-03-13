import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function ControlledByTable({ owners, namespace, t }) {
    return (
        <DetailSection title={t('controlled_by')} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('resource_kind') || 'Kind'}</th>
                            <th className="px-4 py-3 text-left">API Version</th>
                            <th className="px-4 py-3 text-center">Controller</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!owners || owners.length === 0) ? (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-text-muted italic">{t('no_controller_found')}</td></tr>
                        ) : (
                            (owners || []).map((ref, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-bold text-accent font-mono text-xs">
                                        <Link to={`/resources/${ref.kind}/${namespace}/${ref.name}`} className="hover:underline">{ref.name}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-bold uppercase text-text-muted tracking-wider">{ref.kind}</td>
                                    <td className="px-4 py-3 text-xs text-text-muted font-mono">{ref.apiVersion}</td>
                                    <td className="px-4 py-3 text-center">
                                        {ref.controller ? (
                                            <span className="px-2 py-0.5 rounded bg-success/10 text-success text-[10px] font-black uppercase">Yes</span>
                                        ) : <span className="text-text-muted">—</span>}
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
