import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { useResourceDetails } from '../hooks/useResourceData';
import { getResourceComponent } from './ResourceDetails/Registry';

import YamlTab from './ResourceDetails/YamlTab';
import LogsTab from './ResourceDetails/LogsTab';
import EventsTab from './ResourceDetails/EventsTab';

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

/**
 * Smart Component for Resource Details.
 * Handles data fetching and routing to specific/generic dumb components.
 */
export default function ResourceDetails() {
    const { kind, namespace, name } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { icons } = useTheme();
    const navigate = useNavigate();

    const { data, loading, error, refresh } = useResourceDetails(kind, namespace, name);

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
                <button onClick={refresh} className="mt-4 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-700 transition-colors">
                    {t('retry')}
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    const kindLower = kind?.toLowerCase() || '';
    const tabsToDisplay = TABS.filter(tab => {
        if (tab.id === 'logs' && !['pods', 'pod'].includes(kindLower)) return false;
        return true;
    });

    // Dynamic Overview Component from Registry
    const OverviewComponent = getResourceComponent(kind);

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
                            <span>Kind: {KIND_DISPLAY_MAP[kindLower] || data.extra?.kind || kind}</span>
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
                    <OverviewComponent 
                        data={data} 
                        t={t}
                        settings={settings}
                        refresh={refresh}
                    />
                )}
                {activeTab === 'yaml' && (
                    <YamlTab 
                        kind={kind} 
                        namespace={namespace} 
                        name={name} 
                        canEdit={true}
                        t={t}
                        onRefresh={refresh}
                    />
                )}
                {activeTab === 'logs' && (
                    <LogsTab 
                        kind={kindLower}
                        namespace={namespace} 
                        name={name} 
                        containers={data.spec?.containers || []}
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
