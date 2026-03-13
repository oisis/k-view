import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ResourceInfoSection from '../sections/ResourceInfoSection';
import CommonTable from '../../Common/CommonTable';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function DeploymentOverview({ data, metadata, spec, status, relatedReplicaSets = [], relatedPods = [], relatedHpas = [], t, icons }) {
    const { icons: themeIcons } = useTheme();
    const conditions = status?.conditions || [];
    
    // Split RS into new and old based on deployment revision
    const deploymentRevision = metadata?.annotations?.['deployment.kubernetes.io/revision'];
    const newRS = relatedReplicaSets.filter(rs => {
        const rev = rs.extra?.annotations?.['deployment.kubernetes.io/revision'];
        return rev && String(rev) === String(deploymentRevision);
    });
    const oldRS = relatedReplicaSets.filter(rs => {
        const rev = rs.extra?.annotations?.['deployment.kubernetes.io/revision'];
        return !rev || String(rev) !== String(deploymentRevision);
    });

    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderLabelsCell = (labels, id) => {
        const entries = Object.entries(labels || {});
        if (entries.length === 0) return '—';
        
        const isExpanded = expandedRows[id];
        const limit = 2;
        const displayEntries = isExpanded ? entries : entries.slice(0, limit);
        const hasMore = entries.length > limit;

        return (
            <div className="flex flex-col gap-1 items-center">
                {displayEntries.map(([k, v]) => (
                    <ExpandableCell key={k} value={{[k]: v}} type="labels" icons={themeIcons} />
                ))}
                {hasMore && (
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleRow(id); }}
                        className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-accent/80 mt-1"
                    >
                        {isExpanded ? 'Less' : `More (${entries.length - limit})`}
                    </button>
                )}
            </div>
        );
    };

    const rsColumns = [
        { header: 'Name', accessor: (rs) => <Link to={`/resources/ReplicaSets/${rs.namespace}/${rs.name}`} className="text-info hover:underline font-mono">{rs.name}</Link> },
        { header: 'Namespace', accessor: 'namespace' },
        { header: 'Age', accessor: 'age' },
        { header: 'Labels', accessor: (rs) => renderLabelsCell(rs.extra?.labels, `rs-${rs.name}`), className: 'w-48' },
        { header: 'Pods', accessor: (rs) => rs.extra?.readyReplicas || 0, className: 'text-center' }
    ];

    const conditionColumns = [
        { header: 'Type', accessor: 'type', className: 'font-bold' },
        { header: 'Status', accessor: 'status', className: 'text-center' },
        { header: 'Last probe time', accessor: 'lastUpdateTime' },
        { header: 'Last transition time', accessor: 'lastTransitionTime' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Message', accessor: 'message', className: 'text-xs opacity-70' }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* 1. Resource Info */}
            <ResourceInfoSection isDeployment={true} data={data} spec={spec} status={status} t={t} />

            {/* 2. Rolling update strategy */}
            <DetailSection title="Rolling update strategy">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Updated</th>
                                <th className="px-6 py-2 text-center border-r border-border">Total</th>
                                <th className="px-6 py-2 text-center">Available</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-foreground">
                                <td className="px-6 py-4 text-center border-r border-border text-success">
                                    {status?.updatedReplicas || 0}
                                </td>
                                <td className="px-6 py-4 text-center border-r border-border text-foreground">
                                    {status?.replicas || 0}
                                </td>
                                <td className="px-6 py-4 text-center text-info">
                                    {status?.availableReplicas || 0}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            {/* 3. Conditions */}
            <CommonTable title="Conditions" columns={conditionColumns} data={conditions} t={t} />

            {/* 4. New Replica Set */}
            <CommonTable title="New Replica Set" columns={rsColumns} data={newRS} t={t} />

            {/* 5. Old Replica Set */}
            <CommonTable title="Old Replica Set" columns={rsColumns} data={oldRS} t={t} />

            {/* 6. Horizontal Pod Autoscalers */}
            <CommonTable 
                title="Horizontal Pod Autoscalers" 
                columns={[
                    { header: 'Name', accessor: (h) => <Link to={`/resources/HorizontalPodAutoscalers/${h.namespace}/${h.name}`} className="text-accent hover:underline">{h.name}</Link> },
                    { header: 'Type', accessor: (h) => h.extra?.type || 'Resource' },
                    { header: 'Resource / Name', accessor: (h) => h.extra?.reference || '—' },
                    { header: 'Target', accessor: (h) => h.extra?.targets || '—' },
                    { header: 'Current', accessor: (h) => h.extra?.currentReplicas || 0, className: 'text-center' }
                ]} 
                data={relatedHpas} 
                t={t} 
            />
        </div>
    );
}
