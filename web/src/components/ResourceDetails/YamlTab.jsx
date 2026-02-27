import React, { useState, useEffect } from 'react';
import { useTheme } from '../../ThemeContext';
import CodeEditor from './CodeEditor';

export default function YamlTab({ kind, namespace, name, canEdit, t, onRefresh }) {
    const { icons } = useTheme();
    const [format, setFormat] = useState('yaml');
    const [yaml, setYaml] = useState('');
    const [editedYaml, setEditedYaml] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [editorFontSize, setEditorFontSize] = useState(12);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
            const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/yaml?format=${format}`);
            if (res.ok) {
                const data = await res.text();
                setYaml(data);
                setEditedYaml(data);
            }
        } catch (e) {
            console.error('Failed to fetch YAML/JSON:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        const fetchYaml = async () => {
            try {
                const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
                const url = `/api/resources/${kind}${nsPath}/${name}/yaml?format=${format}`;
                const res = await fetch(url, { credentials: 'same-origin' });
                if (res.ok) {
                    const data = await res.text();
                    if (mounted) {
                        setYaml(data);
                        setEditedYaml(data);
                    }
                } else {
                    console.error('API error:', res.status, res.statusText);
                    if (mounted) setYaml(`Error: Failed to load manifest (${res.status})`);
                }
            } catch (e) {
                console.error('Failed to fetch YAML/JSON:', e);
                if (mounted) setYaml('Error: Network failure');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchYaml();
        return () => { mounted = false; };
    }, [kind, namespace, name, format]);

    if (loading) {
        return (
            <div className="bg-glass glass rounded-2xl border border-border flex items-center justify-center p-8 min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <icons.refresh size={32} className="animate-spin text-info" />
                    <p className="text-text-muted font-medium">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-glass glass rounded-2xl border border-border overflow-hidden flex flex-col flex-none">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--text-white)]/5 border-b border-border/20">
                <div className="flex items-center gap-4">
                    <span className="text-xs uppercase font-bold text-text-muted tracking-widest">
                        {isEditing ? t('edit_manifest', { format: format.toUpperCase() }) : `${format.toUpperCase()} ${t('manifest') || 'Manifest'}`}
                    </span>
                    {!isEditing && (
                        <div className="flex bg-black/30 rounded p-0.5">
                            <button
                                onClick={() => setFormat('yaml')}
                                className={`px-2 py-0.5 text-xs font-bold rounded ${format === 'yaml' ? 'bg-info/20 text-info' : 'text-text-muted hover:text-[var(--text-white)]'}`}
                            >
                                YAML
                            </button>
                            <button
                                onClick={() => setFormat('json')}
                                className={`px-2 py-0.5 text-xs font-bold rounded ${format === 'json' ? 'bg-info/20 text-info' : 'text-text-muted hover:text-[var(--text-white)]'}`}
                            >
                                JSON
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                                         <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md mr-2">                        <span className="text-[10px] uppercase font-black text-text-muted pl-2">Size</span>
                        <select
                            value={editorFontSize}
                            onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
                            className="bg-[var(--bg-input)] text-xs font-bold text-[var(--text-input)] outline-none rounded px-2 py-0.5 cursor-pointer border border-border"
                        >
                            {[10, 11, 12, 13, 14, 16].map(size => (
                                <option key={size} value={size}>{size}px</option>
                            ))}
                        </select>
                    </div>
                    {saveError && <span className="text-xs text-error mr-2 animate-pulse">{saveError}</span>}
                    {showSuccess && <span className="text-xs text-success mr-2 flex items-center gap-1"><icons.check_circle_alt size={12} /> {t('resource_updated_successfully') || 'Resource updated successfully'}</span>}
                    {canEdit && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold px-3 py-1 bg-info/10 text-info rounded hover:bg-info/20 transition-colors uppercase tracking-widest"
                        >
                            {t('edit_manifest', { format: format.toUpperCase() })}
                        </button>
                    )}
                    {isEditing && (
                        <>
                            <button
                                onClick={() => { setIsEditing(false); setEditedYaml(yaml); setSaveError(null); }}
                                className="text-xs font-bold px-3 py-1 text-text-muted hover:text-[var(--text-white)] transition-colors uppercase tracking-widest"
                                disabled={isSaving}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    setSaveError(null);
                                    try {
                                        const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
                                        const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/yaml`, {
                                            method: 'PUT',
                                            body: editedYaml
                                        });
                                        if (!res.ok) {
                                            let errorMessage = 'Failed to save';
                                            try {
                                                const errData = await res.json();
                                                errorMessage = errData.error || errorMessage;
                                            } catch (jsonErr) {
                                                const textErr = await res.text();
                                                if (textErr) errorMessage = textErr;
                                            }
                                            throw new Error(errorMessage);
                                        }
                                        setYaml(editedYaml);
                                        setIsEditing(false);
                                        setShowSuccess(true);
                                        setTimeout(() => setShowSuccess(false), 5000);
                                        fetchData();
                                        if (onRefresh) onRefresh();
                                    } catch (e) {
                                        setSaveError(e.message);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                className="text-xs font-bold px-3 py-1 bg-success/20 text-success rounded hover:bg-success/30 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                disabled={isSaving}
                            >
                                {isSaving ? <icons.refresh size={10} className="animate-pulse" /> : <icons.check_circle_alt size={10} />}
                                {isSaving ? t('saving') : t('save_changes')}
                            </button>
                        </>
                    )}
                    {!isEditing && (
                        <button className="text-text-muted hover:text-[var(--text-white)] transition-colors" onClick={() => {
                            navigator.clipboard.writeText(yaml).then(() => {
                                setShowSuccess(true);
                                setTimeout(() => setShowSuccess(false), 2000);
                            });
                        }}>
                            <icons.clipboard size={14} />
                        </button>
                    )}
                </div>
            </div>
            <CodeEditor
                value={isEditing ? editedYaml : yaml}
                onChange={isEditing ? setEditedYaml : null}
                readOnly={!isEditing}
                fontSize={editorFontSize}
            />
        </div>
    );
}
