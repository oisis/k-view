import React from 'react';
import DetailSection from '../DetailSection';
import SecretsTable from '../SecretsTable';

/**
 * ServiceAccountOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function ServiceAccountOverview({ data, metadata, spec, namespace, relatedSecrets, relatedImagePullSecrets, t, icons }) {
    if (!data) return null;
    const secrets = Array.isArray(data.relatedSecrets || relatedSecrets) ? (data.relatedSecrets || relatedSecrets) : [];
    const imagePullSecrets = Array.isArray(data.relatedImagePullSecrets || relatedImagePullSecrets) ? (data.relatedImagePullSecrets || relatedImagePullSecrets) : [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <SecretsTable title="Secrets" secrets={secrets} t={t} icons={icons} />
            
            <DetailSection title="Image Pull Secrets">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border uppercase text-[10px] tracking-widest font-black text-text-muted">
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Namespace</th>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-right">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {imagePullSecrets.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-text-muted italic bg-[var(--bg-sidebar)]/5">No image pull secrets defined.</td></tr>
                            ) : (
                                (imagePullSecrets || []).map((s, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 font-bold text-accent font-mono">{s?.name || '—'}</td>
                                        <td className="px-4 py-3 text-secondary font-medium">{s?.namespace || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[10px] font-black uppercase border border-purple-500/20">
                                                {s?.extra?.type || 'kubernetes.io/dockerconfigjson'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-text-muted font-mono text-xs whitespace-nowrap">{s?.age || '—'}</td>
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
