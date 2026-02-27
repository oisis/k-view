import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function MetadataSection({ metadata, namespace, t, settings, data, kindLower, status, isNode, isPv, isIngressClass, isStorageClass, isClusterRoleBinding, isRoleBinding, isRole, isServiceAccount, isClusterRole, isNamespace, isNetworkPolicy, isDaemonSet, spec }) {
    const isSpecialMetadataOnly = isIngressClass || isStorageClass || isClusterRoleBinding || isRoleBinding || isRole || isServiceAccount || isClusterRole || isNamespace || isNetworkPolicy || isNode || isPv;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    };

    return (
        <DetailSection title={t('metadata') || 'Metadata'}>
            {isSpecialMetadataOnly ? (
                <div className={`grid grid-cols-1 ${isNode || isPv ? 'hidden' : (kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) ? 'md:grid-cols-4' : 'md:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-border border-b border-border bg-[var(--bg-sidebar)]/10`}>
                    <div className="px-6 py-4 flex flex-col items-center text-center text-info">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_name')}</span>
                        <span className="text-sm font-mono font-bold break-all">{metadata?.name || '—'}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_uid')}</span>
                        <span className="text-xs font-mono text-secondary truncate w-full">{metadata?.uid || '—'}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_created')}</span>
                        <span className="text-sm text-primary font-bold">{formatDate(metadata?.creationTimestamp)}</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className={`grid grid-cols-1 ${isNode || isPv ? 'hidden' : (kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) ? 'md:grid-cols-4' : 'md:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-border border-b border-border bg-[var(--bg-sidebar)]/10`}>
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_name')}</span>
                            <span className="text-sm font-mono text-info font-bold break-all">{metadata?.name || '—'}</span>
                        </div>
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_namespace')}</span>
                            {namespace === '-' ? (
                                <span className="text-sm text-text-muted font-bold italic">—</span>
                            ) : (
                                <Link to={`/namespaces/-/${namespace}`} className="text-sm text-accent font-bold hover:underline">
                                    {namespace}
                                </Link>
                            )}
                        </div>
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_created')}</span>
                            <span className="text-sm text-primary font-bold">{formatDate(metadata?.creationTimestamp)}</span>
                        </div>
                        {(kindLower.includes('configmap') || kindLower.includes('pvc') || kindLower.includes('secret')) && (
                            <div className="px-6 py-4 flex flex-col items-center text-center border-l border-border">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_age')}</span>
                                <span className="text-sm text-primary font-bold">{data?.resource?.age || '—'}</span>
                            </div>
                        )}
                    </div>

                    {!isNode && !kindLower.includes('configmap') && !kindLower.includes('pvc') && !kindLower.includes('secret') && (
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">
                            <div className="px-6 py-4 flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                                    {isDaemonSet ? 'Pods Running' : t('label_status')}
                                </span>
                                {isDaemonSet ? (
                                    <span className="text-sm font-bold text-success">{status?.numberReady || 0}</span>
                                ) : (
                                    <div className={`flex items-center gap-1.5 ${(status?.phase === 'Running' || status?.phase === 'Active' || status?.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'text-success' : 'text-warning'}`}>
                                        <div className={`w-2 h-2 rounded-full animate-pulse ${(status?.phase === 'Running' || status?.phase === 'Active' || status?.phase === 'Succeeded' || data.resource?.status === 'Running') ? 'bg-success' : 'bg-warning'}`} />
                                        <span className="text-sm font-bold uppercase tracking-wide">
                                            {typeof status?.phase === 'string' ? (t(status.phase.toLowerCase()) || status.phase) : 
                                             typeof data.resource?.status === 'string' ? (t(data.resource.status.toLowerCase()) || data.resource.status) : 
                                             status?.phase || (typeof data.resource?.status === 'string' ? data.resource.status : '') || t('unknown')}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                                    {isDaemonSet ? 'Pods Desired' : t('label_node')}
                                </span>
                                {isDaemonSet ? (
                                    <span className="text-sm font-bold text-primary">{status?.desiredNumberScheduled || 0}</span>
                                ) : spec.nodeName ? (
                                    <Link to={`/nodes/-/${spec.nodeName}`} className="text-sm text-info font-bold hover:underline font-mono">
                                        {spec.nodeName}
                                    </Link>
                                ) : (
                                    <span className="text-sm text-text-muted font-bold italic">—</span>
                                )}
                            </div>
                            <div className="px-6 py-4 flex flex-col items-center text-center">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{t('label_age')}</span>
                                <span className="text-sm text-primary font-bold">{data.resource?.age || '—'}</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            <DetailRow label={t('label_labels')}>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(metadata.labels || {}).slice(0, settings.labelsLimit).map(([k, v]) => (
                                        <span key={k} className="px-2 py-0.5 bg-info/10 rounded text-sm text-info font-mono">
                                            {k}: {v}
                                        </span>
                                    ))}
                                    {Object.entries(metadata.labels || {}).length > settings.labelsLimit && (
                                        <span className="text-xs text-text-muted bg-[var(--bg-muted)]/50 px-2 py-1 rounded self-center">
                                            + {Object.entries(metadata.labels || {}).length - settings.labelsLimit} {t('more')}
                                        </span>
                                    )}
                                </div>
                            </DetailRow>
                        </tbody>
                    </table>
                </div>
                <div className="overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border">
                            {status?.loadBalancer?.ingress?.length > 0 && (
                                <DetailRow label={t('label_ip_external')}>
                                    <span className="text-info font-mono font-bold">
                                        {status.loadBalancer.ingress[0].ip || status.loadBalancer.ingress[0].hostname}
                                    </span>
                                </DetailRow>
                            )}
                            <DetailRow label={t('label_annotations')}>
                                <div className="space-y-1">
                                    {Object.entries(metadata.annotations || {}).map(([k, v]) => (
                                        <div key={k} className="text-sm font-mono text-secondary">
                                            <span className="text-info">{k}</span>: {v}
                                        </div>
                                    ))}
                                </div>
                            </DetailRow>
                        </tbody>
                    </table>
                </div>
            </div>
        </DetailSection>
    );
}
