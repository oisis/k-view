import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, useSettings } from '../SettingsContext';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';

import OverviewTab from './ResourceDetails/OverviewTab';
import YamlTab from './ResourceDetails/YamlTab';
import LogsTab from './ResourceDetails/LogsTab';
import EventsTab from './ResourceDetails/EventsTab';
import ErrorBoundary from './ErrorBoundary';

const TABS = [
    { id: 'overview', label: 'overview' },
    { id: 'yaml', label: 'yaml' },
    { id: 'logs', label: 'logs' },
    { id: 'events', label: 'events' },
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

/**
 * ResourceDetails - RESTORED FROZEN VIEW FROM MAIN
 * Cleanly rewritten to consume DTO structure.
 */
export default function ResourceDetails() {
    const { kind, namespace, name } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { icons } = useTheme();
    const navigate = useNavigate();

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
    const [relatedEndpoints, setRelatedEndpoints] = useState(null);
    const [relatedIngresses, setRelatedIngresses] = useState([]);
    const [relatedCrdObjects, setRelatedCrdObjects] = useState([]);
    const [relatedSecrets, setRelatedSecrets] = useState([]);
    const [relatedImagePullSecrets, setRelatedImagePullSecrets] = useState([]);
    const [relatedPvs, setRelatedPvs] = useState([]);

    const kindLower = (kind || '').toLowerCase();

    const load = async () => {
        setLoading(true);
        try {
            const url = namespace && namespace !== '-' 
                ? `/api/resources/${kind}/${namespace}/${name}` 
                : `/api/resources/${kind}/-/${name}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch resource');
            const detailsData = await res.json();
            setData(detailsData);

            if (activeTab === 'overview') {
                if (kindLower === 'namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        fetch(`/api/resources/resourcequotas?namespace=${name}`),
                        fetch(`/api/resources/limitranges?namespace=${name}`)
                    ]);
                    if (qRes.ok) {
                        const q = await qRes.json();
                        setQuotas(Array.isArray(q) ? q : []);
                    }
                    if (lRes.ok) {
                        const l = await lRes.json();
                        setLimits(Array.isArray(l) ? l : []);
                    }
                }

                if (kindLower.includes('cronjob')) {
                    const jRes = await fetch(`/api/resources/jobs?namespace=${namespace === '-' ? '' : namespace}`);
                    if (jRes.ok) {
                        const jobs = await jRes.json();
                        if (Array.isArray(jobs)) {
                            setRelatedJobs(jobs.filter(j => j.extra?.['owner-uid'] === detailsData.metadata?.uid));
                        } else {
                            setRelatedJobs([]);
                        }
                    }
                }

                if (detailsData.relatedEndpoints) setRelatedEndpoints(detailsData.relatedEndpoints);
                if (detailsData.relatedSecrets) setRelatedSecrets(Array.isArray(detailsData.relatedSecrets) ? detailsData.relatedSecrets : []);
                if (detailsData.relatedImagePullSecrets) setRelatedImagePullSecrets(Array.isArray(detailsData.relatedImagePullSecrets) ? detailsData.relatedImagePullSecrets : []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (kind && name) load();
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
                    <ErrorBoundary>
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
                    </ErrorBoundary>
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
                        kind={kindLower}
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
