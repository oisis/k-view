import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import ContainersSection from '../sections/ContainersSection';
import DetailSection from '../DetailSection';
import ConditionsTable from '../ConditionsTable';

/**
 * Dumb Component for Pod Details.
 */
export default function PodOverview({ data, t, settings }) {
    if (!data) return null;

    const { resource, metadata, spec, status, metrics, extra } = data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection metadata={metadata} t={t} />
                <ResourceInfoSection 
                    resource={resource} 
                    extra={extra} 
                    metrics={metrics}
                    t={t} 
                />
            </div>

            <ContainersSection 
                containers={spec?.containers || []} 
                statuses={status?.containerStatuses || []}
                t={t} 
            />

            {status?.conditions && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable conditions={status.conditions} t={t} />
                </DetailSection>
            )}
        </div>
    );
}
