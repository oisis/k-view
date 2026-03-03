import React from 'react';
import ConfigMapDataSection from '../ConfigMapDataSection';

/**
 * ConfigMapOverview - RESTORED FROZEN VIEW FROM MAIN
 */
export default function ConfigMapOverview({ data, kind, namespace, name, t, onRefresh }) {
    if (!data) return null;
    const cmData = data.data || data.resource?.data || {};

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ConfigMapDataSection 
                data={cmData} 
                kind={kind} 
                namespace={namespace} 
                name={name} 
                t={t} 
                onRefresh={onRefresh} 
            />
        </div>
    );
}
