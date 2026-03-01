import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function RbacBindingOverview({ data, t }) {
    const roleRef = data.roleRef || {};
    const subjects = data.subjects || [];

    return (
        <div className="space-y-6">
            <DetailSection title="Role Reference">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Kind">
                            <span className="font-bold text-primary">{roleRef.kind}</span>
                        </DetailRow>
                        <DetailRow label="Name">
                            <span className="font-bold text-accent">{roleRef.name}</span>
                        </DetailRow>
                        <DetailRow label="API Group">
                            <span className="font-mono text-secondary">{roleRef.apiGroup}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            <DetailSection title="Subjects (Users / Groups / SAs)">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-border/20 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-4 py-3 text-left text-white">Kind</th>
                                <th className="px-4 py-3 text-left text-white">Name</th>
                                <th className="px-4 py-3 text-center text-white">Namespace</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {subjects.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-8 text-center text-text-muted italic">No subjects defined.</td></tr>
                            ) : (
                                subjects.map((s, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-black uppercase">{s.kind}</span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-primary">{s.name}</td>
                                        <td className="px-4 py-3 text-center text-secondary">{s.namespace || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </div>
    );
}
