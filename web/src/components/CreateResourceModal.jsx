import React, { useState, useEffect } from 'react';
import { useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

const TEMPLATES = {
    Pods: {
        name: 'Pods',
        iconKey: 'pod',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: Pod
metadata:
  name: ${name || 'my-pod'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
spec:
  containers:
  - name: main
    image: ${adv.image || 'nginx:latest'}
    ${adv.ports ? `ports:\n    - containerPort: ${adv.ports}` : 'ports:\n    - containerPort: 80'}`
    },
    Deployments: {
        name: 'Deployments',
        iconKey: 'deployment',
        yaml: (ns, name, adv) => `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name || 'my-deployment'}
  namespace: ${ns || 'default'}
  labels:
    app: ${name || 'my-app'}
spec:
  replicas: ${adv.replicas || 3}
  selector:
    matchLabels:
      app: ${name || 'my-app'}
  template:
    metadata:
      labels:
        app: ${name || 'my-app'}
    spec:
      containers:
      - name: main
        image: ${adv.image || 'nginx:latest'}
        ports:
        - containerPort: ${adv.ports || 80}`
    },
    Services: {
        name: 'Services',
        iconKey: 'service',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: Service
metadata:
  name: ${name || 'my-service'}
  namespace: ${ns || 'default'}
spec:
  selector:
    app: ${name || 'my-app'}
  ports:
  - protocol: TCP
    port: ${adv.ports || 80}
    targetPort: ${adv.ports || 80}`
    },
    ConfigMaps: {
        name: 'ConfigMaps',
        iconKey: 'configmap',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name || 'my-config'}
  namespace: ${ns || 'default'}
data:
  example.key: example.value`
    },
    Secrets: {
        name: 'Secrets',
        iconKey: 'secret',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: Secret
metadata:
  name: ${name || 'my-secret'}
  namespace: ${ns || 'default'}
type: Opaque
stringData:
  username: admin
  password: changeit`
    }
};

export default function CreateResourceModal({ isOpen, onClose, onCreated, initialKind, namespaces }) {
    const { t } = useTranslation();
    const { icons } = useTheme();
    const [mode, setMode] = useState('template');
    const [selectedKind, setSelectedKind] = useState(initialKind || 'Pods');
    const [name, setName] = useState('');
    const [namespace, setNamespace] = useState(namespaces?.[0] || 'default');
    const [image, setImage] = useState('nginx:latest');
    const [replicas, setReplicas] = useState(3);
    const [labels, setLabels] = useState('');
    const [ports, setPorts] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [rawContent, setRawContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (mode === 'template' && TEMPLATES[selectedKind]) {
            setRawContent(TEMPLATES[selectedKind].yaml(namespace, name, { image, replicas, labels, ports }));
        }
    }, [selectedKind, name, namespace, image, replicas, labels, ports, mode]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const kindToCreate = mode === 'template' ? selectedKind : extractKind(rawContent);
            const nsToCreate = mode === 'template' ? namespace : extractNamespace(rawContent) || 'default';

            const res = await fetch(`/api/resources/${kindToCreate}/${nsToCreate}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/yaml' },
                body: rawContent
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create resource');
            }

            onCreated?.();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const extractKind = (yaml) => {
        const match = yaml.match(/kind:\s*(\w+)/i);
        if (!match) return 'Pods';
        const k = match[1];
        if (k.endsWith('s')) return k;
        return k + 's';
    };

    const extractNamespace = (yaml) => {
        const match = yaml.match(/namespace:\s*([\w-]+)/i);
        return match ? match[1] : null;
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border-2 border-border/50 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 backdrop-blur-xl">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
                            <icons.plus size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic">{t('add_resource')}</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Declarative K8s Engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all active:scale-90">
                        <icons.close size={24} />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="flex p-2 bg-muted/30 border-b border-border/50 gap-2">
                    <button
                        onClick={() => setMode('template')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            mode === 'template' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted'
                        )}
                    >
                        <icons.layout size={14} /> {t('template')}
                    </button>
                    <button
                        onClick={() => setMode('raw')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            mode === 'raw' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted'
                        )}
                    >
                        <icons.manifest size={14} /> {t('raw_manifest')}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {error && (
                        <div className="mb-8 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <icons.alert className="text-destructive shrink-0" size={20} />
                            <p className="text-sm text-destructive font-bold">{error}</p>
                        </div>
                    )}

                    {mode === 'template' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('resource_kind')}</label>
                                    <select
                                        value={selectedKind}
                                        onChange={(e) => setSelectedKind(e.target.value)}
                                        className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer shadow-sm"
                                    >
                                        {Object.keys(TEMPLATES).map(k => (
                                            <option key={k} value={k} className="bg-card">{t(k) || k}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('label_name')}</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="my-cool-resource"
                                            className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-all font-medium shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('label_namespace')}</label>
                                        <select
                                            value={namespace}
                                            onChange={(e) => setNamespace(e.target.value)}
                                            className="w-full bg-muted/50 border-2 border-border/50 rounded-2xl px-5 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer font-bold shadow-sm"
                                        >
                                            {namespaces?.map(ns => (
                                                <option key={ns} value={ns} className="bg-card">{ns}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
                                >
                                    <icons.chevron_right size={16} className={cn("transition-transform duration-300", showAdvanced && "rotate-90")} />
                                    Advanced Tuning
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-6 overflow-hidden pt-2"
                                        >
                                            {(selectedKind === 'Pods' || selectedKind === 'Deployments') && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Container Image</label>
                                                    <input
                                                        type="text"
                                                        value={image}
                                                        onChange={(e) => setImage(e.target.value)}
                                                        className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs text-foreground font-mono"
                                                    />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Port</label>
                                                    <input
                                                        type="number"
                                                        value={ports}
                                                        onChange={(e) => setPorts(e.target.value)}
                                                        placeholder="80"
                                                        className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs text-foreground font-mono"
                                                    />
                                                </div>
                                                {selectedKind === 'Deployments' && (
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Replicas</label>
                                                        <input
                                                            type="number"
                                                            value={replicas}
                                                            onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
                                                            className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-xs text-foreground font-mono"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Preview Area */}
                            <div className="flex flex-col h-full min-h-[400px] bg-muted/20 border-2 border-border/50 rounded-3xl overflow-hidden shadow-inner">
                                <div className="px-5 py-3 bg-muted/40 border-b border-border/50 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Manifest Preview</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-destructive/30"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-warning/30"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-success/30"></div>
                                    </div>
                                </div>
                                <pre className="p-6 text-xs font-mono text-primary/80 overflow-auto flex-1 custom-scrollbar leading-relaxed">
                                    {rawContent}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">K8s Resource YAML</label>
                            <textarea
                                value={rawContent}
                                onChange={(e) => setRawContent(e.target.value)}
                                className="flex-1 min-h-[400px] w-full bg-muted/20 border-2 border-border/50 rounded-3xl p-8 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner custom-scrollbar"
                                placeholder={"apiVersion: v1\nkind: Pod\nmetadata:\n  name: ..."}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-muted/30 border-t border-border/50 flex items-center justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isSubmitting || (mode === 'template' && !name) || !rawContent}
                        className={cn(
                            "px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95",
                            isSubmitting || (mode === 'template' && !name) || !rawContent
                                ? "bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                                : "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90"
                        )}
                    >
                        {isSubmitting ? t('saving') : t('create')}
                    </button>
                </div>
            </div>
        </div>
    );
}
