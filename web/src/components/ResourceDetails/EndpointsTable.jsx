import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';

export default function EndpointsTable({ endpoints, t }) {
    return (
        <DetailSection title="Endpoints" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Host</th>
                            <th className="px-4 py-3 text-left">Ports</th>
                            <th className="px-4 py-3 text-left">Node</th>
                            <th className="px-4 py-3 text-center">Ready</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {(!endpoints || endpoints.length === 0) ? (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-text-muted italic">No endpoints found.</td></tr>
                        ) : (
                            endpoints.map((ep, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-mono text-xs text-info">{ep.host}</td>
                                    <td className="px-4 py-2 text-xs font-mono">
                                        {ep.ports?.map(p => `${p.name || '-'}: ${p.port}/${p.protocol}`).join(', ')}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Link to={`/nodes/-/${ep.node}`} className="text-xs text-accent hover:underline font-mono">
                                            {ep.node}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${ep.ready === 'True' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                            {ep.ready === 'True' ? 'Ready' : 'Not Ready'}
                                        </span>
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
