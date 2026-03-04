import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

/**
 * ResourceInfoSection - RESTORED FROZEN VIEW FROM MAIN
 * Cleanly rewritten to consume DTO while maintaining DOM structure.
 */
export default function ResourceInfoSection({ 
    isPod, isDaemonSet, isCronJob, isDeployment, isJob, isIngress, isService, isStorageClass,
    isClusterRoleBinding, isRoleBinding, isRole, isNamespace, isNetworkPolicy, isNode,
    spec = {}, status = {}, restarts = 0, t, data = {}, kindLower, icons, metrics
}) {
    // Shared kind detection logic
    const kind = kindLower || data?.extra?.kind?.toLowerCase() || '';
    const podRestarts = restarts || data?.extra?.restarts || 0;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isPod && (
                <DetailSection title={t('resource_info')}>
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <tr className="border-b border-border">
                                <td colSpan="2" className="p-0">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-border text-sm bg-[var(--bg-sidebar)]/5">
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-xs text-text-muted uppercase font-bold mb-1">{t('label_node')}</span>
                                            <Link to={`/nodes/-/${spec?.nodeName}`} className="font-mono text-info font-bold truncate w-full hover:underline">
                                                {spec?.nodeName || '—'}
                                            </Link>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-xs text-text-muted uppercase font-bold mb-1">{t('label_status')}</span>
                                            <span className={`font-bold ${status?.phase === 'Running' || data?.resource?.status?.phase === 'Running' ? 'text-success' : 'text-warning'}`}>
                                                {typeof (status?.phase || data?.resource?.status?.phase || status) === 'string' 
                                                    ? (status?.phase || data?.resource?.status?.phase || status) 
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-xs text-text-muted uppercase font-bold mb-1">IP</span>
                                            <span className="font-mono text-primary font-bold">{status?.podIP || data?.resource?.status?.podIP || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-xs text-text-muted uppercase font-bold mb-1">QoS Class</span>
                                            <span className="text-primary font-bold">{status?.qosClass || spec?.qosClass || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-xs text-text-muted uppercase font-bold mb-1">{t('label_restarts')}</span>
                                            <span className={`font-bold ${podRestarts > 0 ? 'text-warning' : 'text-primary'}`}>{podRestarts}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-xs text-text-muted uppercase font-bold mb-1">{t('label_service_account')}</span>
                                            <span className="font-mono text-info font-bold truncate w-full">{spec?.serviceAccountName || spec?.serviceAccount || 'default'}</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {/* Metrics Sparkline Fallback (if applicable) */}
            {isPod && metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-glass glass p-4 rounded-xl border border-border/30 flex justify-between items-center">
                        <span className="text-xs font-bold text-text-muted uppercase">CPU Usage</span>
                        <span className="text-sm font-black text-accent">{(metrics.cpu || 0).toFixed(3)} cores</span>
                    </div>
                    <div className="bg-glass glass p-4 rounded-xl border border-border/30 flex justify-between items-center">
                        <span className="text-xs font-bold text-text-muted uppercase">RAM Usage</span>
                        <span className="text-sm font-black text-accent">{(metrics.memory / (1024 * 1024)).toFixed(1)} MiB</span>
                    </div>
                </div>
            )}

            {isDaemonSet && (
                <DetailSection title={t('resource_info')}>
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <tr className="border-b border-border">
                                <td colSpan="2" className="p-0">
                                    <div className="px-4 py-3 bg-[var(--bg-sidebar)]/5 border-b border-border">
                                        <span className="text-xs text-text-muted uppercase font-bold block mb-2">{t('label_selector')}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(spec?.selector?.matchLabels || spec?.selector || {}).map(([k, v]) => (
                                                <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] border border-border rounded text-sm text-secondary font-mono inline-block max-w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
                                                    {k}: {v}
                                                </span>
                                            ))}
                                            {!(spec?.selector?.matchLabels || spec?.selector) && <span className="text-text-muted italic">—</span>}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isStorageClass && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <DetailRow label="Provisioner">
                                <span className="font-mono text-info font-bold">{data?.provisioner || spec?.provisioner || '—'}</span>
                            </DetailRow>
                        </tbody>
                    </table>
                </DetailSection>
            )}
        </div>
    );
}
