import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function EventOverview({ data, t }) {
    return (
        <DetailSection title={t('resource_info')}>
            <table className="w-full text-sm text-left border-collapse">
                <tbody className="divide-y divide-slate-600">
                    <DetailRow label="Type">
                        <span className={`font-bold ${data.type === 'Warning' ? 'text-error' : 'text-success'}`}>{data.type}</span>
                    </DetailRow>
                    <DetailRow label="Reason">
                        <span className="font-bold text-primary">{data.reason}</span>
                    </DetailRow>
                    <DetailRow label="Message">
                        <span className="text-secondary">{data.message}</span>
                    </DetailRow>
                    <DetailRow label="Object">
                        <span className="font-mono text-info">{data.involvedObject?.kind}/{data.involvedObject?.name}</span>
                    </DetailRow>
                    <DetailRow label="Source">
                        <span className="text-text-muted">{data.source?.component || '—'} {data.source?.host || ''}</span>
                    </DetailRow>
                    <DetailRow label="Count">
                        <span className="font-bold text-primary">{data.count}</span>
                    </DetailRow>
                    <DetailRow label="First Seen">
                        <span className="text-text-muted">{data.firstTimestamp}</span>
                    </DetailRow>
                    <DetailRow label="Last Seen">
                        <span className="text-text-muted">{data.lastTimestamp}</span>
                    </DetailRow>
                </tbody>
            </table>
        </DetailSection>
    );
}
