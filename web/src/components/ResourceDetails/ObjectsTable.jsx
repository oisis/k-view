import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ResourceActionMenu from '../ResourceActionMenu';

export default function ObjectsTable({ title, objects, t, icons, kind }) {
    return (
        <DetailSection title={title || "Objects"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black">
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Namespace</th>
                            <th className="px-4 py-3 text-right">Age</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {(!objects || objects.length === 0) ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">
                                    No objects found.
                                </td>
                            </tr>
                        ) : (
                            (objects || []).map((obj, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-accent font-mono">{obj.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-secondary font-medium">{obj.namespace || '—'}</td>
                                    <td className="px-4 py-3 text-right text-text-muted font-mono text-xs whitespace-nowrap">{obj.age}</td>
                                    <td className="px-4 py-3 text-right">
                                        <ResourceActionMenu
                                            kind={kind}
                                            namespace={obj.namespace || '-'}
                                            name={obj.name}
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
