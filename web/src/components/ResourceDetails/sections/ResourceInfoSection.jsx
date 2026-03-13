import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import { useTheme } from '../../../ThemeContext';
import { cn } from "@/lib/utils";

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
                    <span key={k} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-mono whitespace-nowrap">
                        {k}={v}
                    </span>
                ))}
                {hasMore && (
                    <button 
                        onClick={() => setShowAllSelector(!showAllSelector)}
                        className="text-[9px] font-semibold uppercase tracking-wider text-primary hover:underline mt-1"
                    >
                        {showAllSelector ? 'Less' : `More (${entries.length - limit})`}
                    </button>
                )}
            </div>
        );
    };

    const headerClass = "bg-muted/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border";
    const cellClass = "px-4 py-3 text-center border-r border-border text-foreground font-medium";
    const lastCellClass = "px-4 py-3 text-center text-foreground font-medium";

    return (
        <div className="space-y-1">
            {/* Pod Specific Info */}
            {isPod && (
                <DetailSection title={t('resource_info')}>
                    <div className="glass rounded-2xl border border-border overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse table-fixed">
                            <thead>
                                <tr className={headerClass}>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_node')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_status')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">IP</th>
                                    <th className="px-4 py-2 text-center border-r border-border">QoS Class</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_restarts')}</th>
                                    <th className="px-4 py-2 text-center">Service Account</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="align-middle">
                                    <td className={cellClass}>
                                        <Link to={`/resources/Nodes/-/${spec?.nodeName}`} className="text-primary hover:underline font-mono">{spec?.nodeName || '—'}</Link>
                                    </td>
                                    <td className={cellClass}>
                                        <span className={status?.phase === 'Running' ? 'text-emerald-600 font-bold' : 'text-orange-600 font-bold'}>{status?.phase || '—'}</span>
                                    </td>
                                    <td className={cn(cellClass, "font-mono")}>{status?.podIP || '—'}</td>
                                    <td className={cellClass}>{status?.qosClass || '—'}</td>
                                    <td className={cellClass}>{data?.extra?.restarts || 0}</td>
                                    <td className={lastCellClass}>
                                        <Link to={`/resources/ServiceAccounts/${data?.resource?.namespace || '-'}/${spec?.serviceAccountName}`} className="text-primary font-semibold hover:underline">{spec?.serviceAccountName || '—'}</Link>
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
                                <tr className={headerClass}>
                                    <th className="px-6 py-2 text-center border-r border-border">Strategy</th>
                                    <th className="px-6 py-2 text-center border-r border-border">Min ready seconds</th>
                                    <th className="px-6 py-2 text-center border-r border-border">Revision history Limit</th>
                                    <th className="px-6 py-2 text-center">Selector</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="align-middle">
                                    <td className={cn(cellClass, "px-6")}>{spec?.strategy?.type || '—'}</td>
                                    <td className={cn(cellClass, "px-6")}>{spec?.minReadySeconds || 0}</td>
                                    <td className={cn(cellClass, "px-6")}>{spec?.revisionHistoryLimit || '—'}</td>
                                    <td className={cn(lastCellClass, "px-6")}>
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
                                <tr className={headerClass}>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_schedule')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_active')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_suspend')}</th>
                                    <th className="px-4 py-2 text-center border-r border-border">{t('label_last_schedule')}</th>
                                    <th className="px-4 py-2 text-center">Concurrency policy</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="align-middle">
                                    <td className={cn(cellClass, "font-mono")}>{spec?.schedule || '—'}</td>
                                    <td className={cellClass}>{status?.active?.length || 0}</td>
                                    <td className={cellClass}>
                                        <span className={spec?.suspend ? 'text-orange-600 font-bold' : 'text-emerald-600 font-bold'}>{String(spec?.suspend || false)}</span>
                                    </td>
                                    <td className={cn(cellClass, "text-xs font-mono")}>{status?.lastScheduleTime || '—'}</td>
                                    <td className={lastCellClass}>{spec?.concurrencyPolicy || '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DetailSection>
            )}
        </div>
    );
}
