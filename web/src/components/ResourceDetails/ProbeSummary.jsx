import React from 'react';

export default function ProbeSummary({ label, probe, t }) {
    if (!probe) return null;
    let type = 'HTTP';
    let uri = '';
    if (probe.httpGet) {
        type = 'HTTP';
        uri = `${probe.httpGet.path}:${probe.httpGet.port}`;
    } else if (probe.tcpSocket) {
        type = 'TCP';
        uri = `port ${probe.tcpSocket.port}`;
    } else if (probe.exec) {
        type = 'Exec';
        uri = probe.exec.command?.join(' ');
    }

    return (
        <div className="flex flex-col gap-1 border-l-2 border-info/30 pl-2">
            <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">{label} ({type})</span>
            <div className="text-[11px] font-mono text-info bg-info/5 px-1.5 py-0.5 rounded truncate max-w-[150px]" title={uri}>{uri}</div>
            <div className="grid grid-cols-2 gap-x-2 text-[9px] text-text-muted uppercase font-bold mt-1">
                <span title="Initial Delay">D: {probe.initialDelaySeconds || 0}s</span>
                <span title="Timeout">T: {probe.timeoutSeconds || 1}s</span>
                <span title="Period">P: {probe.periodSeconds || 10}s</span>
                <span title="Success Threshold">S: {probe.successThreshold || 1}</span>
                <span title="Failure Threshold">F: {probe.failureThreshold || 3}</span>
            </div>
        </div>
    );
}
