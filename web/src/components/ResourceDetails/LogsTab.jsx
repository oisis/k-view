import React, { useState, useEffect } from 'react';
import { useTheme } from '../../ThemeContext';
import { useSettings } from '../../SettingsContext';

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
    const [logFontSize, setLogFontSize] = useState(14);
    const [loading, setLoading] = useState(true);

    // Update logContainer when containers list changes (e.g. after async load)
    useEffect(() => {
        if (containers && containers.length > 0 && !logContainer) {
            setLogContainer(containers[0].name || containers[0].containerName || '');
        }
    }, [containers]);

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
        if (logSearchRegex) {
            try {
                const re = new RegExp(logSearchTerm, 'i');
                return re.test(line);
            } catch (e) {
                return line.toLowerCase().includes(logSearchTerm.toLowerCase());
            }
        }
        return line.toLowerCase().includes(logSearchTerm.toLowerCase());
    });

    const totalPages = Math.ceil(filteredLines.length / logLinesPerPage) || 1;
    const displayedLines = logPaginationEnabled
        ? filteredLines.slice((logPage - 1) * logLinesPerPage, logPage * logLinesPerPage)
        : filteredLines;

    return (
        <div className="bg-glass glass rounded-2xl border border-border overflow-hidden flex flex-col flex-1 min-h-[500px]">
            <div className="px-4 py-3 bg-[var(--bg-muted)]/30 border-b border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
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
                                                         className={`absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-xs font-black transition-colors ${logSearchRegex ? 'bg-[var(--accent)] text-white' : 'bg-transparent text-text-muted hover:text-primary'}`}                            title={t('regex_tooltip')}
                        >
                            .*
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-border/50">
                        <span className="text-xs uppercase font-black text-text-muted pl-2">{t('refresh')}</span>
                        <select
                            value={logRefreshInterval}
                            onChange={(e) => setLogRefreshInterval(parseInt(e.target.value))}
                            className="bg-[var(--bg-input)] text-xs font-bold text-[var(--text-input)] outline-none rounded px-2 py-0.5 cursor-pointer border border-border"
                        >
                            <option value="0">OFF</option>
                            <option value="5">5s</option>
                            <option value="10">10s</option>
                            <option value="15">15s</option>
                            <option value="30">30s</option>
                            <option value="60">60s</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-border/50">
                        <span className="text-[10px] uppercase font-black text-text-muted pl-2">Size</span>
                        <select
                            value={logFontSize}
                            onChange={(e) => setLogFontSize(parseInt(e.target.value))}
                            className="bg-[var(--bg-input)] text-xs font-bold text-[var(--text-input)] outline-none rounded px-2 py-0.5 cursor-pointer border border-border"
                        >
                            {[10, 12, 14, 16].map(size => (
                                <option key={size} value={size}>{size}px</option>
                            ))}
                        </select>
                    </div>

                    {containers && containers.length > 1 && (
                        <div className="flex items-center gap-2 bg-[var(--bg-muted)]/50 p-1 rounded-md border border-border/50 ml-2">
                            <span className="text-xs uppercase font-bold text-text-muted pl-2">{t('label_container')}</span>
                            <select
                                value={logContainer}
                                onChange={(e) => {
                                    setLogContainer(e.target.value);
                                    setLogPage(1);
                                    setLogs('');
                                }}
                                className="bg-transparent text-xs font-bold text-accent outline-none pr-1 px-2 py-0.5 cursor-pointer"
                            >
                                {containers.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                            className={`w-8 h-4 rounded-full relative transition-colors ${logWrapLines ? 'bg-[var(--accent)]' : 'bg-slate-400/40 border border-border'}`}
                            onClick={() => setLogWrapLines(!logWrapLines)}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${logWrapLines ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs uppercase font-bold text-text-muted group-hover:text-primary transition-colors">{t('wrap_lines')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div
                            className={`w-8 h-4 rounded-full relative transition-colors ${logPaginationEnabled ? 'bg-[var(--accent)]' : 'bg-slate-400/40 border border-border'}`}
                            onClick={() => setLogPaginationEnabled(!logPaginationEnabled)}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${logPaginationEnabled ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs uppercase font-bold text-text-muted group-hover:text-primary transition-colors">{t('pagination')}</span>
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
                            <span className="text-xs font-mono text-white font-bold px-1 min-w-[4rem] text-center">
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
                            <span className="flex items-center gap-1.5 text-success font-bold animate-pulse">
                                <icons.refresh size={10} className="animate-spin-slow" />
                                {t('live')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div
                className={`flex-1 pt-2 px-6 pb-6 font-mono overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] bg-[var(--bg-editor)] ${logWrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}
                style={{ fontSize: `${logFontSize}px` }}
            >
                {displayedLines.length > 0 ? (
                    displayedLines.map((line, i) => {
                        const isError = /error|fail|severe/i.test(line);
                        const isWarn = /warn|attention/i.test(line);
                        const isInfo = /info|success/i.test(line);

                        return (
                            <div key={i} className={`hover:bg-[var(--bg-muted)] px-2 -mx-2 transition-colors ${isError ? 'text-error' : isWarn ? 'text-warning' : isInfo ? 'text-info' : 'text-secondary'}`}>
                                {line}
                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3 italic">
                        <icons.search size={32} className="opacity-20" />
                        {logSearchTerm ? t('no_logs_matching') : t('no_logs_found')}
                    </div>
                )}
            </div>
        </div>
    );
}
