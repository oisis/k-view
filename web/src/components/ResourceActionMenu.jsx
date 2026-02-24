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
    const isWorkload = ['deployments', 'statefulsets', 'daemonsets', 'replicationcontrollers', 'jobs', 'cronjobs', 'deployment', 'statefulset', 'daemonset', 'replicationcontroller', 'job', 'cronjob'].includes(kind.toLowerCase());
    const isScalable = ['deployments', 'statefulsets', 'replicationcontrollers', 'deployment', 'statefulset', 'replicationcontroller'].includes(kind.toLowerCase());

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                // If portal is used, we need to check if click was on the portal content too
                const portal = document.getElementById('menu-portal-root');
                if (portal && portal.contains(event.target)) return;

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
    const PortalMenu = () => {
        if (!isOpen || !menuRect) return null;

        const style = {
            position: 'fixed',
            top: `${menuRect.bottom + window.scrollY + 8}px`,
            left: `${menuRect.right - 224 + window.scrollX}px`, // 224px is w-56
            zIndex: 9999,
        };

        return createPortal(
            <div id="menu-portal-root" style={style} onClick={(e) => e.stopPropagation()}>
                <div className="w-56 bg-[var(--bg-dropdown)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {!confirmAction ? (
                        <>
                            {(isPod || isWorkload) && (
                                <button onClick={(e) => handleActionTrigger(e, 'restart')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-[var(--accent)] hover:text-white hover:bg-[var(--accent)] transition-colors uppercase tracking-widest group border-b border-[var(--border-color)]/30 mb-1 pb-2">
                                    <icons.refresh size={14} className="group-hover:rotate-180 transition-transform duration-500" /> {t('restart') || 'Restart'}
                                </button>
                            )}
                            <button onClick={(e) => handleActionTrigger(e, 'edit')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-colors">
                                <icons.edit size={14} /> {t('edit') || 'Edit YAML'}
                            </button>
                            <button onClick={(e) => handleActionTrigger(e, 'delete')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors border-b border-[var(--border-color)]/30 mb-1 pb-2">
                                <icons.trash size={14} /> {t('delete') || 'Delete'}
                            </button>

                            <button onClick={(e) => handleActionTrigger(e, 'describe')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-colors">
                                <icons.external_link size={14} /> View Details
                            </button>
                            {isScalable && (
                                <button onClick={(e) => handleActionTrigger(e, 'scale')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-colors">
                                    <icons.activity size={14} /> Scale Replicas
                                </button>
                            )}
                            {isPod && (
                                <>
                                    <button onClick={(e) => handleActionTrigger(e, 'logs')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-colors">
                                        <icons.manifest size={14} /> View Logs
                                    </button>
                                    <button onClick={(e) => handleActionTrigger(e, 'exec')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-colors">
                                        <icons.terminal size={14} /> Exec Shell
                                    </button>
                                </>
                            )}
                            <button onClick={(e) => handleActionTrigger(e, 'export')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/10 transition-colors">
                                <icons.download size={14} /> Export YAML
                            </button>
                        </>
                    ) : (
                        <div className="p-4">
                            {confirmAction === 'delete' && (
                                <>
                                    <div className="flex items-center gap-2 text-rose-400 mb-2 px-1">
                                        <icons.alert_triangle size={16} />
                                        <span className="text-xs font-black uppercase tracking-wider">Confirm Delete?</span>
                                    </div>
                                    <label className="flex items-center gap-2 mb-4 px-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={forceDelete}
                                            onChange={(e) => setForceDelete(e.target.checked)}
                                            className="w-3 h-3 rounded border-[var(--border-color)] bg-transparent text-rose-500 focus:ring-0"
                                        />
                                        <span className="text-xs font-bold text-[var(--text-muted)] group-hover:text-rose-300 transition-colors">Force (Grace Period 0)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                                            {isProcessing ? 'Deleting...' : 'Delete Now'}
                                        </button>
                                        <button onClick={() => { setConfirmAction(null); setForceDelete(false); }} className="flex-1 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-bold uppercase rounded-lg active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </>
                            )}

                            {confirmAction === 'restart' && (
                                <>
                                    <div className="flex items-center gap-2 text-[var(--accent)] mb-4 px-1">
                                        <icons.zap size={16} />
                                        <span className="text-xs font-black uppercase tracking-wider">Confirm Restart?</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={executeRestart} disabled={isProcessing} className="flex-1 py-2 bg-[var(--accent)] hover:bg-[#7d86f5] text-white text-xs font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                                            {isProcessing ? 'Restarting...' : 'Restart'}
                                        </button>
                                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-bold uppercase rounded-lg active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </>
                            )}

                            {confirmAction === 'scale' && (
                                <>
                                    <div className="flex items-center gap-2 text-cyan-400 mb-4 px-1">
                                        <icons.activity size={16} />
                                        <span className="text-xs font-black uppercase tracking-wider">Set Replicas</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 bg-[var(--bg-muted)]/50 p-2 rounded-lg border border-[var(--border-color)]">
                                        <button onClick={() => setScaleValue(Math.max(0, scaleValue - 1))} className="p-1 hover:text-[var(--accent)] transition-colors"><icons.chevron_down size={14} /></button>
                                        <input
                                            type="number"
                                            value={scaleValue}
                                            onChange={(e) => setScaleValue(parseInt(e.target.value) || 0)}
                                            className="w-full bg-transparent text-center text-sm font-bold text-[var(--text-white)] focus:outline-none"
                                        />
                                        <button onClick={() => setScaleValue(scaleValue + 1)} className="p-1 hover:text-[var(--accent)] transition-colors"><icons.chevron_up size={14} /></button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={executeScale} disabled={isProcessing} className="flex-1 py-2 bg-[#4ed8ff] hover:bg-[#72e1ff] text-black text-xs font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                                            {isProcessing ? 'Scaling...' : 'Scale Now'}
                                        </button>
                                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] text-xs font-bold uppercase rounded-lg active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={`relative ${isOpen ? 'z-[110]' : ''}`} ref={menuRef}>
            <button
                onClick={toggleMenu}
                className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]'}`}
            >
                <icons.more size={16} />
            </button>

            <PortalMenu />
        </div>
    );
}
