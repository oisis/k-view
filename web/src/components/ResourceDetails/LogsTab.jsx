import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../ThemeContext';
import { useSettings } from '../../SettingsContext';
import * as ReactWindow from 'react-window';
const { FixedSizeList: List } = ReactWindow;

export default function LogsTab({ kind, namespace, name, containers, t }) {
    const { icons } = useTheme();
    const { settings } = useSettings();
    const [logs, setLogs] = useState('');
    const [logRefreshInterval, setLogRefreshInterval] = useState(settings.logsRefreshInterval || 5);
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [logSearchRegex, setLogSearchRegex] = useState(false);
    const [logPaginationEnabled, setLogPaginationEnabled] = useState(true);
    const [logPage, setLogPage] = useState(1);
    const [logLinesPerPage] = useState(36);
    const [logContainer, setLogContainer] = useState(containers && containers.length > 0 ? containers[0].name : '');
    const [logWrapLines, setLogWrapLines] = useState(false);
    const [logFontSize, setLogFontSize] = useState(13);
    const [loading, setLoading] = useState(true);
    const listRef = useRef(null);

    // Update logContainer when containers list changes (e.g. after async load)
    useEffect(() => {
        if (containers && containers.length > 0 && !logContainer) {
            setLogContainer(containers[0].name || containers[0].containerName || '');
        }
    }, [containers]);

    const downloadLogs = () => {
        if (!logs) return;
        const blob = new Blob([logs], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}-${logContainer || 'logs'}.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const fetchLogs = async () => {
        if (!logContainer && (!containers || containers.length === 0)) return;
        try {
            // Normalize kind for API
            let normalizedKind = kind.toLowerCase();
            if (normalizedKind === 'pod') normalizedKind = 'pods';
            if (normalizedKind === 'service') normalizedKind = 'services';
            if (normalizedKind === 'deployment') normalizedKind = 'deployments';
            if (normalizedKind === 'daemonset') normalizedKind = 'daemonsets';
            if (normalizedKind === 'statefulset') normalizedKind = 'statefulsets';
            if (normalizedKind === 'replicaset') normalizedKind = 'replicasets';
            if (normalizedKind === 'job') normalizedKind = 'jobs';
            if (normalizedKind === 'cronjob') normalizedKind = 'cronjobs';

            const containerQuery = logContainer ? `&container=${logContainer}` : '';
            // Always use the resources endpoint which handles controllers
            const url = `/api/resources/${normalizedKind}/${namespace || '-'}/${name}/logs?tail=1000${containerQuery}`;
            const logsRes = await fetch(url);
            if (logsRes.ok) {
                const logsData = await logsRes.text();
                setLogs(logsData);
            }
        } catch (e) {
            console.error('Failed to fetch logs:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchLogs();
    }, [logContainer, namespace, name]);

    useEffect(() => {
        if (logRefreshInterval > 0) {
            const interval = setInterval(fetchLogs, logRefreshInterval * 1000);
            return () => clearInterval(interval);
        }
    }, [logRefreshInterval, namespace, name, logContainer]);

    if (loading && !logs) {
        return (
            <div className="bg-glass glass rounded-2xl border border-border flex items-center justify-center p-8 min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <icons.refresh size={32} className="animate-spin text-info" />
                    <p className="text-text-muted font-medium">{t('loading')}</p>
                </div>
            </div>
        );
    }

    const allLines = logs.split('\n');
    const filteredLines = allLines.filter(line => {
        if (!logSearchTerm) return true;
        const safeLine = (line || '');
        const safeTerm = (logSearchTerm || '');
        
        if (logSearchRegex) {
            try {
                const re = new RegExp(safeTerm, 'i');
                return re.test(safeLine);
            } catch (e) {
                return safeLine.toLowerCase().includes(safeTerm.toLowerCase());
            }
        }
        return safeLine.toLowerCase().includes(safeTerm.toLowerCase());
    });

    const totalPages = Math.ceil(filteredLines.length / logLinesPerPage) || 1;
    const displayedLines = logPaginationEnabled
        ? filteredLines.slice((logPage - 1) * logLinesPerPage, logPage * logLinesPerPage)
        : filteredLines;

    const Row = ({ index, style }) => {
        const line = displayedLines[index];
        if (line === undefined) return null;
        
        const isError = /error|fail|severe/i.test(line);
        const isWarn = /warn|attention/i.test(line);
        const isInfo = /info|success/i.test(line);

        return (
            <div 
                style={style} 
                className={`hover:bg-accent/30 px-6 transition-colors flex items-center ${isError ? 'text-destructive font-semibold' : isWarn ? 'text-orange-500 font-semibold' : isInfo ? 'text-emerald-500 font-semibold' : 'text-foreground'}`}
            >
                <span className={logWrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}>
                    {line}
                </span>
            </div>
        );
    };

    return (
        <div className="bg-glass glass rounded-2xl border border-border flex flex-col h-[620px] resize-y overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-[var(--bg-muted)]/30 border-b border-border flex flex-wrap items-center justify-between gap-2 flex-none">
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <icons.search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                            type="text"
                            placeholder={t('search_logs')}
                            value={logSearchTerm}
                            onChange={(e) => { setLogSearchTerm(e.target.value); setLogPage(1); }}
                            className="pl-9 pr-4 py-1.5 bg-[var(--bg-input)] border border-border rounded-md text-xs text-[var(--text-input)] placeholder:text-text-muted focus:outline-none focus:border-[var(--accent)]/50 w-64 transition-all"
                        />
                        <button
                            onClick={() => setLogSearchRegex(!logSearchRegex)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-black transition-colors ${logSearchRegex ? 'bg-accent text-primary-foreground' : 'bg-transparent text-text-muted hover:text-primary'}`}
                            title={t('regex_tooltip')}
                        >
                            .*
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-bg-muted/50 p-0.5 rounded-md border border-border/50" title={t('refresh')}>
                        <div className="pl-1.5 text-text-muted">
                            <icons.refresh size={12} />
                        </div>
                        <select
                            value={logRefreshInterval}
                            onChange={(e) => setLogRefreshInterval(parseInt(e.target.value))}
                            className="bg-input text-xs font-bold text-input-text outline-none rounded px-2 py-0.5 cursor-pointer border border-border"
                        >
                            <option value="0">OFF</option>
                            <option value="5">5s</option>
                            <option value="10">10s</option>
                            <option value="15">15s</option>
                            <option value="30">30s</option>
                            <option value="60">60s</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1 bg-bg-muted/50 p-0.5 rounded-md border border-border/50" title="Font Size">
                        <div className="pl-1.5 text-text-muted">
                            <icons.hash size={12} />
                        </div>
                        <select
                            value={logFontSize}
                            onChange={(e) => setLogFontSize(parseInt(e.target.value))}
                            className="bg-input text-xs font-bold text-input-text outline-none rounded px-2 py-0.5 cursor-pointer border border-border"
                        >
                            {[10, 12, 13, 14, 16].map(size => (
                                <option key={size} value={size}>{size}px</option>
                            ))}
                        </select>
                    </div>

                    {containers && containers.length > 1 && (
                        <div className="flex items-center gap-1 bg-bg-muted/50 p-0.5 rounded-md border border-border/50 ml-1" title={t('label_container')}>
                            <div className="pl-1.5 text-text-muted">
                                <icons.box size={12} />
                            </div>
                            <select
                                value={logContainer}
                                onChange={(e) => {
                                    setLogContainer(e.target.value);
                                    setLogPage(1);
                                    setLogs('');
                                }}
                                className="bg-transparent text-xs font-bold text-accent outline-none pr-1 px-2 py-0.5 cursor-pointer"
                            >
                                {(containers || []).map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={downloadLogs}
                        disabled={!logs}
                        className="p-1.5 text-text-muted hover:text-accent disabled:opacity-30 transition-colors"
                        title={t('download_logs')}
                    >
                        <icons.download size={16} />
                    </button>
                    <label className="flex items-center gap-1.5 cursor-pointer group" title={t('wrap_lines')}>
                        <div
                            className={`w-7 h-3.5 rounded-full relative transition-colors ${logWrapLines ? 'bg-accent' : 'bg-slate-400/40 border border-border'}`}
                            onClick={() => setLogWrapLines(!logWrapLines)}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${logWrapLines ? 'translate-x-3' : ''}`} />
                        </div>
                        <icons.list size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer group" title={t('pagination')}>
                        <div
                            className={`w-7 h-3.5 rounded-full relative transition-colors ${logPaginationEnabled ? 'bg-accent' : 'bg-slate-400/40 border border-border'}`}
                            onClick={() => setLogPaginationEnabled(!logPaginationEnabled)}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform ${logPaginationEnabled ? 'translate-x-3' : ''}`} />
                        </div>
                        <icons.layers size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                    </label>

                    {logPaginationEnabled && totalPages > 1 && (
                        <div className="flex items-center gap-1 bg-[var(--bg-muted)]/50 rounded px-2 py-1 border border-border/30">
                            <button
                                disabled={logPage === 1}
                                onClick={() => setLogPage(1)}
                                className="p-0.5 text-text-muted hover:text-info disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
                                title={t('first_page')}
                            >
                                <icons.chevrons_left size={14} />
                            </button>
                            <button
                                disabled={logPage === 1}
                                onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                className="p-0.5 text-text-muted hover:text-info disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
                                title={t('prev_page')}
                            >
                                <icons.chevron_left size={14} />
                            </button>
                            <span className="text-xs font-mono text-foreground font-bold px-1 min-w-[4rem] text-center">
                                {logPage} / {totalPages}
                            </span>
                            <button
                                disabled={logPage === totalPages}
                                onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                                className="p-0.5 text-text-muted hover:text-info disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
                                title={t('next_page')}
                            >
                                <icons.chevron_right size={14} />
                            </button>
                            <button
                                disabled={logPage === totalPages}
                                onClick={() => setLogPage(totalPages)}
                                className="p-0.5 text-text-muted hover:text-info disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
                                title={t('last_page')}
                            >
                                <icons.chevrons_right size={14} />
                            </button>
                        </div>
                    )}

                    <div className="text-text-muted text-xs font-mono flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-info font-bold">
                            <icons.list size={10} />
                            {filteredLines.length} {t('matches')}
                        </span>
                        {logRefreshInterval > 0 && (
                            <span className="text-success font-bold animate-pulse cursor-help" title={t('live')}>
                                <icons.refresh size={12} strokeWidth={3} className="animate-spin-slow" />
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div
                className="flex-1 font-mono bg-muted/20 overflow-hidden"
                style={{ fontSize: `${logFontSize}px` }}
            >
                {displayedLines.length > 0 ? (
                    <List
                        ref={listRef}
                        height={570}
                        itemCount={displayedLines.length}
                        itemSize={logFontSize + 8}
                        width="100%"
                        className="scrollbar-thin scrollbar-thumb-border"
                    >
                        {Row}
                    </List>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3 italic">
                        <icons.search size={32} className="opacity-20" />
                        {logSearchTerm ? t('no_logs_match') : t('no_logs_found')}
                    </div>
                )}
            </div>
        </div>
    );
}
