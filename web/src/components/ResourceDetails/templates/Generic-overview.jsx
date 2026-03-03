import React from 'react';
import DetailSection from '../DetailSection';
import CodeEditor from '../CodeEditor';

/**
 * GenericDetails - RESTORED FROZEN VIEW (Cleanup Duplicate Metadata)
 */
export default function GenericDetails({ data, t }) {
    if (!data) return null;
    const { spec, status, data: configData } = data;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {spec && Object.keys(spec).length > 0 && (
                <DetailSection title="spec">
                    <div className="mt-4"><CodeEditor value={JSON.stringify(spec, null, 2)} language="json" readOnly={true} height="300px" /></div>
                </DetailSection>
            )}
            {configData && Object.keys(configData).length > 0 && (
                <DetailSection title="data">
                    <div className="mt-4"><CodeEditor value={JSON.stringify(configData, null, 2)} language="json" readOnly={true} height="300px" /></div>
                </DetailSection>
            )}
            {status && Object.keys(status).length > 0 && (
                <DetailSection title="status">
                    <div className="mt-4"><CodeEditor value={JSON.stringify(status, null, 2)} language="json" readOnly={true} height="200px" /></div>
                </DetailSection>
            )}
        </div>
    );
}
