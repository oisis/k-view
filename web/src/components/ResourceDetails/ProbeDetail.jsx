import React from 'react';

export default function ProbeDetail({ label, probe, t }) {
    if (!probe) return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
            <span className="text-[var(--text-muted)] italic">{t('not_defined')}</span>
        </div>
    );

    let details = '';
    if (probe.httpGet) details = `HTTP ${probe.httpGet.port} ${probe.httpGet.path}`;
    else if (probe.tcpSocket) details = `TCP ${probe.tcpSocket.port}`;
    else if (probe.exec) details = `Exec ${probe.exec.command?.join(' ')}`;
    else if (probe.grpc) details = `GRPC ${probe.grpc.port || ''} ${probe.grpc.service || ''}`;

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text-[var(--text-white)])] uppercase tracking-wider">{label}</span>
                         <div className="text-sm font-mono text-info bg-info/10 p-1.5 rounded">                {details || 'Unknown'}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap gap-x-3">
                <span>{t('delay')}: {probe.initialDelaySeconds || 0}s</span>
                <span>{t('timeout')}: {probe.timeoutSeconds || 1}s</span>
                <span>{t('period')}: {probe.periodSeconds || 10}s</span>
            </div>
        </div>
    );
}
