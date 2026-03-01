import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';
import CapacityTable from '../CapacityTable';
import PodsTable from '../PodsTable';
import PieChart from '../PieChart';

export default function NodeOverview({ data, metadata, spec, status, relatedPods, t, icons }) {
    const nodeStatus = status || data?.status || {};
    const nodeInfo = nodeStatus.nodeInfo || spec?.nodeInfo || {};
    const allocation = data?.allocation || {};
    
    // In v0.37.0 addresses were sometimes in data.addresses or status.addresses
    const addresses = data?.addresses || nodeStatus?.addresses || [];
    const conditions = nodeStatus?.conditions || [];

    return (
        <>
            <DetailSection title="Addresses" className="mt-4">
                {addresses.length === 0 ? (
                    <div className="p-4 text-center text-text-muted italic">No addresses found.</div>
                ) : (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addresses.map((addr, idx) => (
                            <div key={idx} className="bg-[var(--bg-sidebar)]/20 p-4 rounded border border-border/50 flex flex-col">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{addr.type}</span>
                                <span className="text-sm font-mono font-bold text-info">{addr.address}</span>
                            </div>
                        ))}
                    </div>
                )}
            </DetailSection>

            <DetailSection title="System Information">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">
                    <div className="overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse">
                            <tbody className="divide-y divide-border">
                                <DetailRow label="Machine ID">
                                    <span className="font-mono text-xs">{nodeInfo.machineID || '—'}</span>
                                </DetailRow>
                                <DetailRow label="System UUID">
                                    <span className="font-mono text-xs">{nodeInfo.systemUUID || '—'}</span>
                                </DetailRow>
                                <DetailRow label="Boot ID">
                                    <span className="font-mono text-xs">{nodeInfo.bootID || '—'}</span>
                                </DetailRow>
                                <DetailRow label="Kernel Version">
                                    <span className="font-bold">{nodeInfo.kernelVersion || '—'}</span>
                                </DetailRow>
                                <DetailRow label="OS Image">
                                    <span className="font-bold">{nodeInfo.osImage || '—'}</span>
                                </DetailRow>
                            </tbody>
                        </table>
                    </div>
                    <div className="overflow-hidden">
                        <table className="w-full text-sm text-left border-collapse">
                            <tbody className="divide-y divide-border">
                                <DetailRow label="Container Runtime">
                                    <span className="font-bold text-info">{nodeInfo.containerRuntimeVersion || '—'}</span>
                                </DetailRow>
                                <DetailRow label="Kubelet Version">
                                    <span className="font-bold text-info">{nodeInfo.kubeletVersion || '—'}</span>
                                </DetailRow>
                                <DetailRow label="Kube-Proxy Version">
                                    <span className="font-bold text-info">{nodeInfo.kubeProxyVersion || '—'}</span>
                                </DetailRow>
                                <DetailRow label="Architecture">
                                    <span className="font-bold uppercase">{nodeInfo.architecture || '—'}</span>
                                </DetailRow>
                                <DetailRow label="Operating System">
                                    <span className="font-bold capitalize">{nodeInfo.operatingSystem || '—'}</span>
                                </DetailRow>
                            </tbody>
                        </table>
                    </div>
                </div>
            </DetailSection>

            <DetailSection title="Allocation">
                <div className="p-4 bg-[var(--bg-sidebar)]/5 border-b border-border">
                    <CapacityTable capacity={nodeStatus.capacity || {}} allocatable={nodeStatus.allocatable || {}} t={t} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 p-6 bg-[var(--bg-sidebar)]/5 rounded border border-border/30">
                    <PieChart
                        percent={allocation.cpu?.capacity > 0 ? (allocation.cpu.requests / allocation.cpu.capacity) * 100 : 0}
                        label="CPU Requests"
                        subLabel={`Cores: ${allocation.cpu?.requests || '0'}`}
                        color="var(--text-info)"
                    />
                    <PieChart
                        percent={allocation.cpu?.capacity > 0 ? (allocation.cpu.limits / allocation.cpu.capacity) * 100 : 0}
                        label="CPU Limits"
                        subLabel={`Cores: ${allocation.cpu?.limits || '0'}`}
                        color="var(--text-info)"
                    />
                    <PieChart
                        percent={parseFloat(allocation.memory?.capacity) > 0 ? (allocation.memory.requests / parseFloat(allocation.memory.capacity)) * 100 : 0}
                        label="Memory Requests"
                        subLabel={`MiB: ${allocation.memory?.requests || '0'}`}
                        color="var(--text-info)"
                    />
                    <PieChart
                        percent={parseFloat(allocation.memory?.capacity) > 0 ? (allocation.memory.limits / parseFloat(allocation.memory.capacity)) * 100 : 0}
                        label="Memory Limits"
                        subLabel={`MiB: ${allocation.memory?.limits || '0'}`}
                        color="var(--text-info)"
                    />
                    <PieChart
                        percent={allocation.pods?.capacity > 0 ? (allocation.pods.allocation / allocation.pods.capacity) * 100 : 0}
                        label="Pods"
                        subLabel={`Pods ${allocation.pods?.allocation || '0'}`}
                        color="var(--text-success)"
                    />
                </div>
            </DetailSection>

            <DetailSection title="Conditions" className="mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Last probe time</th>
                                <th className="px-4 py-3">Last transition time</th>
                                <th className="px-4 py-3">Reason</th>
                                <th className="px-4 py-3">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {conditions.length === 0 ? (
                                <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted italic">No conditions found.</td></tr>
                            ) : (
                                conditions.map((cond, idx) => (
                                    <tr key={idx} className="hover:bg-slate-700/10 transition-colors">
                                        <td className="px-4 py-3 font-bold text-info">{cond.type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${cond.status === 'True' ? (cond.type === 'Ready' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning') : (cond.type === 'Ready' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success')}`}>
                                                {cond.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-text-muted font-mono">{cond.lastProbeTime ? new Date(cond.lastProbeTime).toLocaleString() : '—'}</td>
                                        <td className="px-4 py-3 text-xs text-text-muted font-mono">{cond.lastTransitionTime ? new Date(cond.lastTransitionTime).toLocaleString() : '—'}</td>
                                        <td className="px-4 py-3 font-medium">{cond.reason}</td>
                                        <td className="px-4 py-3 text-xs text-secondary italic max-w-xs truncate" title={cond.message}>{cond.message}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} title="Allocated Pods" />}
        </>
    );
}
