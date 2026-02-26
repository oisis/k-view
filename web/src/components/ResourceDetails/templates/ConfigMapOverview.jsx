import React from 'react';
import DetailSection from '../DetailSection';
import CodeEditor from '../CodeEditor';

export default function ConfigMapOverview({ data, t }) {
    if (!data || !data.data) return null;

    return (
        <DetailSection title={t('data') || "Data"} className="mt-4">
            <CodeEditor
                value={JSON.stringify(data.data, null, 2)}
                readOnly={true}
                fontSize={13}
            />
        </DetailSection>
    );
}
