import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

/**
 * MetadataSection - Compact Horizontal Table View
 * Matches YAML requirements with optimized UX (interactive Age, removed Name).
 */
export default function MetadataSection({ 
    metadata = {}, namespace, t, settings, data = {}, kindLower = '' 
}) {
    const { icons } = useTheme();
    const [showExactDate, setShowExactDate] = useState(false);
    const [showAllLabels, setShowAllLabels] = useState(false);
    const [showAllAnnotations, setShowAllAnnotations] = useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    };

    const isClusterScoped = [
        'node', 'nodes', 'namespace', 'namespaces', 'pv', 'pvs', 'persistentvolume', 'persistentvolumes',
        'clusterrole', 'clusterroles', 'clusterrolebinding', 'clusterrolebindings',
        'storageclass', 'storageclasses', 'crd', 'customresourcedefinitions', 'ingressclass', 'ingressclasses'
    ].includes(kindLower);

    const sortedLabels = Object.entries(metadata?.labels || {}).sort(([a], [b]) => a.localeCompare(b));
    const sortedAnnotations = Object.entries(metadata?.annotations || {}).sort(([a], [b]) => a.localeCompare(b));

    const renderList = (items, type, showAll, setShowAll, limit = 2) => {
        if (items.length === 0) return <span className="text-text-muted italic text-xs">—</span>;
        
        const displayItems = showAll ? items : items.slice(0, limit);
        const hasMore = items.length > limit;

        return (
            <div className="flex flex-col gap-1 w-full">
                <div className="flex flex-col gap-1">
                    {displayItems.map(([k, v]) => (
                        <div key={k} className="w-fit max-w-full">
                            <ExpandableCell 
                                value={{[k]: v}} 
                                type={type} 
                                customStyle={type === 'annotations' ? "bg-success/10 text-success border-success/20" : "bg-info/10 text-info border-info/20"}
                                icons={icons}
                            />
                        </div>
                    ))}
                </div>
                {hasMore && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowAll(!showAll); }}
                        className="text-[9px] font-black uppercase tracking-widest text-accent hover:text-accent/80 transition-colors w-fit mt-1"
                    >
                        {showAll ? 'Less' : `More (${items.length - limit})`}
                    </button>
                )}
            </div>
        );
    };

    return (
        <DetailSection title={t('metadata')}>
            <div className="glass rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                            {!isClusterScoped && <th className="px-4 py-2 w-1/6 border-r border-border">{t('label_namespace')}</th>}
                            <th className="px-4 py-2 w-32 border-r border-border text-center">{t('label_age')}</th>
                            <th className="px-4 py-2 border-r border-border">{t('label_labels')}</th>
                            <th className="px-4 py-2">{t('label_annotations')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        <tr className="align-top">
                            {!isClusterScoped && (
                                <td className="px-4 py-3 border-r border-border align-middle">
                                    <div className="flex items-center min-h-[3rem]">
                                        {metadata?.namespace ? (
                                            <Link to={`/namespaces/-/${metadata.namespace}`} className="text-accent font-bold hover:underline truncate block w-full">
                                                {metadata.namespace}
                                            </Link>
                                        ) : (
                                            <span className="text-text-muted italic w-full">—</span>
                                        )}
                                    </div>
                                </td>
                            )}
                            <td 
                                className="px-4 py-3 border-r border-border text-center cursor-pointer hover:bg-white/5 transition-colors align-middle"
                                onClick={() => setShowExactDate(!showExactDate)}
                                title={showExactDate ? 'Click to show relative age' : 'Click to show exact date'}
                            >
                                <div className="flex flex-col items-center justify-center min-h-[3rem]">
                                    <span className="text-primary font-bold whitespace-nowrap">
                                        {showExactDate ? formatDate(metadata?.creationTimestamp) : (data?.resource?.age || '—')}
                                    </span>
                                    <span className="text-[9px] text-text-muted uppercase mt-0.5 opacity-50 font-black">
                                        {showExactDate ? 'Exact' : 'Relative'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-4 py-3 border-r border-border">
                                {renderList(sortedLabels, 'labels', showAllLabels, setShowAllLabels)}
                            </td>
                            <td className="px-4 py-3">
                                {renderList(sortedAnnotations, 'annotations', showAllAnnotations, setShowAllAnnotations)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
