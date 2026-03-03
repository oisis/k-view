import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

/**
 * IngressClassOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function IngressClassOverview({ spec, t }) {
    const params = spec?.parameters || {};

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DetailSection title="Specification">
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-border">
                        <DetailRow label="Controller">
                            <span className="font-mono text-info font-bold">{spec?.controller || '—'}</span>
                        </DetailRow>
                    </tbody>
                </table>
            </DetailSection>

            {Object.keys(params || {}).length > 0 && (
                <DetailSection title="Parameters Reference" className="mt-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black text-text-muted">
                                    <th className="px-4 py-3 text-center">API Group</th>
                                    <th className="px-4 py-3 text-center">Kind</th>
                                    <th className="px-4 py-3 text-center">Name</th>
                                    <th className="px-4 py-3 text-center">Namespace</th>
                                    <th className="px-4 py-3 text-center">Scope</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-mono text-center">{params.apiGroup || '—'}</td>
                                    <td className="px-4 py-3 text-center">{params.kind || '—'}</td>
                                    <td className="px-4 py-3 font-bold text-accent text-center">{params.name || '—'}</td>
                                    <td className="px-4 py-3 text-center">{params.namespace || '—'}</td>
                                    <td className="px-4 py-3 text-center uppercase text-xs font-bold">{params.scope || 'Cluster'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}
        </div>
    );
}
