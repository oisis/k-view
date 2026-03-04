import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import DetailRow from '../DetailRow';
import { Link } from 'react-router-dom';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function NodeOverview({ data, spec, status, relatedPods = [], t, icons }) {
    const { icons: themeIcons } = useTheme();
    const info = status?.nodeInfo || {};
    const allocation = data?.allocation || {};
    const conditions = status?.conditions || [];

    const podColumns = [
        { header: 'Name', accessor: (p) => <Link to={`/pods/${p.namespace}/${p.name}`} className="text-info hover:underline">{p.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Images', accessor: (p) => <ExpandableCell value={p.extra?.images || []} type="images" icons={themeIcons} /> },
        { header: 'Labels', accessor: (p) => <ExpandableCell value={p.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Created', accessor: 'age' }
    ];

    const conditionColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Last probe time', accessor: 'lastHeartbeatTime' },
        { header: 'Last transition time', accessor: 'lastTransitionTime' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Message', accessor: 'message', className: 'text-xs opacity-70' }
    ];

    const formatIPs = (addrs) => {
        return (addrs || []).map(a => `${a.type}: ${a.address}`).join(', ');
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Pod CIDR</th>
                                <th className="px-6 py-2 text-center border-r border-border">Addresses</th>
                                <th className="px-6 py-2 text-center">Unschedulable</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border font-mono">{spec?.podCIDR || '—'}</td>
                                <td className="px-4 py-4 border-r border-border text-xs">{formatIPs(status?.addresses)}</td>
                                <td className="px-4 py-4">{String(spec?.unschedulable || false)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <DetailSection title="System Information">
                <div className="glass rounded-2xl border border-border p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailRow label="Machine ID" value={info.machineID} />
                    <DetailRow label="Kernel Version" value={info.kernelVersion} />
                    <DetailRow label="OS Image" value={info.osImage} />
                    <DetailRow label="Architecture" value={info.architecture} />
                    <DetailRow label="Container Runtime" value={info.containerRuntimeVersion} />
                    <DetailRow label="Kubelet Version" value={info.kubeletVersion} />
                    <DetailRow label="Kube-Proxy Version" value={info.kubeProxyVersion} />
                    <DetailRow label="Operating System" value={info.operatingSystem} />
                </div>
            </DetailSection>

            <DetailSection title="Allocation">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="glass rounded-2xl border border-border p-4">
                        <span className="text-[10px] font-black uppercase text-text-muted block mb-2">CPU (Requests/Capacity)</span>
                        <span className="text-lg font-bold text-primary">{allocation.cpu?.requests || 0} / {allocation.cpu?.capacity || 0}</span>
                    </div>
                    <div className="glass rounded-2xl border border-border p-4">
                        <span className="text-[10px] font-black uppercase text-text-muted block mb-2">Memory (Requests/Capacity)</span>
                        <span className="text-lg font-bold text-info">{allocation.memory?.requests || 0} / {allocation.memory?.capacity || 0}</span>
                    </div>
                    <div className="glass rounded-2xl border border-border p-4">
                        <span className="text-[10px] font-black uppercase text-text-muted block mb-2">Pods (Allocation/Capacity)</span>
                        <span className="text-lg font-bold text-success">{allocation.pods?.allocation || 0} / {allocation.pods?.capacity || 0}</span>
                    </div>
                </div>
            </DetailSection>

            <CommonTable title="Conditions" columns={conditionColumns} data={conditions} t={t} />
            <CommonTable title="Pods" columns={podColumns} data={relatedPods} t={t} />
        </div>
    );
}
