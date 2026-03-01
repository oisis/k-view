import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../SettingsContext';

export default function ResourceActionMenu({ kind, namespace, name, onRefresh }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'delete', 'restart', 'scale'
    const [forceDelete, setForceDelete] = useState(false);
    const [scaleValue, setScaleValue] = useState(1);
    const [menuRect, setMenuRect] = useState(null);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const { icons } = useTheme();
    const { t } = useTranslation();

    const nsPath = namespace && namespace !== '-' ? namespace : '';
    const isPod = kind.toLowerCase().includes('pod');
    const isDaemonSet = kind.toLowerCase() === 'daemonsets' || kind.toLowerCase() === 'daemonset';
    const isJob = kind.toLowerCase() === 'jobs' || kind.toLowerCase() === 'job';
    const isReplicaSet = kind.toLowerCase() === 'replicasets' || kind.toLowerCase() === 'replicaset';
    const isStatefulSet = kind.toLowerCase() === 'statefulsets' || kind.toLowerCase() === 'statefulset';
    const isIngress = kind.toLowerCase() === 'ingresses' || kind.toLowerCase() === 'ingress';
    const isService = kind.toLowerCase() === 'services' || kind.toLowerCase() === 'service';
    const isReplicationController = kind.toLowerCase() === 'replicationcontrollers' || kind.toLowerCase() === 'replicationcontroller';
    const isCronJob = kind.toLowerCase() === 'cronjobs' || kind.toLowerCase() === 'cronjob';
    const isClusterRoleBinding = kind.toLowerCase() === 'cluster-role-bindings' || kind.toLowerCase() === 'clusterrolebindings';
    const isClusterRole = kind.toLowerCase() === 'cluster-roles' || kind.toLowerCase() === 'clusterroles';
    const isNamespace = kind.toLowerCase() === 'namespaces' || kind.toLowerCase() === 'namespace';
    const isNetworkPolicy = kind.toLowerCase() === 'network-policies' || kind.toLowerCase() === 'networkpolicy';
    const isRoleBinding = kind.toLowerCase() === 'role-bindings' || kind.toLowerCase() === 'rolebinding';
    const isRole = kind.toLowerCase() === 'roles' || kind.toLowerCase() === 'role';
    const isServiceAccount = kind.toLowerCase() === 'service-accounts' || kind.toLowerCase() === 'serviceaccount' || kind.toLowerCase() === 'serviceaccounts';
    const isWorkload = ['deployments', 'statefulsets', 'daemonsets', 'replicationcontrollers', 'jobs', 'cronjobs', 'deployment', 'statefulset', 'daemonset', 'replicationcontroller', 'job', 'cronjob'].includes(kind.toLowerCase());
    const isScalable = ['deployments', 'statefulsets', 'replicationcontrollers', 'deployment', 'statefulset', 'replicationcontroller'].includes(kind.toLowerCase());

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                // Check if the click is inside any portal root
                const dropdownPortal = document.getElementById('menu-portal-root');
                const modalPortal = document.getElementById('modal-portal-root');
                if (dropdownPortal && dropdownPortal.contains(event.target)) return;
                if (modalPortal && modalPortal.contains(event.target)) return;

                setIsOpen(false);
                setConfirmAction(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMenu = (e) => {
        e.stopPropagation();
        if (!isOpen) {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuRect(rect);
        }
        setIsOpen(!isOpen);
        setConfirmAction(null);
    };

    const handleActionTrigger = (e, action) => {
        e.stopPropagation();
        if (action === 'delete' || action === 'restart' || action === 'scale') {
            setConfirmAction(action);
            if (action === 'scale') setScaleValue(1); // Default scale increment
            return;
        }

        setIsOpen(false);
        switch (action) {
            case 'edit':
                navigate(`/${kind}/${namespace || '-'}/${name}?tab=yaml&edit=true`);
                break;
            case 'describe':
                navigate(`/${kind}/${namespace || '-'}/${name}`);
                break;
            case 'export':
                exportResource();
                break;
            case 'logs':
                navigate(`/${kind}/${namespace || '-'}/${name}?tab=logs`);
                break;
            case 'exec':
                navigate(`/${kind}/${namespace || '-'}/${name}?exec=true`);
                break;
            default:
                break;
        }
    };

    const exportResource = async () => {
        try {
            const url = nsPath
                ? `/api/resources/${kind}/${nsPath}/${name}/yaml`
                : `/api/resources/${kind}/-/${name}/yaml`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch YAML');
            const yaml = await res.text();

            const blob = new Blob([yaml], { type: 'text/yaml' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${name}.yaml`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed: ' + err.message);
        }
    };

    const executeRestart = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            const url = nsPath
                ? `/api/resources/${kind}/${nsPath}/${name}/restart`
                : `/api/resources/${kind}/-/${name}/restart`;
            const res = await fetch(url, { method: 'PUT' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to restart');
            }
            if (onRefresh) onRefresh();
            setIsOpen(false);
        } catch (err) {
            alert('Restart failed: ' + err.message);
        } finally {
            setIsProcessing(false);
            setConfirmAction(null);
        }
    };

    const executeTrigger = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            const url = nsPath
                ? `/api/resources/${kind}/${nsPath}/${name}/trigger`
                : `/api/resources/${kind}/-/${name}/trigger`;
            const res = await fetch(url, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to trigger');
            }
            if (onRefresh) onRefresh();
            setIsOpen(false);
        } catch (err) {
            alert('Trigger failed: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const executeScale = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            const url = nsPath
                ? `/api/resources/${kind}/${nsPath}/${name}/scale`
                : `/api/resources/${kind}/-/${name}/scale`;

            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ replicas: scaleValue })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to scale');
            }
            if (onRefresh) onRefresh();
            setIsOpen(false);
        } catch (err) {
            alert('Scale failed: ' + err.message);
        } finally {
            setIsProcessing(false);
            setConfirmAction(null);
        }
    };

    const executeDelete = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            const url = nsPath
                ? `/api/resources/${kind}/${nsPath}/${name}?force=${forceDelete}`
                : `/api/resources/${kind}/-/${name}?force=${forceDelete}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            if (onRefresh) onRefresh();
            setIsOpen(false);
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            setIsProcessing(false);
            setConfirmAction(null);
        }
    };

    // Portal Menu Component
    return (
        <div className={`relative ${isOpen ? 'z-[110]' : ''}`} ref={menuRef}>
            <button
                onClick={toggleMenu}
                className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-primary hover:bg-sidebar/20'}`}
            >
                {icons.more ? <icons.more size={16} /> : <span>•••</span>}
            </button>

            {/* Action Dropdown Menu */}
            {isOpen && !confirmAction && menuRect && createPortal(
                <div
                    id="menu-portal-root"
                    style={{
                        position: 'fixed',
                        top: `${menuRect.bottom + 8}px`,
                        left: `${Math.max(8, menuRect.right - 224)}px`,
                        zIndex: 9999,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-56 bg-[var(--bg-dropdown)]/80 backdrop-blur-xl glass border border-border rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        {(isPod || isWorkload) && (
                            <button onClick={(e) => handleActionTrigger(e, 'restart')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-black text-accent hover:text-white hover:bg-[var(--accent)] transition-colors uppercase tracking-wider group">
                                {icons.refresh && <icons.refresh size={14} className="group-hover:rotate-180 transition-transform duration-500" />} {t('restart')}
                            </button>
                        )}
                        {isCronJob && (
                            <button onClick={(e) => executeTrigger(e)} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-black text-emerald-400 hover:text-white hover:bg-emerald-500 transition-colors uppercase tracking-wider group">
                                {icons.zap && <icons.zap size={14} className="group-hover:scale-125 transition-transform" />} {t('run_now')}
                            </button>
                        )}
                        <button onClick={(e) => handleActionTrigger(e, 'edit')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-accent hover:text-white hover:bg-[var(--accent)] transition-colors">
                            {icons.edit && <icons.edit size={14} />} {t('edit')}
                        </button>
                        <button onClick={(e) => handleActionTrigger(e, 'delete')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors group">
                            {icons.trash && <icons.trash size={14} />} {t('delete')}
                        </button>

                        {!isIngress && !isService && !isClusterRoleBinding && !isClusterRole && !isNamespace && !isNetworkPolicy && !isRoleBinding && !isRole && !isServiceAccount && (
                            <button onClick={(e) => handleActionTrigger(e, 'describe')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-accent hover:text-white hover:bg-[var(--accent)] transition-colors">
                                {icons.external_link && <icons.external_link size={14} />} {t('view_details')}
                            </button>
                        )}
                        {isScalable && (
                            <button onClick={(e) => handleActionTrigger(e, 'scale')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-accent hover:text-white hover:bg-[var(--accent)] transition-colors">
                                {icons.activity && <icons.activity size={14} />} {t('scale_replicas')}
                            </button>
                        )}
                        {(isPod || isDaemonSet || isJob || isReplicaSet || isStatefulSet || isReplicationController) && (
                            <button onClick={(e) => handleActionTrigger(e, 'logs')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-accent hover:text-white hover:bg-[var(--accent)] transition-colors">
                                {icons.terminal && <icons.terminal size={14} />} {t('view_logs')}
                            </button>
                        )}
                        {isPod && (
                            <button onClick={(e) => handleActionTrigger(e, 'exec')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-accent hover:text-white hover:bg-[var(--accent)] transition-colors">
                                {icons.terminal && <icons.terminal size={14} />} {t('exec_shell')}
                            </button>
                        )}
                        {!isIngress && !isService && !isClusterRoleBinding && !isClusterRole && !isNamespace && !isNetworkPolicy && !isRoleBinding && !isRole && !isServiceAccount && (
                            <button onClick={(e) => handleActionTrigger(e, 'export')} className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-bold text-accent hover:text-white hover:bg-[var(--accent)] transition-colors">
                                {icons.download && <icons.download size={14} />} {t('export_yaml')}
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Confirmation Modal */}
            {isOpen && confirmAction && createPortal(
                <div id="modal-portal-root" className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setConfirmAction(null); setIsOpen(false); }} />
                    <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl glass overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            {confirmAction === 'delete' && (
                                <>
                                    <div className="flex items-center gap-3 text-rose-400 mb-4">
                                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                            {icons.alert_triangle && <icons.alert_triangle size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">{t('confirm_delete')}</h3>
                                            <p className="text-sm text-secondary">{name}</p>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[var(--bg-muted)]/50 border border-border cursor-pointer group transition-colors hover:border-rose-500/30">
                                        <input
                                            type="checkbox"
                                            checked={forceDelete}
                                            onChange={(e) => setForceDelete(e.target.checked)}
                                            className="w-4 h-4 rounded border-border bg-transparent text-rose-500 focus:ring-0"
                                        />
                                        <span className="text-sm font-medium text-secondary group-hover:text-primary transition-colors">
                                            {t('force_delete')}
                                        </span>
                                    </label>

                                    <div className="flex gap-3">
                                        <button onClick={() => { setConfirmAction(null); setForceDelete(false); }} className="flex-1 py-2.5 bg-[var(--bg-muted)] hover:bg-[var(--sidebar-hover)] text-primary text-sm font-bold uppercase rounded-xl transition-all active:scale-95">
                                            {t('cancel')}
                                        </button>
                                        <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
                                            {isProcessing ? '...' : t('delete_now')}
                                        </button>
                                    </div>
                                </>
                            )}

                            {confirmAction === 'restart' && (
                                <>
                                    <div className="flex items-center gap-3 text-accent mb-6">
                                        <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                                            {icons.zap && <icons.zap size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">{t('confirm_restart')}</h3>
                                            <p className="text-sm text-secondary">{name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 bg-[var(--bg-muted)] hover:bg-[var(--sidebar-hover)] text-primary text-sm font-bold uppercase rounded-xl transition-all active:scale-95">
                                            {t('cancel')}
                                        </button>
                                        <button onClick={executeRestart} disabled={isProcessing} className="flex-1 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold uppercase rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                                            {isProcessing ? '...' : t('restart')}
                                        </button>
                                    </div>
                                </>
                            )}

                            {confirmAction === 'scale' && (
                                <>
                                    <div className="flex items-center gap-3 text-cyan-400 mb-6">
                                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                            {icons.activity && <icons.activity size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">{t('set_replicas')}</h3>
                                            <p className="text-sm text-secondary">{name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-6 bg-[var(--bg-muted)]/50 p-4 rounded-2xl border border-border">
                                        <button onClick={() => setScaleValue(Math.max(0, scaleValue - 1))} className="p-2 bg-card rounded-lg hover:text-accent border border-border transition-colors shadow-sm">
                                            {icons.chevron_down && <icons.chevron_down size={20} />}
                                        </button>
                                        <input
                                            type="number"
                                            value={scaleValue}
                                            onChange={(e) => setScaleValue(parseInt(e.target.value) || 0)}
                                            className="flex-1 bg-transparent text-center text-2xl font-black text-primary focus:outline-none"
                                        />
                                        <button onClick={() => setScaleValue(scaleValue + 1)} className="p-2 bg-card rounded-lg hover:text-accent border border-border transition-colors shadow-sm">
                                            {icons.chevron_up && <icons.chevron_up size={20} />}
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 bg-[var(--bg-muted)] hover:bg-[var(--sidebar-hover)] text-primary text-sm font-bold uppercase rounded-xl transition-all active:scale-95">
                                            {t('cancel')}
                                        </button>
                                        <button onClick={executeScale} disabled={isProcessing} className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-bold uppercase rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                                            {isProcessing ? '...' : t('scale_now')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
