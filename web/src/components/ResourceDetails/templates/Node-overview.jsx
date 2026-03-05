import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import { Link } from 'react-router-dom';
import ExpandableCell from '../ExpandableCell';
import PieChart from '../PieChart';
import { useTheme } from '../../../ThemeContext';

export default function NodeOverview({ data, spec, status, relatedPods = [], t, icons }) {
    const { icons: themeIcons } = useTheme();
    const info = status?.nodeInfo || {};
    const allocation = data?.allocation || {};
    const capacity = status?.capacity || {};
    const conditions = status?.conditions || [];

    // Allocation Percentages
    const cpuReqPercent = (allocation.cpu?.requests / allocation.cpu?.capacity) * 100 || 0;
    const cpuLimPercent = (allocation.cpu?.limits / allocation.cpu?.capacity) * 100 || 0;
    const memReqPercent = (allocation.memory?.requests / allocation.memory?.capacity) * 100 || 0;
    const memLimPercent = (allocation.memory?.limits / allocation.memory?.capacity) * 100 || 0;
    const podsPercent = (allocation.pods?.allocation / allocation.pods?.capacity) * 100 || 0;

    const podColumns = [
        { header: 'Name', accessor: (p) => <Link to={`/pods/${p.namespace}/${p.name}`} className="text-info hover:underline font-mono">{p.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Images', accessor: (p) => <ExpandableCell value={p.extra?.images || []} type="images" icons={themeIcons} /> },
        { header: 'Labels', accessor: (p) => <ExpandableCell value={p.extra?.labels || {}} type="labels" icons={themeIcons} /> },
        { header: 'Node', accessor: (p) => p.extra?.node || '—', className: 'font-mono text-xs' },
        { header: 'Status', accessor: 'status', badge: true },
        { header: 'Restarts', accessor: (p) => p.extra?.restarts ?? '0', className: 'text-center' },
        { header: 'CPU', accessor: (p) => p.extra?.cpu || '—', className: 'font-mono text-xs' },
        { header: 'RAM', accessor: (p) => p.extra?.memory || '—', className: 'font-mono text-xs' },
        { header: 'Created', accessor: 'age' }
    ];

    const conditionColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Last Probe Time', accessor: 'lastHeartbeatTime' },
        { header: 'Last Transition Time', accessor: 'lastTransitionTime' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Message', accessor: 'message', className: 'text-xs opacity-70' }
    ];

    const internalIP = (status?.addresses || []).find(a => a.type === 'InternalIP')?.address || '—';
    const hostname = (status?.addresses || []).find(a => a.type === 'Hostname')?.address || '—';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Pod CIDR</th>
                                <th className="px-6 py-2 text-center border-r border-border">Internal IP</th>
                                <th className="px-6 py-2 text-center">Hostname</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border font-mono">{spec?.podCIDR || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono">{internalIP}</td>
                                <td className="px-4 py-4 font-mono">{hostname}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <DetailSection title="System Information">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <tbody>
                            {[
                                { label: "Machine ID", value: info.machineID },
                                { label: "System UUID", value: info.systemUUID },
                                { label: "Boot ID", value: info.bootID },
                                { label: "Kernel Version", value: info.kernelVersion },
                                { label: "OS Image", value: info.osImage },
                                { label: "Container Runtime version", value: info.containerRuntimeVersion },
                                { label: "Kubelet Version", value: info.kubeletVersion },
                                { label: "Kube-Proxy Version", value: info.kubeProxyVersion || '—' },
                                { label: "Operation system", value: info.operatingSystem },
                                { label: "Architecture", value: info.architecture },
                                { label: "CPU capacity", value: capacity.cpu },
                                { label: "RAM capacity", value: capacity.memory },
                                { label: "Pods Capacity", value: capacity.pods }
                            ].map((row, idx, arr) => (
                                <tr key={row.label} className={`${idx !== arr.length - 1 ? 'border-b border-border' : ''} hover:bg-white/5 transition-colors`}>
                                    <td className="px-6 py-3 bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted w-1/3 border-r border-border">
                                        {row.label}
                                    </td>
                                    <td className="px-6 py-3 text-primary font-bold font-mono text-xs truncate" title={row.value}>
                                        {row.value || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <DetailSection title="Allocation">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-6 px-2">
                    <PieChart 
                        percent={cpuReqPercent} 
                        label="CPU Requests" 
                        subLabel={`${allocation.cpu?.requests || 0} / ${allocation.cpu?.capacity || 0}m`}
                        color="var(--accent)"
                    />
                    <PieChart 
                        percent={cpuLimPercent} 
                        label="CPU Limits" 
                        subLabel={`${allocation.cpu?.limits || 0} / ${allocation.cpu?.capacity || 0}m`}
                        color="#ef4444" 
                    />
                    <PieChart 
                        percent={memReqPercent} 
                        label="RAM Requests" 
                        subLabel={`${(allocation.memory?.requests / 1024).toFixed(1)} / ${(allocation.memory?.capacity / 1024).toFixed(1)} GiB`}
                        color="var(--text-info)"
                    />
                    <PieChart 
                        percent={memLimPercent} 
                        label="RAM Limits" 
                        subLabel={`${(allocation.memory?.limits / 1024).toFixed(1)} / ${(allocation.memory?.capacity / 1024).toFixed(1)} GiB`}
                        color="#f59e0b"
                    />
                    <PieChart 
                        percent={podsPercent} 
                        label="Pods" 
                        subLabel={`${allocation.pods?.allocation || 0} / ${allocation.pods?.capacity || 0}`}
                        color="var(--text-green)"
                    />
                </div>
            </DetailSection>

            <CommonTable title="Conditions" columns={conditionColumns} data={conditions} t={t} />
            <CommonTable title="Pods" columns={podColumns} data={relatedPods} t={t} />
        </div>
    );
}
