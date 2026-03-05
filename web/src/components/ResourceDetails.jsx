import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';

import OverviewTab from './ResourceDetails/OverviewTab';
import YamlTab from './ResourceDetails/YamlTab';
import LogsTab from './ResourceDetails/LogsTab';
import EventsTab from './ResourceDetails/EventsTab';
import NetworkTrace from './NetworkTrace';
import PodTerminal from './PodTerminal';
import ErrorBoundary from './ErrorBoundary';

const TABS = [
    { id: 'overview', label: 'overview' },
    { id: 'yaml', label: 'yaml' },
    { id: 'logs', label: 'logs' },
    { id: 'events', label: 'events' },
    { id: 'exec', label: 'exec' },
    { id: 'trace', label: 'trace' },
];

const KIND_DISPLAY_MAP = {
    'Pods': 'Pod',
    'Deployments': 'Deployment',
    'Services': 'Service',
    'Ingresses': 'Ingress',
    'ConfigMaps': 'ConfigMap',
    'Secrets': 'Secret',
    'Namespaces': 'Namespace',
    'Nodes': 'Node',
    'Events': 'Event',
    'PersistentVolumeClaims': 'PersistentVolumeClaim',
    'PersistentVolumes': 'PersistentVolume',
    'StorageClasses': 'StorageClass',
    'HorizontalPodAutoscalers': 'HorizontalPodAutoscaler',
    'CustomResourceDefinitions': 'CustomResourceDefinition',
    'Roles': 'Role',
    'RoleBindings': 'RoleBinding',
    'ClusterRoles': 'ClusterRole',
    'ClusterRoleBindings': 'ClusterRoleBinding',
    'ServiceAccounts': 'ServiceAccount'
};

/**
 * ResourceDetails - Unified View for all K8s resources.
 * Consumes aggregated DTO from backend.
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
    const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
    const [triggering, setTriggering] = useState(false);

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
                if (kind === 'Namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        fetch(`/api/resources/ResourceQuotas?namespace=${name}`),
                        fetch(`/api/resources/LimitRanges?namespace=${name}`)
                    ]);
                    if (qRes.ok) {
                        const q = await qRes.json();
                        setQuotas(Array.isArray(q.items) ? q.items : []);
                    }
                    if (lRes.ok) {
                        const l = await lRes.json();
                        setLimits(Array.isArray(l.items) ? l.items : []);
                    }
                }

                if (kind.includes('CronJob')) {
                    const jRes = await fetch(`/api/resources/Jobs?namespace=${namespace === '-' ? '' : namespace}`);
                    if (jRes.ok) {
                        const jobsData = await jRes.json();
                        const jobs = jobsData.items || [];
                        setRelatedJobs(jobs.filter(j => j.extra?.['owner-uid'] === detailsData.metadata?.uid));
                    }
                }

                // Related resources aggregated by backend DTO
                if (detailsData.relatedReplicaSets) setRelatedReplicaSets(detailsData.relatedReplicaSets);
                if (detailsData.relatedHpas) setRelatedHpas(detailsData.relatedHpas);
                if (detailsData.relatedPods) setRelatedPods(detailsData.relatedPods);
                if (detailsData.relatedServices) setRelatedServices(detailsData.relatedServices);
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
        if (t.id === 'logs' && !['Pods', 'Pod'].includes(kind)) return false;
        if (t.id === 'exec' && !['Pods', 'Pod'].includes(kind)) return false;
        if (t.id === 'trace' && !['Pods', 'Pod', 'Services', 'Service', 'Ingresses', 'Ingress', 'Deployments', 'Deployment', 'DaemonSets', 'DaemonSet', 'StatefulSets', 'StatefulSet'].includes(kind)) return false;
        return true;
    });

    const handleTrigger = async () => {
        setTriggering(true);
        try {
            const url = `/api/resources/${kind}/${namespace}/${name}/trigger`;
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to trigger job');
            setIsTriggerModalOpen(false);
            // Optional: refresh data or show success toast
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setTriggering(false);
        }
    };

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
                            <span>Kind: {KIND_DISPLAY_MAP[kind] || data?.extra?.kind || kind}</span>
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

                {/* Manual Trigger Action for CronJobs */}
                {(kind?.toLowerCase().includes('cronjob') || data?.kind?.toLowerCase() === 'cronjob') && (
                    <button
                        onClick={() => setIsTriggerModalOpen(true)}
                        className="px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 text-success hover:bg-success/10 flex items-center gap-2 border-l border-border/50 ml-1 pl-4"
                    >
                        <icons.zap size={14} />
                        {t('trigger')}
                    </button>
                )}
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
                        kind={kind}
                        namespace={namespace} 
                        name={name} 
                        containers={data?.spec?.containers || data?.spec?.template?.spec?.containers || []}
                        t={t} 
                    />
                )}
                {activeTab === 'events' && (
                    <EventsTab 
                        kind={kind === 'Pods' ? 'Pod' : kind}
                        namespace={namespace && namespace !== '-' ? namespace : ''}
                        name={name}
                        t={t}
                    />
                )}
                {activeTab === 'trace' && (
                    <ErrorBoundary>
                        <NetworkTrace 
                            kind={kind}
                            namespace={namespace}
                            name={name}
                        />
                    </ErrorBoundary>
                )}
                {activeTab === 'exec' && (
                    <ErrorBoundary>
                        <PodTerminal 
                            namespace={namespace}
                            pod={name}
                            containers={data?.spec?.containers || []}
                        />
                    </ErrorBoundary>
                )}
            </div>

            {/* Trigger Confirmation Modal */}
            {isTriggerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" style={{ backgroundColor: 'rgb(var(--color-bg-card))' }}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-2xl bg-success/20 text-success">
                                <icons.zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-primary">{t('confirm_trigger_title')}</h3>
                        </div>
                        
                        <p className="text-secondary mb-8 leading-relaxed">
                            {t('confirm_trigger_message')}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsTriggerModalOpen(false)}
                                className="flex-1 px-6 py-3 rounded-xl border border-border text-primary font-bold hover:bg-sidebar/20 transition-all active:scale-95"
                            >
                                {t('no')}
                            </button>
                            <button
                                onClick={handleTrigger}
                                disabled={triggering}
                                className="flex-1 px-6 py-3 rounded-xl bg-success text-white font-bold hover:bg-success/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {triggering ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                ) : (
                                    <>
                                        <icons.check size={18} />
                                        {t('yes')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
