import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, useSettings } from '../SettingsContext';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';

import PodTerminal from './PodTerminal';
import NetworkTrace from './NetworkTrace';

import OverviewTab from './ResourceDetails/OverviewTab';
import YamlTab from './ResourceDetails/YamlTab';
import EventsTab from './ResourceDetails/EventsTab';
import LogsTab from './ResourceDetails/LogsTab';

export default function ResourceDetails({ user }) {
    const { settings } = useSettings();
    const { kind, namespace, name } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { icons } = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTabParams = searchParams.get('tab') || 'overview';

    const [activeTab, setActiveTabState] = useState(activeTabParams);

    const setActiveTab = (tabId) => {
        setActiveTabState(tabId);
        const newParams = new URLSearchParams(searchParams);
        if (tabId === 'overview') {
            newParams.delete('tab');
        } else {
            newParams.set('tab', tabId);
        }
        setSearchParams(newParams, { replace: true });
    };

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [quotas, setQuotas] = useState([]);
    const [limits, setLimits] = useState([]);
    const [relatedJobs, setRelatedJobs] = useState([]);
    const [relatedPods, setRelatedPods] = useState([]);
    const [relatedServices, setRelatedServices] = useState([]);
    const [relatedReplicaSets, setRelatedReplicaSets] = useState([]);
    const [relatedHpas, setRelatedHpas] = useState([]);
    const [relatedEndpoints, setRelatedEndpoints] = useState([]);
    const [relatedPvs, setRelatedPvs] = useState([]);

    const [confirmTrigger, setConfirmTrigger] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);

    const canEdit = user && (user.role === 'kview-cluster-admin' || user.role === 'admin' || user.role === 'edit');
    const kindLower = kind?.toLowerCase() || '';

    const executeTrigger = async () => {
        setIsTriggering(true);
        try {
            const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
            const url = `/api/resources/${kind}${nsPath}/${name}/trigger`;
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to trigger resource');
            }
            setConfirmTrigger(false);
            window.location.reload();
        } catch (err) {
            alert('Trigger failed: ' + err.message);
        } finally {
            setIsTriggering(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
                const detailsRes = await fetch(`/api/resources/${kind}${nsPath}/${name}`);

                if (!detailsRes.ok) throw new Error('Failed to fetch resource details');

                const detailsData = await detailsRes.json();
                setData(detailsData);

                // Extract quotas/limits if provided in details (e.g. from GetDetails mock)
                if (detailsData.quotas) setQuotas(detailsData.quotas);
                if (detailsData.limits) setLimits(detailsData.limits);

                if (kind === 'namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        quotas.length === 0 ? fetch(`/api/resources/resourcequotas?namespace=${name}`) : Promise.resolve(null),
                        limits.length === 0 ? fetch(`/api/resources/limitranges?namespace=${name}`) : Promise.resolve(null)
                    ]);
                    if (qRes && qRes.ok) {
                        const qData = await qRes.json();
                        if (qData && qData.length > 0) setQuotas(qData);
                    }
                    if (lRes && lRes.ok) {
                        const lData = await lRes.json();
                        if (lData && lData.length > 0) setLimits(lData);
                    }
                }

                const nsQuery = namespace === '-' ? '' : namespace;
                if (kindLower.includes('cronjob')) {
                    const jobsRes = await fetch(`/api/resources/jobs?namespace=${nsQuery}`);
                    if (jobsRes && jobsRes.ok) {
                        const jobsData = await jobsRes.json();
                        if (Array.isArray(jobsData)) {
                            setRelatedJobs(jobsData.filter(j => j.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        }
                    }
                }

                // Related Pods and Services matching logic
                if (kindLower.includes('daemonset') || kindLower === 'job' || kindLower === 'jobs' || kindLower.includes('service') || kindLower === 'nodes' || kindLower === 'node' || kindLower.includes('deployment') || kindLower.includes('statefulset') || kindLower.includes('replicaset')) {
                    const [podsRes, svcsRes] = await Promise.all([
                        fetch(`/api/resources/pods?namespace=${nsQuery}`),
                        kindLower.includes('daemonset') ? fetch(`/api/resources/services?namespace=${nsQuery}`) : Promise.resolve(null)
                    ]);
                    
                    if (podsRes && podsRes.ok) {
                        const podsData = await podsRes.json();
                        if (Array.isArray(podsData)) {
                            const selector = detailsData?.spec?.selector?.matchLabels || detailsData?.spec?.selector || null;
                            const uid = detailsData?.metadata?.uid;

                            setRelatedPods(podsData.filter(p => {
                                if (!p) return false;
                                
                                // Node matching
                                if (kindLower === 'nodes' || kindLower === 'node') return p?.extra?.node === name;

                                // Selector matching (Deployments, Services, etc.)
                                if (selector && Object.keys(selector).length > 0) {
                                    const labels = p.labels || p.extra?.labels || {};
                                    if (typeof labels === 'object') {
                                        return Object.entries(selector).every(([k, v]) => labels[k] === String(v));
                                    }
                                }

                                // Owner UID matching (fallback)
                                const ownerUid = p?.extra?.['owner-uid'];
                                if (ownerUid && uid && ownerUid === uid) return true;

                                // ownerReferences check
                                return (p.metadata?.ownerReferences || []).some(o => o.uid === uid);
                            }));

                            if (kindLower.includes('service')) {
                                setRelatedEndpoints(detailsData?.metadata?.endpoints || []);
                            }
                        }
                    }
                    if (svcsRes && svcsRes.ok) {
                        const svcsData = await svcsRes.json();
                        setRelatedServices(Array.isArray(svcsData) ? svcsData : []);
                    }
                }

                if (kindLower.includes('deploy')) {
                    const [rsRes, hpaRes] = await Promise.all([
                        fetch(`/api/resources/replicasets?namespace=${nsQuery}`),
                        fetch(`/api/resources/hpas?namespace=${nsQuery}`)
                    ]);
                    if (rsRes && rsRes.ok) {
                        const rsData = await rsRes.json();
                        if (Array.isArray(rsData)) {
                            setRelatedReplicaSets(rsData.filter(rs => rs.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        }
                    }
                    if (hpaRes && hpaRes.ok) {
                        const hpaData = await hpaRes.json();
                        if (Array.isArray(hpaData)) {
                            setRelatedHpas(hpaData.filter(hpa => hpa.extra?.['target-name'] === name || hpa.name === name));
                        }
                    }
                }

                if (kindLower.includes('storage') && kindLower.includes('class')) {
                    const pvsRes = await fetch(`/api/resources/persistentvolumes`);
                    if (pvsRes && pvsRes.ok) {
                        const pvsData = await pvsRes.json();
                        if (Array.isArray(pvsData)) {
                            setRelatedPvs(pvsData.filter(pv => pv.spec?.storageClassName === name || pv.extra?.['storage-class'] === name));
                        }
                    }
                }
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [kind, namespace, name]);

    useEffect(() => {
        if (!loading && data) {
            if (searchParams.get('exec') === 'true' && kind.toLowerCase().startsWith('pod')) {
                setActiveTab('exec');
            }
            if (searchParams.get('trace') === 'true') {
                setActiveTab('trace');
            }
        }
    }, [loading, data, searchParams, kind]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <icons.refresh size={32} className="animate-spin text-info" />
                <p className="text-[var(--text-muted)] font-medium">{t('loading')}</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-400">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <icons.alert size={20} /> {t('error') || 'Error'}
                </h3>
                <p className="text-sm opacity-90">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-xs font-black transition-all"
                >
                    {t('retry') || 'Retry'}
                </button>
            </div>
        </div>
    );

    if (!data || !data.metadata) return (
        <div className="p-8 text-center text-[var(--text-muted)] italic">
            {t('resource_not_found') || 'Resource not found.'}
        </div>
    );

    const { metadata } = data;
    const isCronJob = kindLower.includes('cronjob');
    const isPod = kindLower.includes('pod');

    const containers = isPod
        ? (data.status?.containerStatuses || data.spec?.containers || [])
        : (data.spec?.template?.spec?.containers || data.spec?.template?.containers || data.spec?.jobTemplate?.spec?.template?.spec?.containers || []);

    return (
        <div className="p-6 max-w-7xl mx-auto w-full flex flex-col min-h-full">
            <div className="flex items-center gap-6 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]/50 transition-all shadow-sm active:scale-95"
                >
                    <icons.chevron_left size={22} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-[0.2em] leading-none">
                            {t(kindLower.replace(/s$/, '')) || (kindLower.replace(/s$/, ''))}
                        </span>
                        <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
                            {name}
                        </h2>
                    </div>
                    <p className="text-[var(--text-white)] light:text-blue-600 text-xs mt-2 font-mono flex items-center gap-2">
                        UID: {metadata.uid}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2 bg-[var(--bg-sidebar)]/80 p-1 rounded-2xl border border-[var(--accent)] mx-auto backdrop-blur-md shadow-lg shadow-indigo-500/10">
                {[
                    { id: 'overview', label: t('overview'), icon: icons.about },
                    { id: 'events', label: t('events'), icon: icons.list },
                    { id: 'yaml', label: t('yaml'), icon: icons.manifest },
                    { id: 'logs', label: t('logs'), icon: icons.terminal, hidden: !['pod', 'pods', 'job', 'jobs', 'deployment', 'deployments', 'daemonset', 'daemonsets', 'replicaset', 'replicasets', 'statefulset', 'statefulsets', 'replicationcontroller', 'replicationcontrollers', 'cronjob', 'cronjobs'].includes(kindLower) },
                    { id: 'exec', label: t('terminal'), icon: icons.terminal, hidden: !['pod', 'pods'].includes(kindLower) },
                    { id: 'trace', label: t('trace'), icon: icons.activity, hidden: !['ingress', 'ingresses', 'services', 'pods'].includes(kindLower) }
                ].filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xl
                            ${activeTab === tab.id
                                ? 'text-[var(--text-white)] bg-[var(--accent)] shadow-lg shadow-indigo-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]/20'}`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
                {isCronJob && canEdit && (
                    <button
                        onClick={() => setConfirmTrigger(true)}
                        className="flex items-center gap-2.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xl text-emerald-400 hover:text-[var(--text-white)] hover:bg-emerald-500/30"
                    >
                        <icons.zap size={14} />
                        {t('trigger')}
                    </button>
                )}
            </div>

            {confirmTrigger && createPortal(
                <div id="modal-portal-root" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmTrigger(false)} />
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl glass overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-emerald-400 mb-6">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <icons.zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('confirm_trigger')}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{name}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setConfirmTrigger(false)} className="flex-1 py-2.5 bg-[var(--bg-muted)] hover:bg-[var(--sidebar-hover)] text-[var(--text-primary)] text-sm font-bold uppercase rounded-xl transition-all active:scale-95">
                                    {t('cancel')}
                                </button>
                                <button onClick={executeTrigger} disabled={isTriggering} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold uppercase rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                    {isTriggering ? '...' : t('trigger_now')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="space-y-2 flex-1 flex flex-col pb-8">
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
                {activeTab === 'events' && (
                    <EventsTab kind={kind} namespace={namespace} name={name} t={t} />
                )}
                {activeTab === 'yaml' && (
                    <YamlTab kind={kind} namespace={namespace} name={name} canEdit={canEdit} t={t} onRefresh={() => window.location.reload()} />
                )}
                {activeTab === 'logs' && (
                    <LogsTab kind={kind} namespace={namespace} name={name} containers={containers} t={t} />
                )}
                {activeTab === 'exec' && (
                    <PodTerminal
                        pod={name}
                        namespace={namespace && namespace !== '-' ? namespace : ''}
                        containers={kindLower.includes('pod') ? (data.spec?.containers || []) : (data.spec?.template?.spec?.containers || [])}
                    />
                )}
                {activeTab === 'trace' && (
                    <NetworkTrace
                        kind={kindLower === 'ingresses' ? 'ingress' : kindLower === 'services' ? 'service' : kindLower === 'pods' ? 'pod' : kind}
                        namespace={namespace && namespace !== '-' ? namespace : ''}
                        name={name}
                    />
                )}
            </div>
        </div>
    );
}
