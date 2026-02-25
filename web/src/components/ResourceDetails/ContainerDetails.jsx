import React from 'react';
import { useTheme } from '../../ThemeContext';
import DetailSection from './DetailSection';
import DetailRow from './DetailRow';
import ExpandableCell from './ExpandableCell';
import ProbeSummary from './ProbeSummary';

export default function ContainerDetails({ containers, statuses, t }) {
    const { icons } = useTheme();
    return (
        <div className="space-y-6 mt-4">
            {(!containers || containers.length === 0) ? (
                <DetailSection title={t('containers')}>
                    <div className="px-6 py-8 text-center text-[var(--text-muted)] italic">No containers found.</div>
                </DetailSection>
            ) : (
                containers.map((c, i) => {
                    const status = statuses?.find(s => s.name === c.name);
                    const stateKey = status?.state ? Object.keys(status.state)[0] : null;
                    const stateInfo = stateKey ? status.state[stateKey] : null;

                    return (
                        <DetailSection key={i} title={`${t('label_container')}: ${c.name}`}>
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-slate-600">
                                    <DetailRow label={t('label_image')}>
                                        <ExpandableCell value={c.image} type="images" />
                                    </DetailRow>
                                    <DetailRow label={t('label_status')}>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${status?.ready ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                                    {status?.ready ? 'Ready' : 'Not Ready'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${status?.started ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                                                    {status?.started ? 'Started' : 'Not Started'}
                                                </span>
                                                {status?.restartCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border bg-error/10 text-error border-error/20">
                                                        Restarts: {status.restartCount}
                                                    </span>
                                                )}
                                            </div>
                                            {stateInfo?.startedAt && (
                                                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                                    <icons.refresh size={12} />
                                                    Started at: <span className="text-[var(--text-secondary)] font-mono">{new Date(stateInfo.startedAt).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </DetailRow>
                                    <DetailRow label={t('label_env_variables')}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 py-1">
                                            {c.env?.map(ev => (
                                                <div key={ev.name} className="bg-black/20 rounded border border-white/5 p-2 font-mono text-[10px] flex flex-col gap-0.5 overflow-hidden">
                                                    <span className="text-info font-bold truncate" title={ev.name}>{ev.name}</span>
                                                    <span className="text-[var(--text-muted)] truncate" title={ev.value || (ev.valueFrom ? 'Value from source' : '—')}>
                                                        {ev.value || (ev.valueFrom ? '<secret/cm>' : '—')}
                                                    </span>
                                                </div>
                                            )) || <span className="text-[var(--text-muted)] italic">None</span>}
                                        </div>
                                    </DetailRow>
                                    <DetailRow label={t('label_mounts')}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
                                            {c.volumeMounts?.map(vm => (
                                                <div key={vm.mountPath} className="p-3 bg-black/20 rounded-xl border border-white/5 text-[11px] flex flex-col gap-2 relative overflow-hidden group">
                                                    <div className="font-bold text-info border-b border-white/5 pb-1.5 flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <icons.clipboard size={12} />
                                                            {vm.name}
                                                        </div>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${vm.readOnly ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                                                            {vm.readOnly ? 'READ-ONLY' : 'READ-WRITE'}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex gap-2">
                                                            <span className="text-[var(--text-muted)] w-16 shrink-0">Path:</span>
                                                            <span className="text-[var(--text-primary)] font-mono break-all">{vm.mountPath}</span>
                                                        </div>
                                                        {vm.subPath && (
                                                            <div className="flex gap-2 text-indigo-400/80">
                                                                <span className="text-[var(--text-muted)] w-16 shrink-0">Sub:</span>
                                                                <span className="font-mono break-all">{vm.subPath}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )) || <span className="text-[var(--text-muted)] italic">None</span>}
                                        </div>
                                    </DetailRow>
                                    <DetailRow label="Health Probes">
                                        <div className="flex flex-wrap gap-8 py-2">
                                            <ProbeSummary label="Liveness" probe={c.livenessProbe} t={t} />
                                            <ProbeSummary label="Readiness" probe={c.readinessProbe} t={t} />
                                            <ProbeSummary label="Startup" probe={c.startupProbe} t={t} />
                                        </div>
                                    </DetailRow>
                                </tbody>
                            </table>
                        </DetailSection>
                    );
                })
            )}
        </div>
    );
}
