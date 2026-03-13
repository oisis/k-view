import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function IngressTable({ title, ingresses, t, icons }) {
    return (
        <DetailSection title={title || "Ingresses"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-left">Endpoints</th>
                            <th className="px-4 py-3 text-left">Hosts</th>
                            <th className="px-4 py-3 text-right">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!ingresses || ingresses.length === 0) ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">
                                    No ingresses found.
                                </td>
                            </tr>
                        ) : (
                            (ingresses || []).map((ing, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <Link to={`/resources/Ingresses/${ing.namespace}/${ing.name}`} className="font-bold text-accent hover:underline font-mono">
                                            {ing.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary font-medium">{ing.namespace}</td>
                                    <td className="px-4 py-3">
                                        <ExpandableCell value={ing.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-3 text-primary font-mono text-xs">
                                        <ExpandableCell value={ing.extra?.endpoints} />
                                    </td>
                                    <td className="px-4 py-3 text-primary font-mono text-xs">
                                        <ExpandableCell value={ing.extra?.hosts} />
                                    </td>
                                    <td className="px-4 py-3 text-right text-text-muted font-mono text-xs whitespace-nowrap">{ing.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <ResourceActionMenu
                                            kind="ingresses"
                                            namespace={ing.namespace}
                                            name={ing.name}
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
