import React from 'react';
import SecretDataSection from '../SecretDataSection';

export default function SecretOverview({ data, kind, namespace, name, t, onRefresh }) {
    if (!data || !data.data) return null;

    return (
        <SecretDataSection 
            data={data.data} 
            kind={kind} 
            namespace={namespace} 
            name={name} 
            t={t} 
            onRefresh={onRefresh} 
        />
    );
}
