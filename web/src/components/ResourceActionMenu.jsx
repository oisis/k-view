import React, { useState, useRef, useEffect } from 'react';
import {
    MoreVertical, Edit3, Trash2, Download, ExternalLink,
    FileText, Terminal, Activity, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResourceActionMenu({ kind, namespace, name, onRefresh }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const nsPath = namespace && namespace !== '-' ? namespace : '';

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
                setConfirmDelete(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAction = (e, action) => {
        e.stopPropagation();
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
            case 'delete':
                setConfirmDelete(true);
                setIsOpen(true); // Keep open for confirmation
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

    const handleDelete = async (e) => {
        e.stopPropagation();
        setIsDeleting(true);
        try {
            const url = nsPath
                ? `/api/resources/${kind}/${nsPath}/${name}`
                : `/api/resources/${kind}/-/${name}`;
            const res = await fetch(url, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            if (onRefresh) onRefresh();
            setIsOpen(false);
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Delete failed: ' + err.message);
        } finally {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

    const isPod = kind.toLowerCase().includes('pod');

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-white)] hover:bg-[var(--sidebar-hover)]'}`}
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-glass-deep)] glass border border-[var(--border-color)] rounded-xl shadow-2xl z-[100] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {!confirmDelete ? (
                        <>
                            <button onClick={(e) => handleAction(e, 'describe')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                <ExternalLink size={14} /> View Details
                            </button>
                            <button onClick={(e) => handleAction(e, 'edit')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                <Edit3 size={14} /> Edit YAML
                            </button>
                            {isPod && (
                                <>
                                    <button onClick={(e) => handleAction(e, 'logs')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                        <FileText size={14} /> View Logs
                                    </button>
                                    <button onClick={(e) => handleAction(e, 'exec')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                        <Terminal size={14} /> Exec Shell
                                    </button>
                                </>
                            )}
                            <button onClick={(e) => handleAction(e, 'export')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-white)] hover:bg-[var(--accent)]/10 transition-colors">
                                <Download size={14} /> Export YAML
                            </button>
                            <div className="h-px bg-[var(--border-color)] my-1" />
                            <button onClick={(e) => handleAction(e, 'delete')} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors">
                                <Trash2 size={14} /> Delete
                            </button>
                        </>
                    ) : (
                        <div className="p-3">
                            <div className="flex items-center gap-2 text-rose-400 mb-3 px-1">
                                <AlertTriangle size={16} />
                                <span className="text-[10px] font-black uppercase tracking-wider">Confirm Delete?</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg shadow-rose-900/20 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isDeleting ? '...' : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); setIsOpen(false); }}
                                    className="flex-1 py-2 bg-[var(--bg-muted)] hover:bg-[var(--sidebar-hover)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
