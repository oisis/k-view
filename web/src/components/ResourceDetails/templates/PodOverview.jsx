import React from 'react';
import DetailSection from '../DetailSection';
import ContainerDetails from '../ContainerDetails';
import ConditionsTable from '../ConditionsTable';

export default function PodOverview({ data, metadata, spec, status, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-slate-600">
                        <ContainerDetails containers={spec.containers || []} t={t} />
                    </tbody>
                </table>
            </DetailSection>
            
            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}
        </>
    );
}
