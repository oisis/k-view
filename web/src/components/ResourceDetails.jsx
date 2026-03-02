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

const KIND_DISPLAY_MAP = {
    'pods': 'Pod',
    'deployments': 'Deployment',
    'statefulsets': 'StatefulSet',
    'daemonsets': 'DaemonSet',
    'jobs': 'Job',
    'cronjobs': 'CronJob',
    'replicasets': 'ReplicaSet',
    'replicationcontrollers': 'ReplicationController',
    'hpas': 'HorizontalPodAutoscaler',
    'services': 'Service',
    'ingresses': 'Ingress',
    'ingress-classes': 'IngressClass',
    'configmaps': 'ConfigMap',
    'secrets': 'Secret',
    'pvcs': 'PersistentVolumeClaim',
    'pvs': 'PersistentVolume',
    'storage-classes': 'StorageClass',
    'cluster-role-bindings': 'ClusterRoleBinding',
    'cluster-roles': 'ClusterRole',
    'crds': 'CustomResourceDefinition',
    'events': 'Event',
    'namespaces': 'Namespace',
    'network-policies': 'NetworkPolicy',
    'nodes': 'Node',
    'role-bindings': 'RoleBinding',
    'roles': 'Role',
    'service-accounts': 'ServiceAccount'
};

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
    const [relatedIngresses, setRelatedIngresses] = useState(null);
    const [relatedCrdObjects, setRelatedCrdObjects] = useState(null);
    const [relatedSecrets, setRelatedSecrets] = useState(null);
    const [relatedImagePullSecrets, setRelatedImagePullSecrets] = useState(null);
    const [relatedPvs, setRelatedPvs] = useState(null);

    const kindLower = kind?.toLowerCase() || '';

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
    };

    const load = async () => {
        setLoading(true);
        setRelatedJobs(null);
        setRelatedPods(null);
        setRelatedServices(null);
        setRelatedIngresses(null);
        setRelatedCrdObjects(null);
        setRelatedSecrets(null);
        setRelatedImagePullSecrets(null);
        setRelatedReplicaSets(null);
        setRelatedHpas(null);
        setRelatedEndpoints(null);
        setRelatedPvs(null);
        setQuotas(null);
        setLimits(null);

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
                    // Fetch list of quotas and limits first
                    const [qListRes, lListRes] = await Promise.all([
                        fetch(`/api/resources/resourcequotas?namespace=${name}`),
                        fetch(`/api/resources/limitranges?namespace=${name}`)
                    ]);

                    if (qListRes?.ok) {
                        const qItems = await qListRes.json();
                        if (Array.isArray(qItems) && qItems.length > 0) {
                            // Fetch full details for each quota to get spec/status
                            const fullQuotas = await Promise.all(qItems.map(async item => {
                                const r = await fetch(`/api/resources/resourcequotas/${name}/${item.name}`);
                                return r.ok ? await r.json() : null;
                            }));
                            setQuotas(fullQuotas.filter(Boolean));
                        }
                    }

                    if (lListRes?.ok) {
                        const lItems = await lListRes.json();
                        if (Array.isArray(lItems) && lItems.length > 0) {
                            // Fetch full details for each limit range
                            const fullLimits = await Promise.all(lItems.map(async item => {
                                const r = await fetch(`/api/resources/limitranges/${name}/${item.name}`);
                                return r.ok ? await r.json() : null;
                            }));
                            setLimits(fullLimits.filter(Boolean));
                        }
                    }
                }

                const nsQuery = namespace === '-' ? '' : namespace;
                if (kindLower.includes('cronjob')) {
                    const jobsRes = await fetch(`/api/resources/jobs?namespace=${nsQuery}`);
                    if (jobsRes?.ok) {
                        const jobsData = await jobsRes.json();
                        if (Array.isArray(jobsData)) {
                            setRelatedJobs(jobsData.filter(j => j.extra?.['owner-uid'] === detailsData?.metadata?.uid));
                        }
                    }
                }

                if (detailsData?.relatedEndpoints) {
                    setRelatedEndpoints(detailsData.relatedEndpoints);
                }

                if (detailsData?.relatedSecrets) {
                    setRelatedSecrets(detailsData.relatedSecrets);
                }

                if (detailsData?.relatedImagePullSecrets) {
                    setRelatedImagePullSecrets(detailsData.relatedImagePullSecrets);
                }
                const needsPods = kindLower.includes('daemonset') || kindLower === 'job' || kindLower === 'jobs' || 
                                 kindLower === 'services' || kindLower === 'service' || kindLower === 'nodes' || kindLower === 'node' || 
                                 kindLower.includes('deployment') || kindLower.includes('statefulset') || kindLower.includes('replicaset') || kindLower.includes('replicationcontroller');

                if (needsPods) {
                    const podsRes = await fetch(`/api/resources/pods?namespace=${nsQuery}`);
                    if (podsRes?.ok) {
                        const podsData = await podsRes.json();
                        if (Array.isArray(podsData)) {
                            const selector = detailsData?.spec?.selector?.matchLabels || detailsData?.spec?.selector || null;
                            const uid = detailsData?.metadata?.uid;

                            const filteredPods = podsData.filter(p => {
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
                            });

                            setRelatedPods(filteredPods);

                            // Fetch metrics for these pods
                            filteredPods.forEach(async (pod) => {
                                try {
                                    const mRes = await fetch(`/api/resources/pods/${pod.namespace}/${pod.name}`);
                                    if (mRes.ok) {
                                        const mData = await mRes.json();
                                        if (mData.status && Array.isArray(mData.status.containerStatuses)) {
                                            // Handle pod details if needed
                                        }
                                    }
                                } catch (e) {}
                            });
                        }
                    }
                }

                if (kindLower.includes('deployment')) {
                    const rsRes = await fetch(`/api/resources/replicasets?namespace=${nsQuery}`);
                    if (rsRes?.ok) {
                        const rsData = await rsRes.json();
                        if (Array.isArray(rsData)) {
                            const uid = detailsData?.metadata?.uid;
                            setRelatedReplicaSets(rsData.filter(rs => {
                                const ownerUid = rs?.extra?.['owner-uid'];
                                if (ownerUid && uid && ownerUid === uid) return true;
                                return (rs.metadata?.ownerReferences || []).some(o => o.uid === uid);
                            }));
                        }
                    }
                }

                if (kindLower.includes('deployment') || kindLower.includes('statefulset')) {
                    const hpaRes = await fetch(`/api/resources/hpas?namespace=${nsQuery}`);
                    if (hpaRes?.ok) {
                        const hpaData = await hpaRes.json();
                        if (Array.isArray(hpaData)) {
                            setRelatedHpas(hpaData.filter(h => {
                                const targetName = h.extra?.['target-name'];
                                const targetKind = h.extra?.['target-kind']?.toLowerCase() || '';
                                return targetName === name && (kindLower.includes(targetKind));
                            }));
                        }
                    }
                }

                if (kindLower === 'crds' || kindLower === 'customresourcedefinitions') {
                    const group = detailsData.extra?.group || detailsData.spec?.group;
                    const plural = detailsData.extra?.plural || detailsData.spec?.names?.plural;
                    const versions = detailsData.spec?.versions || [];
                    const storageVersion = versions.find(v => v.storage)?.name || (versions.length > 0 ? versions[0].name : null);
                    
                    console.log(`CRD Debug: group=${group}, plural=${plural}, version=${storageVersion}`);

                    if (group && plural && storageVersion) {
                        const objUrl = `/api/resources/crds?group=${group}&version=${storageVersion}&plural=${plural}`;
                        console.log(`Fetching CRD objects from: ${objUrl}`);
                        const objRes = await fetch(objUrl);
                        if (objRes?.ok) {
                            const objData = await objRes.json();
                            console.log(`CRD Objects received:`, objData);
                            if (Array.isArray(objData)) {
                                setRelatedCrdObjects(objData);
                            }
                        } else {
                            console.error(`Failed to fetch CRD objects: ${objRes.status}`);
                        }
                    }
                }

                if (kindLower.includes('storageclass') || kindLower.includes('storage-class')) {
                    const pvRes = await fetch(`/api/resources/pvs`);
                    if (pvRes?.ok) {
                        const pvData = await pvRes.json();
                        if (Array.isArray(pvData)) {
                            const filtered = pvData.filter(pv => {
                                const scName = pv.extra?.['storage-class'] || "";
                                return scName === name;
                            });
                            setRelatedPvs(filtered);
                        }
                    }
                }

                if (kindLower.includes('service')) {
                    const ingRes = await fetch(`/api/resources/ingresses?namespace=${nsQuery}`);
                    if (ingRes?.ok) {
                        const ingData = await ingRes.json();
                        if (Array.isArray(ingData)) {
                            setRelatedIngresses(ingData.filter(ing => {
                                const endpoints = ing.extra?.endpoints || "";
                                return endpoints.split(',').some(svcName => svcName.trim() === name);
                            }));
                        }
                    }
                }

                if (kindLower.includes('daemonset') || kindLower.includes('deployment') || kindLower.includes('statefulset') || kindLower.includes('replicaset') || kindLower.includes('replicationcontroller')) {
                    const svcsRes = await fetch(`/api/resources/services?namespace=${nsQuery}`);
                    if (svcsRes?.ok) {
                        const svcsData = await svcsRes.json();
                        if (Array.isArray(svcsData)) {
                            // Find services whose selector matches the labels of the pod template or resource itself
                            const templateLabels = detailsData?.spec?.template?.metadata?.labels || {};
                            const metadataLabels = detailsData?.metadata?.labels || {};
                            const resourceSelector = detailsData?.spec?.selector?.matchLabels || detailsData?.spec?.selector || {};
                            
                            setRelatedServices(svcsData.filter(svc => {
                                const svcSelectorStr = svc.extra?.selector || "";
                                if (!svcSelectorStr) return false;
                                
                                const svcSelector = {};
                                svcSelectorStr.split(',').forEach(pair => {
                                    const parts = pair.trim().split('=');
                                    if (parts.length === 2) {
                                        svcSelector[parts[0].trim()] = parts[1].trim();
                                    }
                                });

                                const selectorKeys = Object.keys(svcSelector);
                                if (selectorKeys.length === 0) return false;

                                // Helper to check if ALL selector keys match given labels
                                const labelsMatch = (targetLabels) => {
                                    if (!targetLabels) return false;
                                    return selectorKeys.every(k => String(targetLabels[k]) === String(svcSelector[k]));
                                };

                                return labelsMatch(templateLabels) || labelsMatch(metadataLabels) || labelsMatch(resourceSelector);
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
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl border border-border text-text-muted hover:text-primary hover:border-accent/50 transition-all active:scale-95"
                    >
                        <icons.chevron_left size={20} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-0.5 text-[var(--text-resource-kind)]">{name}</h2>
                        <p className="text-sm font-bold tracking-[0.2em] transition-colors duration-300 text-[var(--text-resource-kind)] opacity-80 flex flex-wrap gap-x-6">
                            <span>Kind: {KIND_DISPLAY_MAP[kindLower] || data?.extra?.kind || kind}</span>
                            <span className="font-mono text-[var(--text-green)] opacity-100">UID: {data.metadata?.uid || '—'}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                </div>
            </div>

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
                        relatedIngresses={relatedIngresses}
                        relatedCrdObjects={relatedCrdObjects}
                        relatedSecrets={relatedSecrets}
                        relatedImagePullSecrets={relatedImagePullSecrets}
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
                        kind={kind}
                        namespace={namespace} 
                        name={name} 
                        containers={data?.spec?.containers || data?.spec?.template?.spec?.containers || []}
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
