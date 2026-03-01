import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, useSettings } from '../SettingsContext';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';

import OverviewTab from './ResourceDetails/OverviewTab';
import YamlTab from './ResourceDetails/YamlTab';
import LogsTab from './ResourceDetails/LogsTab';
import EventsTab from './ResourceDetails/EventsTab';
import ResourceActionMenu from './ResourceActionMenu';

const TABS = [
    { id: 'overview', label: 'overview' },
    { id: 'yaml', label: 'yaml' },
    { id: 'logs', label: 'logs' },
    { id: 'events', label: 'recent_events' },
];

export default function ResourceDetails() {
    const { kind, namespace, name } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const isEditing = searchParams.get('edit') === 'true';
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { icons } = useTheme();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotas, setQuotas] = useState(null);
    const [limits, setLimits] = useState(null);
    const [relatedJobs, setRelatedJobs] = useState(null);
    const [relatedPods, setRelatedPods] = useState(null);
    const [relatedServices, setRelatedServices] = useState(null);
    const [relatedReplicaSets, setRelatedReplicaSets] = useState(null);
    const [relatedHpas, setRelatedHpas] = useState(null);
    const [relatedEndpoints, setRelatedEndpoints] = useState(null);
    const [relatedPvs, setRelatedPvs] = useState(null);

    const kindLower = kind?.toLowerCase() || '';

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    };

    const load = async () => {
        setLoading(true);
        try {
            const url = namespace && namespace !== '-' 
                ? `/api/resources/${kind}/${namespace}/${name}` 
                : `/api/resources/${kind}/-/${name}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error(t('error_loading_resource'));
            const detailsData = await res.json();
            setData(detailsData);

            if (activeTab === 'overview') {
                if (kindLower === 'namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        fetch(`/api/resources/resourcequotas/${name}`),
                        fetch(`/api/resources/limitranges/${name}`)
                    ]);
                    if (qRes?.ok) {
                        const qData = await qRes.json();
                        if (qData?.length > 0) setQuotas(qData);
                    }
                    if (lRes?.ok) {
                        const lData = await lRes.json();
                        if (lData?.length > 0) setLimits(lData);
                    }
                }

                const nsQuery = namespace === '-' ? '' : namespace;
                if (kindLower.includes('cronjob')) {
                    const jobsRes = await fetch(`/api/resources/jobs?namespace=${nsQuery}`);
                    if (jobsRes?.ok) {
                        const jobsData = await jobsRes.json();
                        if (Array.isArray(jobsData)) {
                            setRelatedJobs(jobsData.filter(j => j.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        }
                    }
                }

                if (detailsData.relatedEndpoints) {
                    setRelatedEndpoints(detailsData.relatedEndpoints);
                }

                // Protect against missing spec/selector
                const needsPods = kindLower.includes('daemonset') || kindLower === 'job' || kindLower === 'jobs' || 
                                 kindLower === 'services' || kindLower === 'service' || kindLower === 'nodes' || kindLower === 'node' || 
                                 kindLower.includes('deployment') || kindLower.includes('statefulset') || kindLower.includes('replicaset');

                if (needsPods) {
                    const podsRes = await fetch(`/api/resources/pods?namespace=${nsQuery}`);
                    if (podsRes?.ok) {
                        const podsData = await podsRes.json();
                        if (Array.isArray(podsData)) {
                            const selector = detailsData?.spec?.selector?.matchLabels || detailsData?.spec?.selector || null;
                            const uid = detailsData?.metadata?.uid;

                            setRelatedPods(podsData.filter(p => {
                                if (!p) return false;
                                if (kindLower === 'nodes' || kindLower === 'node') return p?.extra?.node === name;
                                if (selector && Object.keys(selector).length > 0) {
                                    const rawLabelsStr = p.extra?.labels || "";
                                    const podLabels = {};
                                    rawLabelsStr.split(',').forEach(pair => {
                                        const [k, v] = pair.trim().split('=');
                                        if (k) podLabels[k] = v;
                                    });
                                    return Object.entries(selector).every(([k, v]) => podLabels[k] === String(v));
                                }
                                const ownerUid = p?.extra?.['owner-uid'];
                                if (ownerUid && uid && ownerUid === uid) return true;
                                return (p.metadata?.ownerReferences || []).some(o => o.uid === uid);
                            }));
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (kind && name) {
            load();
        }
    }, [kind, namespace, name, activeTab]);

    if (loading && !data) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-900/30 border border-red-800 text-red-400 p-6 rounded-2xl glass">
                <h3 className="text-xl font-bold mb-2">{t('error')}</h3>
                <p>{error}</p>
                <button onClick={load} className="mt-4 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors">
                    {t('retry')}
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    const tabsToDisplay = TABS.filter(t => {
        if (t.id === 'logs' && !['pods', 'pod'].includes(kindLower)) return false;
        return true;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl border border-border text-text-muted hover:text-primary hover:border-accent/50 transition-all active:scale-95"
                    >
                        <icons.chevron_left size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] font-black text-accent uppercase tracking-widest">
                                {kindLower === 'pods' ? 'pod' : kind}
                            </span>
                            <h2 className="text-2xl font-bold text-primary">{name}</h2>
                        </div>
                        <p className="text-sm text-text-muted flex items-center gap-2">
                            {namespace && namespace !== '-' && (
                                <>
                                    <icons.namespace size={14} className="text-accent/60" />
                                    <span className="font-bold text-secondary">{namespace}</span>
                                    <span className="opacity-30">•</span>
                                </>
                            )}
                            <span>{t('label_created')} {formatDate(data.metadata?.creationTimestamp)}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <ResourceActionMenu 
                        kind={kind} 
                        namespace={namespace} 
                        name={name} 
                        onRefresh={load} 
                    />
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 bg-glass border border-border p-1 rounded-xl w-fit mb-8 shadow-inner">
                {tabsToDisplay.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200
                            ${activeTab === tab.id 
                                ? 'bg-accent text-white shadow-lg shadow-indigo-500/20 scale-105' 
                                : 'text-text-muted hover:text-primary hover:bg-sidebar/20'}`}
                    >
                        {t(tab.label)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'overview' && (
                    <OverviewTab 
                        data={data} 
                        kind={kind} 
                        namespace={namespace} 
                        name={name}
                        quotas={quotas}
                        limits={limits}
                        relatedJobs={relatedJobs}
                        relatedPods={relatedPods}
                        relatedServices={relatedServices}
                        relatedReplicaSets={relatedReplicaSets}
                        relatedHpas={relatedHpas}
                        relatedEndpoints={relatedEndpoints}
                        relatedPvs={relatedPvs}
                        t={t}
                        settings={settings}
                    />
                )}
                {activeTab === 'yaml' && (
                    <YamlTab 
                        kind={kind} 
                        namespace={namespace} 
                        name={name} 
                        canEdit={true}
                        t={t}
                        onRefresh={load}
                    />
                )}
                {activeTab === 'logs' && (
                    <LogsTab 
                        namespace={namespace} 
                        pod={name} 
                        t={t} 
                    />
                )}
                {activeTab === 'events' && (
                    <EventsTab 
                        kind={kindLower === 'pods' ? 'pod' : kind}
                        namespace={namespace && namespace !== '-' ? namespace : ''}
                        name={name}
                        t={t}
                    />
                )}
            </div>
        </div>
    );
}
