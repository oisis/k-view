import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

/**
 * ResourceInfoSection - Dynamic info display based on YAML specs.
 */
export default function ResourceInfoSection({ 
    isPod, isDeployment, isDaemonSet, isCronJob, isJob, isReplicaSet, isReplicationController, 
    isNode, isStorageClass, data, spec, status, t 
}) {
    const { icons } = useTheme();
    const [showAllSelector, setShowAllSelector] = useState(false);

    if (!data) return null;

    const renderSelector = (selector) => {
        const entries = Object.entries(selector || {});
        if (entries.length === 0) return '—';
        
        const limit = 2;
        const displayEntries = showAllSelector ? entries : entries.slice(0, limit);
        const hasMore = entries.length > limit;

        return (
            <div className="flex flex-col gap-1 items-center justify-center">
                {displayEntries.map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 bg-info/10 text-info border border-info/20 rounded text-[10px] font-mono whitespace-nowrap">
                        {k}={v}
                    </span>
                ))}
                {hasMore && (
                    <button 
                        onClick={() => setShowAllSelector(!showAllSelector)}
                        className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-accent/80 mt-1"
                    >
                        {showAllSelector ? 'Less' : `More (${entries.length - limit})`}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-1">
            {/* Pod Specific Info */}
            {isPod && (
                <DetailSection title={t('resource_info')}>
                    <div className="glass rounded-2xl border border-border overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_node')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_status')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">IP</th>
                                    <th className="px-4 py-2 text-center border-r border-border">QoS Class</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_restarts')}</th>
                                    <th className="px-4 py-2 text-center">Service Account</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-primary font-bold align-middle">
                                    <td className="px-4 py-3 text-center border-r border-border">
                                        <Link to={`/nodes/-/${spec?.nodeName}`} className="text-info hover:underline font-mono">{spec?.nodeName || '—'}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-border">
                                        <span className={status?.phase === 'Running' ? 'text-success' : 'text-warning'}>{status?.phase || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-border font-mono">{status?.podIP || '—'}</td>
                                    <td className="px-4 py-3 text-center border-r border-border">{status?.qosClass || '—'}</td>
                                    <td className="px-4 py-3 text-center border-r border-border">{data?.extra?.restarts || 0}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Link to={`/serviceaccounts/${data?.resource?.namespace}/${spec?.serviceAccountName}`} className="text-accent hover:underline">{spec?.serviceAccountName || '—'}</Link>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}

            {/* Deployment Specific Info */}
            {isDeployment && (
                <DetailSection title={t('resource_info')}>
                    <div className="glass rounded-2xl border border-border overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                    <th className="px-6 py-2 text-center border-r border-border">Strategy</th>
                                    <th className="px-6 py-2 text-center border-r border-border">Min ready seconds</th>
                                    <th className="px-6 py-2 text-center border-r border-border">Revision history Limit</th>
                                    <th className="px-6 py-2 text-center">Selector</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-primary font-bold align-middle">
                                    <td className="px-6 py-4 text-center border-r border-border">{spec?.strategy?.type || '—'}</td>
                                    <td className="px-6 py-4 text-center border-r border-border">{spec?.minReadySeconds || 0}</td>
                                    <td className="px-6 py-4 text-center border-r border-border">{spec?.revisionHistoryLimit || '—'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {renderSelector(spec?.selector?.matchLabels)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}

            {/* CronJob Specific Info */}
            {isCronJob && (
                <DetailSection title={t('resource_info')}>
                    <div className="glass rounded-2xl border border-border overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse table-fixed">
                            <thead>
                                <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_schedule')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_active')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_suspend')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_last_schedule')}</th>
                                    <th className="px-4 py-2 text-center">Concurrency policy</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-primary font-bold align-middle">
                                    <td className="px-4 py-3 text-center border-r border-border font-mono">{spec?.schedule || '—'}</td>
                                    <td className="px-4 py-3 text-center border-r border-border">{status?.active?.length || 0}</td>
                                    <td className="px-4 py-3 text-center border-r border-border">
                                        <span className={spec?.suspend ? 'text-warning' : 'text-success'}>{String(spec?.suspend || false)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-border text-xs">{status?.lastScheduleTime || '—'}</td>
                                    <td className="px-4 py-3 text-center">{spec?.concurrencyPolicy || '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}
        </div>
    );
}
