import React from 'react';
import DetailSection from '../DetailSection';
import { Link } from 'react-router-dom';

/**
 * HpaOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function HpaOverview({ spec, status, t }) {
    const metrics = spec?.metrics || [];
    const scaleTarget = spec?.scaleTargetRef || {};
    const currentMetrics = status?.currentMetrics || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Scaling Target">
                <div className="p-6 bg-[var(--bg-sidebar)]/5 border-b border-border rounded-xl border border-border/30">
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg">
                            <span className="text-xs font-bold text-text-muted uppercase block mb-1">Target Resource</span>
                            <Link to={`/${scaleTarget.kind?.toLowerCase()}s/${scaleTarget.name}`} className="text-sm font-bold text-accent hover:underline font-mono">
                                {scaleTarget.kind}/{scaleTarget.name}
                            </Link>
                        </div>
                        <div className="px-4 py-2 bg-white/5 border border-border rounded-lg">
                            <span className="text-xs font-bold text-text-muted uppercase block mb-1">API Version</span>
                            <span className="text-sm font-mono text-primary">{scaleTarget.apiVersion}</span>
                        </div>
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Replicas & Range">
                <div className="grid grid-cols-3 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-xl border border-border/30 overflow-hidden">
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Current</span>
                        <span className="text-xl font-bold text-info">{status?.currentReplicas || 0}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Min Replicas</span>
                        <span className="text-xl font-bold text-primary">{spec?.minReplicas || 0}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Max Replicas</span>
                        <span className="text-xl font-bold text-primary">{spec?.maxReplicas || 0}</span>
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Metrics">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="text-secondary border-b border-border bg-white/5 uppercase text-[10px] tracking-widest font-bold text-text-muted">
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Resource / Name</th>
                                <th className="px-4 py-3 text-center">Target</th>
                                <th className="px-4 py-3 text-center">Current</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {(metrics || []).map((m, i) => {
                                const current = (currentMetrics || []).find(cm => cm.type === m.type && cm.resource?.name === m.resource?.name);
                                return (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-bold text-secondary uppercase text-xs">{m.type}</td>
                                        <td className="px-4 py-3 text-primary font-mono">{m.resource?.name || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-bold">
                                                {m.resource?.target?.averageUtilization ? `${m.resource.target.averageUtilization}%` : m.resource?.target?.averageValue || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-info/10 text-info rounded text-xs font-bold">
                                                {current?.resource?.current?.averageUtilization ? `${current.resource.current.averageUtilization}%` : current?.resource?.current?.averageValue || '—'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {metrics.length === 0 && (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-text-muted italic bg-sidebar/5">No metrics defined.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </div>
    );
}
