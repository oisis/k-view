import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../ThemeContext';
import CodeEditor from './CodeEditor';
import yamlParser from 'js-yaml';
import { cn } from "@/lib/utils";
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function YamlTab({ kind, namespace, name, canEdit, t, onRefresh }) {
    const { icons } = useTheme();
    const [format, setFormat] = useState('yaml');
    const [yaml, setYaml] = useState('');
    const [editedYaml, setEditedYaml] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [editorFontSize, setEditorFontSize] = useState(13);
    const [loading, setLoading] = useState(true);
    const [showManagedFields, setShowManagedFields] = useState(false);
    const [showDiff, setShowDiff] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
            const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/yaml?format=${format}`);
            if (res.ok) {
                let data = await res.text();
                if (format === 'json') {
                    try {
                        const parsed = JSON.parse(data);
                        data = JSON.stringify(parsed, null, 2);
                    } catch (e) { /* fallback to raw */ }
                }
                setYaml(data);
                setEditedYaml(data);
            }
        } catch (e) {
            console.error('Failed to fetch YAML/JSON:', e);
        } finally {
            setLoading(false);
        }
    };

    const displayContent = useMemo(() => {
        if (showManagedFields || isEditing) return isEditing ? editedYaml : yaml;
        
        try {
            const obj = format === 'yaml' ? yamlParser.load(yaml) : JSON.parse(yaml);
            if (obj && obj.metadata && obj.metadata.managedFields) {
                const cleanObj = { ...obj, metadata: { ...obj.metadata } };
                delete cleanObj.metadata.managedFields;
                return format === 'yaml' 
                    ? yamlParser.dump(cleanObj, { indent: 2, noRefs: true }) 
                    : JSON.stringify(cleanObj, null, 2);
            }
            return yaml;
        } catch (e) {
            return yaml;
        }
    }, [yaml, editedYaml, isEditing, showManagedFields, format]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        const fetchYaml = async () => {
            try {
                const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
                const url = `/api/resources/${kind}${nsPath}/${name}/yaml?format=${format}`;
                const res = await fetch(url, { credentials: 'same-origin' });
                if (res.ok) {
                    let data = await res.text();
                    if (format === 'json') {
                        try {
                            const parsed = JSON.parse(data);
                            data = JSON.stringify(parsed, null, 2);
                        } catch (e) { /* fallback to raw */ }
                    }
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

    const diffStyles = {
        variables: {
            dark: {
                diffViewerBackground: 'transparent',
                diffViewerColor: 'var(--foreground)',
                addedBackground: 'rgba(16, 185, 129, 0.15)',
                addedColor: '#10b981',
                removedBackground: 'rgba(239, 68, 68, 0.15)',
                removedColor: '#ef4444',
                wordAddedBackground: 'rgba(16, 185, 129, 0.3)',
                wordRemovedBackground: 'rgba(239, 68, 68, 0.3)',
                addedGutterBackground: 'rgba(16, 185, 129, 0.1)',
                removedGutterBackground: 'rgba(239, 68, 68, 0.1)',
                gutterBackground: 'transparent',
                gutterColor: 'var(--muted-foreground)',
                emptyLineBackground: 'transparent',
                codeFoldGutterBackground: 'transparent',
                codeFoldBackground: 'rgba(255, 255, 255, 0.05)',
                codeFoldContentColor: 'var(--muted-foreground)',
            },
            light: {
                diffViewerBackground: 'transparent',
                diffViewerColor: '#1e293b',
                addedBackground: 'rgba(16, 185, 129, 0.1)',
                addedColor: '#059669',
                removedBackground: 'rgba(239, 68, 68, 0.1)',
                removedColor: '#dc2626',
                gutterColor: '#64748b',
            }
        },
        line: {
            padding: '0px 8px',
            lineHeight: '1.0',
            fontSize: `${editorFontSize}px`,
        },
        gutter: {
            padding: '0px 8px',
            minWidth: '36px',
            textAlign: 'right',
            lineHeight: '1.0',
        },
        contentText: {
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.0',
        },
        wordDiff: {
            padding: '0px',
        },
        wordAdded: {
            padding: '0px',
        },
        wordRemoved: {
            padding: '0px',
        }
    };

    return (
        <div className="glass rounded-2xl overflow-hidden flex flex-col flex-none shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 glass-header">
                <div className="flex items-center gap-4">
                    <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                        {isEditing ? t('edit_manifest', { format: format.toUpperCase() }) : `${format.toUpperCase()} ${t('manifest') || 'Manifest'}`}
                    </span>
                    {!isEditing && (
                        <>
                            <div className="flex bg-background/50 rounded p-0.5 ml-2 border border-border/50">
                                <button
                                    onClick={() => setFormat('yaml')}
                                    className={`px-3 py-0.5 text-[10px] font-semibold rounded transition-all ${format === 'yaml' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                >
                                    YAML
                                </button>
                                <button
                                    onClick={() => setFormat('json')}
                                    className={`px-3 py-0.5 text-[10px] font-semibold rounded transition-all ${format === 'json' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                                >
                                    JSON
                                </button>
                            </div>

                            <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-background/50 rounded-lg border border-border group cursor-pointer hover:border-primary transition-colors shadow-sm" 
                                 onClick={() => setShowManagedFields(!showManagedFields)}
                                 title={t('hide_managed_fields_desc')}>
                                <div className={cn(
                                    "w-7 h-3.5 rounded-full relative transition-colors",
                                    showManagedFields ? "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" : "bg-muted-foreground/30 border border-border"
                                )}>
                                    <div className={cn(
                                        "absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform",
                                        showManagedFields ? "translate-x-3.5" : ""
                                    )} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-primary transition-colors">{t('managed_fields')}</span>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md mr-2 border border-border/50">
                        <span className="text-[10px] uppercase font-black text-muted-foreground pl-2">Size</span>
                        <select
                            value={editorFontSize}
                            onChange={(e) => setEditorFontSize(parseInt(e.target.value))}
                            className="bg-background text-xs font-bold text-foreground outline-none rounded px-2 py-0.5 cursor-pointer border border-border hover:border-primary transition-all"
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
                            className="text-xs font-bold px-3 py-1 bg-info/10 text-info rounded hover:bg-info/20 transition-colors uppercase tracking-wider"
                        >
                            {t('edit_manifest', { format: format.toUpperCase() })}
                        </button>
                    )}
                    {isEditing && (
                        <>
                            <button
                                onClick={() => setShowDiff(!showDiff)}
                                className={`text-xs font-bold px-3 py-1 rounded transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${showDiff ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-accent'}`}
                            >
                                <icons.list size={12} />
                                {showDiff ? t('hide_diff') : t('show_diff')}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setShowDiff(false); setEditedYaml(yaml); setSaveError(null); }}
                                className="text-xs font-bold px-3 py-1 text-foreground hover:text-primary transition-colors uppercase tracking-wider"
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
                                        setShowDiff(false);
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
                                className="text-xs font-bold px-3 py-1 bg-success/20 text-success rounded hover:bg-success/30 transition-colors uppercase tracking-wider flex items-center gap-1.5"
                                disabled={isSaving}
                            >
                                {isSaving ? <icons.refresh size={10} className="animate-pulse" /> : <icons.check_circle_alt size={10} />}
                                {isSaving ? t('saving') : t('save_changes')}
                            </button>
                        </>
                    )}
                    {!isEditing && (
                        <button className="text-text-muted hover:text-[hsl(var(--foreground))] transition-colors" onClick={() => {
                            navigator.clipboard.writeText(displayContent).then(() => {
                                setShowSuccess(true);
                                setTimeout(() => setShowSuccess(false), 2000);
                            });
                        }}>
                            <icons.clipboard size={14} />
                        </button>
                    )}
                </div>
            </div>
            
            <div className="relative flex-1 min-h-[500px]">
                {showDiff && isEditing ? (
                    <div className="absolute inset-0 z-10 bg-card overflow-auto custom-scrollbar p-1">
                        <ReactDiffViewer
                            oldValue={yaml}
                            newValue={editedYaml}
                            splitView={true}
                            leftTitle={t('original_version')}
                            rightTitle={t('modified_version')}
                            useDarkTheme={document.documentElement.classList.contains('dark')}
                            styles={diffStyles}
                        />
                    </div>
                ) : (
                    <CodeEditor
                        value={displayContent}
                        onChange={isEditing ? setEditedYaml : null}
                        readOnly={!isEditing}
                        fontSize={editorFontSize}
                        language={format}
                    />
                )}
            </div>
        </div>
    );
}
