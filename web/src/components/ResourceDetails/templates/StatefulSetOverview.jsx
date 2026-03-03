import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import PodsTable from '../PodsTable';
import ConditionsTable from '../ConditionsTable';
import HpaTable from '../HpaTable';
import ServicesTable from '../ServicesTable';
import ContainersSection from '../sections/ContainersSection';

/**
 * StatefulSetOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function StatefulSetOverview({ data, spec, status, relatedPods, relatedServices, relatedHpas, t, icons }) {
    if (!data) return null;

    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const services = Array.isArray(relatedServices) ? relatedServices : [];
    const hpas = Array.isArray(relatedHpas) ? relatedHpas : [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title={t('resource_info') || "Resource Info"}>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border rounded-t-xl overflow-hidden">
                    <div className="px-4 py-3 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Replicas</span>
                        <span className="text-sm font-bold text-primary">{status?.replicas ?? 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Ready</span>
                        <span className="text-sm font-bold text-success">{status?.readyReplicas ?? 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Current</span>
                        <span className="text-sm font-bold text-info">{status?.currentReplicas ?? 0}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Updated</span>
                        <span className="text-sm font-bold text-success">{status?.updatedReplicas ?? 0}</span>
                    </div>
                </div>
                <div className="p-4 bg-[var(--bg-sidebar)]/5 border-t border-border rounded-b-xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <tbody className="divide-y divide-border/30">
                            <DetailRow label="Service Name">
                                <span className="text-sm font-bold text-accent">{spec?.serviceName || '—'}</span>
                            </DetailRow>
                            <DetailRow label="Update Strategy">
                                <span className="text-sm text-primary">{spec?.updateStrategy?.type || 'RollingUpdate'}</span>
                            </DetailRow>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <ContainersSection 
                containers={spec?.template?.spec?.containers || []} 
                initContainers={spec?.template?.spec?.initContainers || []}
                t={t} 
            />

            {pods.length > 0 && <PodsTable pods={pods} t={t} />}
            {services.length > 0 && <ServicesTable services={services} t={t} />}
            {hpas.length > 0 && <HpaTable hpas={hpas} t={t} />}
            
            {(status?.conditions || data.resource?.status?.conditions) && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable conditions={status?.conditions || data.resource?.status?.conditions || []} t={t} />
                </DetailSection>
            )}
        </div>
    );
}
