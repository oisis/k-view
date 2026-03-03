import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ServicesTable from '../ServicesTable';
import ConditionsTable from '../ConditionsTable';
import ContainerDetails from '../ContainerDetails';

/**
 * ReplicaSetOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function ReplicaSetOverview({ data, spec, status, relatedPods, relatedServices, t, icons }) {
    if (!data) return null;

    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const selector = spec?.selector?.matchLabels || {};
    const containers = spec?.template?.spec?.containers || [];
    const images = (containers || []).map(c => c.image).join(', ');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info') || "Resource Info"}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-t-xl overflow-hidden">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Replicas</span>
                        <span className="text-sm font-bold text-primary">
                            {status?.readyReplicas || 0} / {spec?.replicas || 0}
                        </span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Available</span>
                        <span className="text-sm font-bold text-success">{status?.availableReplicas || 0}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center col-span-2 overflow-hidden">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Images</span>
                        <span className="text-xs font-mono text-secondary truncate w-full" title={images}>{images || '—'}</span>
                    </div>
                </div>
                <div className="p-4 bg-[var(--bg-sidebar)]/5 border-t border-border rounded-b-xl overflow-hidden">
                     <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Selector</span>
                     <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selector || {}).map(([k, v]) => (
                            <span key={k} className="px-2 py-0.5 bg-info/10 text-info rounded text-xs font-mono border border-info/20">
                                {k}={v}
                            </span>
                        ))}
                        {Object.keys(selector || {}).length === 0 && <span className="text-text-muted italic">—</span>}
                     </div>
                </div>
            </DetailSection>

            {(containers || []).length > 0 && (
                <ContainerDetails 
                    containers={containers} 
                    statuses={[]} 
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
