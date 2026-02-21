import React, { useState, useRef, useEffect } from 'react';
import {
    MoreVertical, Edit3, Trash2, Download, ExternalLink,
    FileText, Terminal, Activity, AlertTriangle, RefreshCw,
    ChevronUp, ChevronDown, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResourceActionMenu({ kind, namespace, name, onRefresh }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'delete', 'restart', 'scale'
    const [forceDelete, setForceDelete] = useState(false);
    const [scaleValue, setScaleValue] = useState(1);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const nsPath = namespace && namespace !== '-' ? namespace : '';
    const isPod = kind.toLowerCase().includes('pod');
    const isWorkload = ['deployments', 'statefulsets', 'daemonsets', 'deployment', 'statefulset', 'daemonset'].includes(kind.toLowerCase());
    const isScalable = ['deployments', 'statefulsets', 'deployment', 'statefulset'].includes(kind.toLowerCase());

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
                setConfirmAction(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            // Note: In a real app we might want to fetch current replicas first, 
            // but for simplicity we'll just send the relative change or an absolute value.
            // Let's assume the scaleValue is a target for now, or we'd need more complex UI.
            // For now, let's just send the value.
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

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setConfirmAction(null); }}
                className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-white)] hover:bg-[var(--sidebar-hover)]'}`}
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-glass-deep)] glass border border-[var(--border-color)] rounded-xl shadow-2xl z-[100] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {!confirmAction ? (
                        <>
                            {(isPod || isWorkload) && (
                                <button onClick={(e) => handleActionTrigger(e, 'restart')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-black text-[var(--accent)] hover:text-[var(--text-white)] hover:bg-[var(--accent)] transition-colors uppercase tracking-widest group">
                                    <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Restart
                                </button>
                            )}
                            <button onClick={(e) => handleActionTrigger(e, 'describe')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                <ExternalLink size={14} /> View Details
                            </button>
                            <button onClick={(e) => handleActionTrigger(e, 'edit')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                <Edit3 size={14} /> Edit YAML
                            </button>
                            {isScalable && (
                                <button onClick={(e) => handleActionTrigger(e, 'scale')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                    <Activity size={14} /> Scale Replicas
                                </button>
                            )}
                            {isPod && (
                                <>
                                    <button onClick={(e) => handleActionTrigger(e, 'logs')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                        <FileText size={14} /> View Logs
                                    </button>
                                    <button onClick={(e) => handleActionTrigger(e, 'exec')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                        <Terminal size={14} /> Exec Shell
                                    </button>
                                </>
                            )}
                            <button onClick={(e) => handleActionTrigger(e, 'export')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                <Download size={14} /> Export YAML
                            </button>
                            <div className="h-px bg-[var(--border-color)] my-1" />
                            <button onClick={(e) => handleActionTrigger(e, 'delete')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors">
                                <Trash2 size={14} /> Delete
                            </button>
                        </>
                    ) : (
                        <div className="p-4">
                            {confirmAction === 'delete' && (
                                <>
                                    <div className="flex items-center gap-2 text-rose-400 mb-2 px-1">
                                        <AlertTriangle size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Confirm Delete?</span>
                                    </div>
                                    <label className="flex items-center gap-2 mb-4 px-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={forceDelete}
                                            onChange={(e) => setForceDelete(e.target.checked)}
                                            className="w-3 h-3 rounded border-[var(--border-color)] bg-transparent text-rose-500 focus:ring-0"
                                        />
                                        <span className="text-[9px] font-bold text-[var(--text-muted)] group-hover:text-rose-300 transition-colors">Force (Grace Period 0)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={executeDelete} disabled={isProcessing} className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                                            {isProcessing ? '...' : 'Delete'}
                                        </button>
                                        <button onClick={() => { setConfirmAction(null); setForceDelete(false); }} className="flex-1 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </>
                            )}

                            {confirmAction === 'restart' && (
                                <>
                                    <div className="flex items-center gap-2 text-[var(--accent)] mb-4 px-1">
                                        <Zap size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Confirm Restart?</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={executeRestart} disabled={isProcessing} className="flex-1 py-2 bg-[var(--accent)] hover:bg-[#7d86f5] text-white text-[10px] font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                                            {isProcessing ? '...' : 'Restart'}
                                        </button>
                                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </>
                            )}

                            {confirmAction === 'scale' && (
                                <>
                                    <div className="flex items-center gap-2 text-cyan-400 mb-4 px-1">
                                        <Activity size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-wider">Set Replicas</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 bg-[var(--bg-muted)]/50 p-2 rounded-lg border border-[var(--border-color)]">
                                        <button onClick={() => setScaleValue(Math.max(0, scaleValue - 1))} className="p-1 hover:text-[var(--accent)] transition-colors"><ChevronDown size={14} /></button>
                                        <input
                                            type="number"
                                            value={scaleValue}
                                            onChange={(e) => setScaleValue(parseInt(e.target.value) || 0)}
                                            className="w-full bg-transparent text-center text-sm font-bold text-[var(--text-white)] focus:outline-none"
                                        />
                                        <button onClick={() => setScaleValue(scaleValue + 1)} className="p-1 hover:text-[var(--accent)] transition-colors"><ChevronUp size={14} /></button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={executeScale} disabled={isProcessing} className="flex-1 py-2 bg-[#4ed8ff] hover:bg-[#72e1ff] text-black text-[10px] font-bold uppercase rounded-lg shadow-lg active:scale-95 transition-all">
                                            {isProcessing ? '...' : 'Scale'}
                                        </button>
                                        <button onClick={() => setConfirmAction(null)} className="flex-1 py-2 bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all">Cancel</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
