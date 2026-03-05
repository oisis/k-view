import React from 'react';
import ConfigMapDataSection from '../ConfigMapDataSection';

export default function ConfigMapOverview({ data, metadata, t }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ConfigMapDataSection 
                data={data?.data || {}} 
                kind="ConfigMaps"
                namespace={metadata?.namespace}
                name={metadata?.name}
                t={t}
            />
        </div>
    );
}
