import React, { useState, useEffect } from 'react';
import { useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { ChevronRight } from 'lucide-react';

const TEMPLATES = {
    pods: {
        name: 'pod', // use translation key
        iconKey: 'pod',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: Pod
metadata:
  name: ${name || 'my-pod'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
spec:
  containers:
  - name: main
    image: ${adv.image || 'nginx:latest'}
    ${adv.ports ? `ports:\n    - containerPort: ${adv.ports}` : 'ports:\n    - containerPort: 80'}`
    },
    deployments: {
        name: 'deployment',
        iconKey: 'deployment',
        yaml: (ns, name, adv) => `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name || 'my-deployment'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : 'labels:\n    app: ' + (name || 'my-app')}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
spec:
  replicas: ${adv.replicas || 3}
  selector:
    matchLabels:
      app: ${name || 'my-app'}
  template:
    metadata:
      labels:
        app: ${name || 'my-app'}
        ${adv.labels ? adv.labels.replace(/\n/g, '\n        ') : ''}
    spec:
      containers:
      - name: main
        image: ${adv.image || 'nginx:latest'}
        ${adv.ports ? `ports:\n        - containerPort: ${adv.ports}` : 'ports:\n        - containerPort: 80'}`
    },
    services: {
        name: 'service',
        iconKey: 'service',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: Service
metadata:
  name: ${name || 'my-service'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
spec:
  selector:
    app: ${name || 'my-app'}
  ports:
  - protocol: TCP
    port: ${adv.ports || 80}
    targetPort: ${adv.ports || 80}`
    },
    configmaps: {
        name: 'configmap',
        iconKey: 'configmap',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name || 'my-config'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
data:
  example.key: example.value`
    },
    secrets: {
        name: 'secret',
        iconKey: 'secret',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: Secret
metadata:
  name: ${name || 'my-secret'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
type: Opaque
stringData:
  username: admin
  password: changeit`
    },
    ingresses: {
        name: 'ingress',
        iconKey: 'ingress',
        yaml: (ns, name, adv) => `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name || 'my-ingress'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
spec:
  rules:
  - host: ${name || 'app'}.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${name || 'my-service'}
            port:
              number: ${adv.ports || 80}`
    },
    pvs: {
        name: 'pv',
        iconKey: 'pv',
        isClusterScoped: true,
        yaml: (ns, name, adv) => `apiVersion: v1
kind: PersistentVolume
metadata:
  name: ${name || 'my-pv'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /mnt/data`
    },
    pvcs: {
        name: 'pvc',
        iconKey: 'pvc',
        yaml: (ns, name, adv) => `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ${name || 'my-pvc'}
  namespace: ${ns || 'default'}
  ${adv.labels ? `labels:\n    ${adv.labels.replace(/\n/g, '\n    ')}` : ''}
  ${adv.annotations ? `annotations:\n    ${adv.annotations.replace(/\n/g, '\n    ')}` : ''}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi`
    }
};

export default function CreateResourceModal({ isOpen, onClose, onCreated, initialKind, namespaces }) {
    const { t } = useTranslation();
    const { icons } = useTheme();
    const [mode, setMode] = useState('template'); // 'template' or 'raw'
    const [selectedKind, setSelectedKind] = useState(initialKind || 'pods');
    const [name, setName] = useState('');
    const [namespace, setNamespace] = useState(namespaces?.[0] || 'default');
    const [image, setImage] = useState('nginx:latest');
    const [replicas, setReplicas] = useState(3);
    const [labels, setLabels] = useState('');
    const [annotations, setAnnotations] = useState('');
    const [ports, setPorts] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [rawContent, setRawContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initialize raw content when switching to raw mode or changing template params
    useEffect(() => {
        if (mode === 'template' && TEMPLATES[selectedKind]) {
            setRawContent(TEMPLATES[selectedKind].yaml(namespace, name, { image, replicas, labels, annotations, ports }));
        }
    }, [selectedKind, name, namespace, image, replicas, labels, annotations, ports, mode]);

    if (!isOpen) return null;

    const handleCreate = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const kindToCreate = mode === 'template' ? selectedKind : extractKind(rawContent);
            const nsToCreate = mode === 'template' ? namespace : extractNamespace(rawContent) || '-';

            const url = nsToCreate && nsToCreate !== '-'
                ? `/api/resources/${kindToCreate}/${nsToCreate}`
                : `/api/resources/${kindToCreate}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/yaml' },
                body: rawContent
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create resource');
            }

            onCreated();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const extractKind = (yaml) => {
        const match = yaml.match(/kind:\s*(\w+)/i);
        return match ? match[1].toLowerCase() + 's' : initialKind;
    };

    const extractNamespace = (yaml) => {
        const match = yaml.match(/namespace:\s*([\w-]+)/i);
        return match ? match[1] : null;
    };

    const StatusIcon = icons.alert_circle || icons.alert;
    const ZapIcon = icons.zap;
    const LayoutIcon = icons.layout;
    const FileIcon = icons.manifest || icons.file_code;
    const CloseIcon = icons.close;
    const ChevronRightIcon = icons.chevron_right;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[var(--bg-glass-deep)] border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 backdrop-saturate-150">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent)] text-primary-foreground rounded-lg">
                            <ZapIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{t('create_resource')}</h2>
                            <p className="text-xs text-text-muted mt-0.5 uppercase tracking-wider font-bold">Standard API v1.25+</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-foreground hover:bg-[var(--sidebar-hover)] rounded-lg transition-colors">
                        <CloseIcon size={20} />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="flex p-1 bg-sidebar/50 border-b border-border">
                    <button
                        onClick={() => setMode('template')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${mode === 'template' ? 'bg-accent text-primary-foreground shadow-lg' : 'text-text-muted hover:text-foreground'}`}
                    >
                        <LayoutIcon size={14} /> {t('template')}
                    </button>
                    <button
                        onClick={() => setMode('raw')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${mode === 'raw' ? 'bg-accent text-primary-foreground shadow-lg' : 'text-text-muted hover:text-foreground'}`}
                    >
                        <FileIcon size={14} /> {t('raw_manifest')}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-[var(--text-error)]/10 border border-[var(--text-error)]/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <StatusIcon className="text-[var(--text-error)] shrink-0" size={18} />
                            <p className="text-sm text-[var(--text-error)] font-bold">{error}</p>
                        </div>
                    )}

                    {mode === 'template' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-3 block">{t('resource_kind')}</label>
                                    <div className="relative">
                                        <select
                                            value={selectedKind}
                                            onChange={(e) => setSelectedKind(e.target.value)}
                                            className="w-full bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-sm text-[var(--text-input)] focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer font-bold shadow-lg"
                                        >
                                            {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                                                <option key={key} value={key} className="bg-card text-foreground">
                                                    {t(tmpl.name)}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                                            {icons[TEMPLATES[selectedKind]?.iconKey] ? React.createElement(icons[TEMPLATES[selectedKind].iconKey], { size: 16 }) : <ZapIcon size={16} />}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">{t('label_name')}</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. my-app"
                                            className="w-full bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                        />
                                    </div>
                                    {!TEMPLATES[selectedKind]?.isClusterScoped && (
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">{t('label_namespace')}</label>
                                            <select
                                                value={namespace}
                                                onChange={(e) => setNamespace(e.target.value)}
                                                className="w-full bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-sm text-[var(--text-input)] focus:outline-none focus:border-[var(--accent)] transition-all appearance-none"
                                            >
                                                {namespaces?.map(ns => (
                                                    <option key={ns} value={ns} className="bg-card text-foreground">{ns}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-foreground text-xs font-black uppercase tracking-wider hover:text-accent transition-colors"
                                >
                                    <ChevronRightIcon size={16} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                                    Advanced Options
                                </button>

                                {showAdvanced && (
                                    <div className="space-y-4 p-4 bg-[var(--bg-sidebar)]/20 rounded-xl border border-border animate-in slide-in-from-top-2">
                                        {(selectedKind === 'pods' || selectedKind === 'deployments') && (
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Container Image</label>
                                                <input
                                                    type="text"
                                                    value={image}
                                                    onChange={(e) => setImage(e.target.value)}
                                                    className="w-full bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                                />
                                            </div>
                                        )}
                                        {selectedKind === 'deployments' && (
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Replicas</label>
                                                <input
                                                    type="number"
                                                    value={replicas}
                                                    onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
                                                    className="w-full bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                                />
                                            </div>
                                        )}
                                        {(selectedKind === 'pods' || selectedKind === 'deployments' || selectedKind === 'services' || selectedKind === 'ingresses') && (
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Port</label>
                                                <input
                                                    type="number"
                                                    value={ports}
                                                    onChange={(e) => setPorts(e.target.value)}
                                                    placeholder="80"
                                                    className="w-full bg-[var(--bg-input)] border border-border rounded-xl px-4 py-3 text-sm text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
                                                />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Labels (key: value)</label>
                                                <textarea
                                                    value={labels}
                                                    onChange={(e) => setLabels(e.target.value)}
                                                    className="w-full h-24 bg-[var(--bg-input)] border border-border rounded-xl px-3 py-2 text-xs text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                                                    placeholder="env: prod"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-2 block">Annotations (key: value)</label>
                                                <textarea
                                                    value={annotations}
                                                    onChange={(e) => setAnnotations(e.target.value)}
                                                    className="w-full h-24 bg-[var(--bg-input)] border border-border rounded-xl px-3 py-2 text-xs text-[var(--text-input)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                                                    placeholder="managed-by: k-view"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setMode('raw')}
                                    className="flex items-center gap-2 text-accent text-xs font-bold hover:underline group"
                                >
                                    {t('switch_to_yaml')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>

                            <div className="flex flex-col h-full bg-[var(--bg-sidebar)]/30 border border-border rounded-2xl overflow-hidden">
                                <div className="px-4 py-2 bg-[var(--bg-sidebar)]/50 border-b border-border flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-text-muted">Preview</span>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-rose-500/50"></div>
                                        <div className="w-2 h-2 rounded-full bg-amber-500/50"></div>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                                    </div>
                                </div>
                                <pre className="p-4 text-xs font-mono text-[var(--text-editor-code)] overflow-auto flex-1 opacity-90">
                                    {rawContent}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <label className="text-xs font-black uppercase tracking-wider text-text-muted mb-3 block">Resource Manifest (YAML/JSON)</label>
                            <textarea
                                value={rawContent}
                                onChange={(e) => setRawContent(e.target.value)}
                                className="flex-1 min-h-[300px] w-full bg-[var(--bg-input)] border border-border rounded-2xl p-6 text-sm font-mono text-[var(--text-input)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none shadow-inner"
                                placeholder={"apiVersion: v1\nkind: Pod\n..."}
                            />
                            <p className="text-xs text-text-muted mt-3 italic">Paste your Kubernetes resource definition here. Supports Multi-resource YAML (WIP).</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-[var(--bg-sidebar)]/30 border-t border-border flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-xs font-black uppercase tracking-wider text-text-muted hover:text-foreground transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isSubmitting || (mode === 'template' && !name) || !rawContent}
                        className={`px-8 py-2.5 bg-[var(--accent)] text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? t('saving') : t('create')}
                    </button>
                </div>
            </div>
        </div>
    );
}
