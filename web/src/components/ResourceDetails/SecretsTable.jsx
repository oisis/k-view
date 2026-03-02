import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function SecretsTable({ title, secrets, t, icons }) {
    return (
        <DetailSection title={title || "Secrets"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Namespace</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-right">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!secrets || secrets.length === 0) ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">
                                    No secrets found.
                                </td>
                            </tr>
                        ) : (
                            secrets.map((s, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <Link to={`/secrets/${s.namespace}/${s.name}`} className="font-bold text-accent hover:underline font-mono">
                                            {s.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-secondary font-medium">{s.namespace}</td>
                                    <td className="px-4 py-3">
                                        <ExpandableCell value={s.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-black uppercase border border-purple-500/20">
                                            {s.extra?.type || 'Opaque'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-text-muted font-mono text-xs whitespace-nowrap">{s.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <ResourceActionMenu
                                            kind="secrets"
                                            namespace={s.namespace}
                                            name={s.name}
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
