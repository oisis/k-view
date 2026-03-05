import React from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function PodOverview({ data, spec, status, t, icons, namespace }) {
    const { icons: themeIcons } = useTheme();
    const controlledBy = data?.controlledBy || [];
    const containers = data?.containers || [];
    const relatedPvcs = data?.relatedPvcs || [];

    const ownerColumns = [
        { header: 'Name', accessor: (o) => <Link to={`/${o.extra?.kind || 'unknown'}s/${namespace}/${o.name}`} className="text-info hover:underline font-mono">{o.name}</Link> },
        { header: 'Kind', accessor: (o) => o.extra?.kind || '—', className: 'text-xs' },
        { header: 'Pods', accessor: (o) => o.extra?.readyReplicas || '—', className: 'text-center' },
        { header: 'Age', accessor: 'age' },
        { header: 'Labels', accessor: (o) => <ExpandableCell value={o.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Images', accessor: (o) => <ExpandableCell value={o.extra?.images || []} type="images" icons={themeIcons} /> }
    ];

    const pvcColumns = [
        { header: 'Name', accessor: (p) => <Link to={`/persistentvolumeclaims/${p.namespace}/${p.name}`} className="text-accent hover:underline font-mono">{p.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Labels', accessor: (p) => <ExpandableCell value={p.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Volume', accessor: (p) => p.extra?.volumeName || '—' },
        { header: 'Capacity', accessor: (p) => p.extra?.capacity || '—' },
        { header: 'Access Modes', accessor: (p) => <ExpandableCell value={p.extra?.accessModes || []} type="access-modes" icons={themeIcons} /> },
        { header: 'Storage Class', accessor: (p) => p.extra?.storageClass || '—' },
        { header: 'Created', accessor: 'age' }
    ];

    const renderProbe = (probe) => {
        if (!probe) return '—';
        return Object.entries(probe).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <ResourceInfoSection isPod={true} data={data} spec={spec} status={status} t={t} />

            {controlledBy.length > 0 && (
                <CommonTable title="Controlled by" columns={ownerColumns} data={controlledBy} t={t} />
            )}

            <CommonTable 
                title="Persistent Volume Claims" 
                columns={pvcColumns} 
                data={relatedPvcs} 
                t={t} 
            />

            <DetailSection title="Containers">
                <div className="grid grid-cols-1 gap-6">
                    {containers.map((c, i) => (
                        <div key={i} className="glass rounded-3xl border border-border p-6 flex flex-col gap-4 shadow-xl">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-border/30 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent/10 rounded-xl">
                                        <themeIcons.box size={20} className="text-accent" />
                                    </div>
                                    <span className="text-lg font-black text-primary truncate max-w-[250px]">{c.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${c.ready ? 'bg-success/20 text-success border border-success/30' : 'bg-warning/20 text-warning border border-warning/30'}`}>
                                        {c.ready ? 'Ready' : 'Not Ready'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-text-muted uppercase font-black tracking-widest block mb-1">Image</span>
                                        <span className="text-xs font-mono text-secondary break-all bg-black/20 p-2 rounded-lg block">{c.image}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/10">
                                        <span className="text-text-muted font-bold">Started</span>
                                        <span className={c.started ? 'text-success font-black' : 'text-warning'}>{c.started ? 'True' : 'False'}</span>
                                    </div>
                                    {c.stateReason && (
                                        <div className="flex justify-between items-center py-2 border-b border-border/10">
                                            <span className="text-text-muted font-bold">Reason</span>
                                            <span className="text-error font-black">{c.stateReason}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] text-text-muted uppercase font-black tracking-widest block mb-1 text-center">Environment Variables</span>
                                        <ExpandableCell 
                                            value={(c.env || []).map(e => `${e.name}=${e.value || (e.valueFrom ? '<secret/cm>' : '—')}`)} 
                                            type="env" 
                                            icons={themeIcons} 
                                            limit={2} 
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-text-muted uppercase font-black tracking-widest block mb-1 text-center">Mounts</span>
                                        <ExpandableCell value={(c.volumeMounts || []).map(m => `${m.mountPath} (${m.name})`)} type="mounts" icons={themeIcons} limit={2} />
                                    </div>
                                </div>
                            </div>

                            {/* Probes Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pt-4 border-t border-border/30">
                                <div>
                                    <span className="text-[10px] text-text-muted uppercase font-black tracking-widest block mb-1">Liveness Probe</span>
                                    <div className="text-[11px] font-mono text-secondary/80 bg-black/10 p-2 rounded-lg min-h-[40px]">
                                        {renderProbe(c.livenessProbe)}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-text-muted uppercase font-black tracking-widest block mb-1">Readiness Probe</span>
                                    <div className="text-[11px] font-mono text-secondary/80 bg-black/10 p-2 rounded-lg min-h-[40px]">
                                        {renderProbe(c.readinessProbe)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </DetailSection>
        </div>
    );
}
