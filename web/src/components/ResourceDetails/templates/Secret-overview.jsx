import React from 'react';
import SecretDataSection from '../SecretDataSection';

export default function SecretOverview({ data, metadata, t, onRefresh }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <SecretDataSection 
                data={data?.data || {}} 
                kind="Secrets"
                namespace={metadata?.namespace}
                name={metadata?.name}
                t={t}
                onRefresh={onRefresh}
            />
        </div>
    );
}
