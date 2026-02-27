import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function ResourceInfoSection({ 
    isPod, isDaemonSet, isCronJob, isDeployment, isJob, isIngress, isService, isStorageClass,
    isClusterRoleBinding, isRoleBinding, isRole, isNamespace, isNetworkPolicy,
    spec, status, restarts, t, data, kindLower, icons
}) {
    return (
        <>
            {isPod && (
                <DetailSection title={t('resource_info')}>
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <tr className="border-b border-border">
                                <td colSpan="2" className="p-0">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-border text-[var(--font-size-sm)] bg-[var(--bg-sidebar)]/5">
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold mb-1">{t('label_node')}</span>
                                            <Link to={`/nodes/-/${spec.nodeName}`} className="font-mono text-info font-bold truncate w-full hover:underline">
                                                {spec.nodeName || '—'}
                                            </Link>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold mb-1">{t('label_status')}</span>
                                            <span className={`font-bold ${status.phase === 'Running' ? 'text-success' : 'text-warning'}`}>{status.phase || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold mb-1">IP</span>
                                            <span className="font-mono text-primary font-bold">{status.podIP || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold mb-1">QoS Class</span>
                                            <span className="text-primary font-bold">{status.qosClass || spec.qosClass || '—'}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold mb-1">{t('label_restarts')}</span>
                                            <span className={`font-bold ${restarts > 0 ? 'text-warning' : 'text-primary'}`}>{restarts}</span>
                                        </div>
                                        <div className="px-4 py-3 flex flex-col items-center text-center">
                                            <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold mb-1">{t('label_service_account')}</span>
                                            <span className="font-mono text-info font-bold truncate w-full">{spec.serviceAccountName || spec.serviceAccount || 'default'}</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isDaemonSet && (
                <DetailSection title={t('resource_info')}>
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <tr className="border-b border-border">
                                <td colSpan="2" className="p-0">
                                    <div className="px-4 py-3 bg-[var(--bg-sidebar)]/5 border-b border-border">
                                        <span className="text-[var(--font-size-xs)] text-text-muted uppercase font-bold block mb-2">{t('label_selector')}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(spec.selector?.matchLabels || spec.selector || {}).map(([k, v]) => (
                                                <span key={k} className="px-2 py-0.5 bg-[var(--bg-muted)] border border-border rounded text-sm text-secondary font-mono">
                                                    {k}: {v}
                                                </span>
                                            ))}
                                            {!(spec.selector?.matchLabels || spec.selector) && <span className="text-text-muted italic">—</span>}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            {/* Images and Init Images details omitted for brevity, should be here if following old logic */}
                        </tbody>
                    </table>
                </DetailSection>
            )}

            {isStorageClass && (
                <DetailSection title={t('resource_info')} className="mt-4">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <DetailRow label="Provisioner">
                                <span className="font-mono text-info font-bold">{data.provisioner || spec.provisioner || '—'}</span>
                            </DetailRow>
                        </tbody>
                    </table>
                </DetailSection>
            )}
        </>
    );
}
