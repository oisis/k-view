import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ServicesTable from '../ServicesTable';
import ConditionsTable from '../ConditionsTable';
import ContainerDetails from '../ContainerDetails';

/**
 * DaemonSetOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function DaemonSetOverview({ data, metadata, spec, status, relatedPods, relatedServices, t, icons }) {
    if (!data) return null;

    const containers = spec?.template?.spec?.containers || [];
    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const strategy = spec?.updateStrategy?.type || 'RollingUpdate';
    const selector = spec?.selector?.matchLabels || {};

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info') || "Resource Info"}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-t-xl overflow-hidden">
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Desired</span>
                        <span className="text-sm font-bold text-primary">{status?.desiredNumberScheduled || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Current</span>
                        <span className="text-sm font-bold text-info">{status?.currentNumberScheduled || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Ready</span>
                        <span className="text-sm font-bold text-success">{status?.numberReady || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Available</span>
                        <span className="text-sm font-bold text-success">{status?.numberAvailable || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Updated</span>
                        <span className="text-sm font-bold text-accent">{status?.updatedNumberScheduled || 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Misscheduled</span>
                        <span className={`text-sm font-bold ${status?.numberMisscheduled > 0 ? 'text-error' : 'text-text-muted'}`}>
                            {status?.numberMisscheduled || 0}
                        </span>
                    </div>
                </div>
                <div className="bg-[var(--bg-sidebar)]/5 rounded-b-xl border-t border-border">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border/30">
                            <tr>
                                <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Strategy</td>
                                <td className="px-4 py-3 font-bold text-primary">{strategy}</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 text-text-muted font-bold uppercase text-[10px] tracking-widest w-1/4">Selector</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(selector || {}).map(([k, v]) => (
                                            <span key={k} className="px-2 py-0.5 bg-info/10 text-info rounded text-xs font-mono border border-info/20">
                                                {k}={v}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            {(containers || []).length > 0 && (
                <ContainerDetails 
                    containers={containers} 
                    statuses={status?.containerStatuses || []} 
                    t={t} 
                />
            )}

            {pods.length > 0 && <PodsTable pods={pods} t={t} title={t('pods') || "Pods"} />}
            
            {relatedServices && (Array.isArray(relatedServices) ? relatedServices.length : 0) > 0 && (
                <ServicesTable services={relatedServices} t={t} icons={icons} title="Services" />
            )}
            
            {(status?.conditions || data.resource?.status?.conditions) && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable conditions={status?.conditions || data.resource?.status?.conditions || []} t={t} icons={icons} />
                </DetailSection>
            )}
        </div>
    );
}
