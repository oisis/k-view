import React from 'react';
import SecretDataSection from '../SecretDataSection';

/**
 * SecretOverview - Cleanup Duplicate Metadata
 */
export default function SecretOverview({ data, kind, namespace, name, t, onRefresh }) {
    if (!data) return null;
    const secretData = data.data || data.resource?.data || {};

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <SecretDataSection 
                data={secretData} 
                kind={kind} 
                namespace={namespace} 
                name={name} 
                t={t} 
                onRefresh={onRefresh} 
            />
        </div>
    );
}
