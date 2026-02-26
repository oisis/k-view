import React from 'react';
import ConfigMapDataSection from '../ConfigMapDataSection';

export default function ConfigMapOverview({ data, kind, namespace, name, t, onRefresh }) {
    if (!data || !data.data) return null;

    return (
        <ConfigMapDataSection 
            data={data.data} 
            kind={kind} 
            namespace={namespace} 
            name={name} 
            t={t} 
            onRefresh={onRefresh} 
        />
    );
}
