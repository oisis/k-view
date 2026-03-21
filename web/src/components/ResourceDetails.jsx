import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation, useSettings } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import OverviewTab from './ResourceDetails/OverviewTab';
import YamlTab from './ResourceDetails/YamlTab';
import LogsTab from './ResourceDetails/LogsTab';
import EventsTab from './ResourceDetails/EventsTab';
import NetworkTrace from './NetworkTrace';
import TopologyTab from './ResourceDetails/TopologyTab';
import PodTerminal from './PodTerminal';
import ErrorBoundary from './ErrorBoundary';

const TABS = [
    { id: 'overview', label: 'overview' },
    { id: 'yaml', label: 'yaml' },
    { id: 'topology', label: 'topology' },
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
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const isVisible = useRef(true);
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

    const load = async (isInitial = false) => {
        if (!isVisible.current) return;
        if (isInitial) setLoading(true);
        else setIsRefreshing(true);

        const startTime = Date.now();
        try {
            const url = namespace && namespace !== '-' 
                ? `/api/resources/${kind}/${namespace}/${name}` 
                : `/api/resources/${kind}/-/${name}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch resource');
            const detailsData = await res.json();
            
            setData(prev => {
                if (prev && JSON.stringify(prev) === JSON.stringify(detailsData)) return prev;
                return detailsData;
            });

            if (activeTab === 'overview') {
                if (kind === 'Namespaces') {
                    const [qRes, lRes] = await Promise.all([
                        fetch(`/api/resources/ResourceQuotas?namespace=${name}`),
                        fetch(`/api/resources/LimitRanges?namespace=${name}`)
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

                if (kind.includes('CronJob')) {
                    const jRes = await fetch(`/api/resources/Jobs?namespace=${namespace === '-' ? '' : namespace}`);
                    if (jRes.ok) {
                        const jobsData = await jRes.json();
                        const jobs = jobsData.items || [];
                        setRelatedJobs(jobs.filter(j => j.extra?.['owner-uid'] === detailsData.metadata?.uid));
                    }
                }

                if (detailsData.relatedReplicaSets) setRelatedReplicaSets(detailsData.relatedReplicaSets);
                if (detailsData.relatedHpas) setRelatedHpas(detailsData.relatedHpas);
                if (detailsData.relatedPods) setRelatedPods(detailsData.relatedPods);
                if (detailsData.relatedServices) setRelatedServices(detailsData.relatedServices);
                if (detailsData.relatedEndpoints) setRelatedEndpoints(detailsData.relatedEndpoints);
                if (detailsData.relatedIngresses) setRelatedIngresses(detailsData.relatedIngresses);
                if (detailsData.relatedCrdObjects) setRelatedCrdObjects(detailsData.relatedCrdObjects);
                if (detailsData.relatedSecrets) setRelatedSecrets(Array.isArray(detailsData.relatedSecrets) ? detailsData.relatedSecrets : []);
                if (detailsData.relatedImagePullSecrets) setRelatedImagePullSecrets(Array.isArray(detailsData.relatedImagePullSecrets) ? detailsData.relatedImagePullSecrets : []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            const duration = Date.now() - startTime;
            const delay = Math.max(0, 600 - duration);

            setTimeout(() => {
                if (isInitial) setLoading(false);
                else setIsRefreshing(false);
            }, delay);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisible.current = document.visibilityState === 'visible';
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (kind && name) load(true);

        const interval = setInterval(() => {
            if (kind && name && activeTab !== 'exec') load(false);
        }, settings?.refreshInterval || 10000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(interval);
        };
    }, [kind, namespace, name, activeTab, settings.refreshInterval]);

    if (loading && !data) return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
                <icons.refresh size={32} className="text-primary" />
            </motion.div>
            <p className="animate-pulse font-medium">{t('loading')}...</p>
        </div>
    );

    if (error) return (
        <div className="p-8">
            <Card className="border-destructive/30 bg-destructive/5 p-8 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-destructive/20 text-destructive">
                        <icons.alert size={24} />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-destructive uppercase italic">{t('error')}</h3>
                </div>
                <p className="text-muted-foreground font-medium mb-6">{error}</p>
                <Button onClick={() => load(true)} variant="destructive" className="font-bold uppercase tracking-widest px-8">
                    {t('retry')}
                </Button>
            </Card>
        </div>
    );

    if (!data) return null;

    const tabsToDisplay = TABS.filter(t => {
        if (t.id === 'logs' && !['Pods', 'Pod'].includes(kind)) return false;
        if (t.id === 'exec' && !['Pods', 'Pod'].includes(kind)) return false;
        if (t.id === 'trace' && !['Pods', 'Pod', 'Services', 'Service', 'Ingresses', 'Ingress', 'Deployments', 'Deployment', 'DaemonSets', 'DaemonSet', 'StatefulSets', 'StatefulSet'].includes(kind)) return false;
        if (t.id === 'topology' && !['Pods', 'Pod', 'Deployments', 'Deployment', 'StatefulSets', 'StatefulSet', 'DaemonSets', 'DaemonSet', 'ReplicaSets', 'ReplicaSet', 'Services', 'Service', 'PersistentVolumeClaims', 'PersistentVolumeClaim'].includes(kind)) return false;
        return true;
    });

    const handleTrigger = async () => {
        setTriggering(true);
        try {
            const url = `/api/resources/${kind}/${namespace}/${name}/trigger`;
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to trigger job');
            setIsTriggerModalOpen(false);
            load(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setTriggering(false);
        }
    };

    return (
        <div className="p-4 md:pt-4 md:px-8 md:pb-8 w-full max-w-[1600px] mx-auto">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-1"
            >
                <div className="flex items-center gap-6">
                    <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="rounded-2xl h-12 w-12 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95"
                    >
                        <icons.chevron_left size={24} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className="font-black uppercase tracking-widest text-[10px] bg-primary/5 text-primary border-primary/20">
                                {KIND_DISPLAY_MAP[kind] || data?.extra?.kind || kind}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground italic uppercase flex items-center">
                            {name}
                            <AnimatePresence>
                                {isRefreshing && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-3"
                                        title="Auto-refreshing..."
                                    />
                                )}
                            </AnimatePresence>
                        </h1>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1.5 font-bold uppercase tracking-widest opacity-60">
                            UID: <span className="text-primary/70">{data.metadata?.uid || '—'}</span>
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-1 bg-muted/30 border border-border/50 p-1 rounded-xl w-fit mb-4 ml-auto backdrop-blur-sm"
            >
                {tabsToDisplay.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSearchParams({ tab: tab.id })}
                        className={cn(
                            "relative px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === tab.id 
                                ? "text-primary-foreground" 
                                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{t(tab.label)}</span>
                    </button>
                ))}

                {(kind?.toLowerCase().includes('cronjob') || data?.kind?.toLowerCase() === 'cronjob') && (
                    <Button
                        variant="ghost"
                        onClick={() => setIsTriggerModalOpen(true)}
                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 ml-2 border-l border-border/50 pl-6 rounded-none font-black uppercase tracking-widest text-xs"
                    >
                        <icons.zap size={16} className="mr-2" />
                        {t('trigger')}
                    </Button>
                )}
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab !== 'exec' && (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full"
                    >
                        <ErrorBoundary>
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
                                    onRefresh={() => load(false)}
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
                                <NetworkTrace 
                                    kind={kind}
                                    namespace={namespace}
                                    name={name}
                                />
                            )}
                            {activeTab === 'topology' && (
                                <TopologyTab 
                                    kind={kind}
                                    namespace={namespace}
                                    name={name}
                                    t={t}
                                />
                            )}
                        </ErrorBoundary>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Persistent Terminal Session */}
            <div className={cn("w-full", activeTab !== 'exec' && "hidden")}>
                <ErrorBoundary>
                    <PodTerminal 
                        namespace={namespace}
                        pod={name}
                        containers={data?.spec?.containers || []}
                    />
                </ErrorBoundary>
            </div>

            {/* Trigger Confirmation Modal */}
            <AnimatePresence>
                {isTriggerModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setIsTriggerModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 w-full max-w-md"
                        >
                            <Card className="border-border shadow-2xl p-8 bg-card/90 backdrop-blur-xl rounded-[2rem]">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-500 shadow-inner">
                                        <icons.zap size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-foreground uppercase italic tracking-tight">{t('confirm_trigger_title')}</h3>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Manual Action</p>
                                    </div>
                                </div>
                                
                                <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
                                    {t('confirm_trigger_message')}
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsTriggerModalOpen(false)}
                                        className="rounded-2xl h-14 font-black uppercase tracking-widest text-xs border-border/50 hover:bg-foreground/5"
                                    >
                                        {t('no')}
                                    </Button>
                                    <Button
                                        onClick={handleTrigger}
                                        disabled={triggering}
                                        className="rounded-2xl h-14 bg-emerald-500 hover:bg-emerald-600 text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20"
                                    >
                                        {triggering ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            >
                                                <icons.refresh size={20} />
                                            </motion.div>
                                        ) : (
                                            <>
                                                <icons.check size={20} className="mr-2" />
                                                {t('yes')}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
