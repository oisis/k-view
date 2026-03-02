import React from 'react';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ServicesTable from '../ServicesTable';
import ConditionsTable from '../ConditionsTable';
import ExpandableCell from '../ExpandableCell';

export default function ReplicationControllerOverview({ data, spec, status, relatedPods, relatedServices, t, icons }) {
    const pods = Array.isArray(relatedPods) ? relatedPods : [];
    
    // Extract selector and images
    const selector = spec?.selector || {};
    const selectorStr = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(', ');
    
    const containers = spec?.template?.spec?.containers || [];
    const images = containers.map(c => c.image).join(', ');

    return (
        <>
            <DetailSection title={t('resource_info') || "Resource Info"}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Desired</span>
                        <span className="text-sm font-bold text-primary">{spec?.replicas ?? 0}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Pods Running</span>
                        <span className="text-sm font-bold text-success">{status?.readyReplicas ?? 0}</span>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Selector</span>
                        <div className="max-w-full">
                            <ExpandableCell value={selectorStr} />
                        </div>
                    </div>
                    <div className="px-6 py-4 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-text-muted uppercase mb-1">Images</span>
                        <div className="max-w-full">
                            <ExpandableCell value={images} type="images" />
                        </div>
                    </div>
                </div>
            </DetailSection>

            <PodsTable pods={pods} t={t} title={t('pods') || "Pods"} />
            
            <ServicesTable services={relatedServices} t={t} icons={icons} title="Services" />
            
            {status?.conditions && Array.isArray(status.conditions) && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}
        </>
    );
}
