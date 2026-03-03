import React from 'react';
import MetadataSection from '../sections/MetadataSection';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import DetailSection from '../DetailSection';
import CodeEditor from '../CodeEditor';

/**
 * Fallback Dumb Component for any K8s resource.
 * Renders spec and status dynamically.
 */
export default function GenericDetails({ data, t, settings }) {
    if (!data) return null;

    const { resource, metadata, spec, status, data: configData, extra } = data;

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

            {spec && Object.keys(spec).length > 0 && (
                <DetailSection title={t('spec')} icon="settings">
                    <div className="mt-4">
                        <CodeEditor 
                            value={JSON.stringify(spec, null, 2)} 
                            language="json" 
                            readOnly={true}
                            height="300px"
                        />
                    </div>
                </DetailSection>
            )}

            {configData && Object.keys(configData).length > 0 && (
                <DetailSection title={t('data')} icon="database">
                    <div className="mt-4">
                        <CodeEditor 
                            value={JSON.stringify(configData, null, 2)} 
                            language="json" 
                            readOnly={true}
                            height="300px"
                        />
                    </div>
                </DetailSection>
            )}

            {status && Object.keys(status).length > 0 && (
                <DetailSection title={t('status')} icon="activity">
                    <div className="mt-4">
                        <CodeEditor 
                            value={JSON.stringify(status, null, 2)} 
                            language="json" 
                            readOnly={true}
                            height="200px"
                        />
                    </div>
                </DetailSection>
            )}
        </div>
    );
}
