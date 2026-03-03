import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function ServicesTable({ title, services, t, icons }) {
    return (
        <DetailSection title={title || "Services"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Cluster IP</th>
                            <th className="px-4 py-3 text-left">Internal Endpoints</th>
                            <th className="px-4 py-3 text-left">External Endpoints</th>
                            <th className="px-4 py-3 text-right">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!services || services.length === 0) ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">
                                    No services found matching selector.
                                </td>
                            </tr>
                        ) : (
                            (services || []).map((svc, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <Link to={`/services/${svc.namespace}/${svc.name}`} className="font-bold text-accent hover:underline font-mono">
                                            {svc.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary font-medium">{svc.namespace}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                            svc.status === 'LoadBalancer' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                                            svc.status === 'NodePort' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                            {svc.status || 'ClusterIP'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-primary font-mono text-xs">{svc.extra?.['cluster-ip'] || '—'}</td>
                                    <td className="px-4 py-3">
                                        <ExpandableCell value={svc.extra?.endpoints} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <ExpandableCell value={svc.extra?.external} />
                                    </td>
                                    <td className="px-4 py-3 text-right text-text-muted font-mono text-xs whitespace-nowrap">{svc.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <ResourceActionMenu
                                            kind="services"
                                            namespace={svc.namespace}
                                            name={svc.name}
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
