import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import DetailSection from '../DetailSection';
import PodsTable from '../PodsTable';
import ConditionsTable from '../ConditionsTable';

/**
 * Dumb Component for Deployment Details.
 */
export default function DeploymentOverview({ data, t, settings }) {
    if (!data) return null;

    const { resource, metadata, spec, status, extra } = data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetadataSection metadata={metadata} t={t} />
                <ResourceInfoSection 
                    resource={resource} 
                    extra={extra} 
                    t={t} 
                />
            </div>

            {status?.conditions && (
                <DetailSection title={t('conditions')} icon="activity">
                    <ConditionsTable conditions={status.conditions} t={t} />
                </DetailSection>
            )}
        </div>
    );
}
