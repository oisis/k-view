import React from 'react';
import DetailSection from '../DetailSection';
import CapacityTable from '../CapacityTable';
import ConditionsTable from '../ConditionsTable';
import PodsTable from '../PodsTable';

export default function NodeOverview({ data, metadata, spec, status, relatedPods, t, icons }) {
    return (
        <>
            <DetailSection title={t('resource_info')}>
                <div className="p-4 bg-[var(--bg-sidebar)]/5">
                    <CapacityTable capacity={status.capacity} allocatable={status.allocatable} t={t} />
                </div>
                <table className="w-full text-sm text-left border-collapse">
                    <tbody className="divide-y divide-slate-600">
                        <tr className="border-b border-slate-600">
                            <td className="px-4 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] w-1/4">Node Info</td>
                            <td className="px-4 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                                    <div><span className="text-[var(--text-muted)]">OS:</span> {status.nodeInfo?.osImage}</div>
                                    <div><span className="text-[var(--text-muted)]">Kernel:</span> {status.nodeInfo?.kernelVersion}</div>
                                    <div><span className="text-[var(--text-muted)]">Kubelet:</span> {status.nodeInfo?.kubeletVersion}</div>
                                    <div><span className="text-[var(--text-muted)]">Runtime:</span> {status.nodeInfo?.containerRuntimeVersion}</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </DetailSection>

            {status?.conditions && (
                <ConditionsTable conditions={status.conditions} t={t} icons={icons} />
            )}

            {relatedPods && <PodsTable pods={relatedPods} t={t} icons={icons} title="Allocated Pods" />}
        </>
    );
}
