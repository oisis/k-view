import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ServicesTable from '../ServicesTable';
import HpaTable from '../HpaTable';
import ConditionsTable from '../ConditionsTable';
import ExpandableCell from '../ExpandableCell';

export default function StatefulSetOverview({ data, metadata, spec, status, relatedPods, relatedServices, relatedHpas, t, icons }) {
    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    const hpas = Array.isArray(relatedHpas) ? relatedHpas : [];
    
    // Extract images and init images
    const containers = spec?.template?.spec?.containers || [];
    const initContainers = spec?.template?.spec?.initContainers || [];
    const images = (containers || []).map(c => c.image).join(', ');
    const initImages = (initContainers || []).map(c => c.image).join(', ');

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailSection title="Resources Info">
                    <div className="divide-y divide-border bg-[var(--bg-sidebar)]/5">
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-xs font-bold text-text-muted uppercase mb-1">Images</span>
                            <div className="max-w-full">
                                <ExpandableCell value={images} type="images" />
                            </div>
                        </div>
                        <div className="px-6 py-4 flex flex-col items-center text-center">
                            <span className="text-xs font-bold text-text-muted uppercase mb-1">Init Images</span>
                            <div className="max-w-full">
                                <ExpandableCell value={initImages || '—'} type="images" />
                            </div>
                        </div>
                    </div>
                </DetailSection>

                <DetailSection title="Pods Status">
                    <div className="grid grid-cols-2 h-full divide-x divide-border bg-[var(--bg-sidebar)]/5">
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-xs font-bold text-text-muted uppercase mb-1">Desired</span>
                            <span className="text-3xl font-black text-primary">{spec?.replicas ?? 0}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-xs font-bold text-text-muted uppercase mb-1">Running</span>
                            <span className="text-3xl font-black text-success">{status?.readyReplicas ?? 0}</span>
                        </div>
                    </div>
                </DetailSection>
            </div>

            <PodsTable pods={pods} t={t} title="Pods" />
            
            {relatedServices && relatedServices.length > 0 && (
                <ServicesTable services={relatedServices} t={t} icons={icons} title="Services" />
            )}

            {hpas.length > 0 && <HpaTable hpas={hpas} t={t} />}
            
            {status?.conditions && Array.isArray(status.conditions) && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}
        </>
    );
}
