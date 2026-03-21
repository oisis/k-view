import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../SettingsContext';

const PodTerminal = memo(function PodTerminal({ pod, namespace, containers = [] }) {
    const { icons } = useTheme();
    const { t } = useTranslation();
    const [selectedContainer, setSelectedContainer] = useState(containers.length > 0 ? containers[0].name : "");
    const [selectedShell, setSelectedShell] = useState("");
    const [status, setStatus] = useState("idle"); // idle, connecting, connected, error
    const [errorMsg, setErrorMsg] = useState("");

    const terminalRef = useRef(null);
    const terminalInstance = useRef(null);
    const wsRef = useRef(null);
    const fitAddonRef = useRef(null);
    const [isDarkMode, setIsDarkMode] = useState(!document.documentElement.classList.contains('light'));

    // Theme detection logic
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const isLight = document.documentElement.classList.contains('light');
            setIsDarkMode(!isLight);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Reactive terminal theme update
    useEffect(() => {
        if (terminalInstance.current) {
            const isLight = !isDarkMode;
            terminalInstance.current.options.theme = {
                background: isLight ? '#FFFFFF' : '#0d1117',
                foreground: isLight ? '#0F172A' : '#c9d1d9',
                cursor: isLight ? '#2563EB' : '#58a6ff',
                selectionBackground: isLight ? 'rgba(37, 99, 235, 0.3)' : 'rgba(88, 166, 255, 0.3)',
                black: isLight ? '#000000' : '#484f58',
                red: isLight ? '#B91C1C' : '#ff7b72',
                green: isLight ? '#15803D' : '#3fb950',
                yellow: isLight ? '#B45309' : '#d29922',
                blue: isLight ? '#1D4ED8' : '#58a6ff',
                magenta: isLight ? '#7E22CE' : '#bc8cff',
                cyan: isLight ? '#0369A1' : '#39c5cf',
                white: isLight ? '#FFFFFF' : '#b1bac4',
                brightBlack: isLight ? '#64748B' : '#6e7681',
                brightRed: isLight ? '#DC2626' : '#ffa198',
                brightGreen: isLight ? '#16A34A' : '#56d364',
                brightYellow: isLight ? '#D97706' : '#e3b341',
                brightBlue: isLight ? '#2563EB' : '#79c0ff',
                brightMagenta: isLight ? '#9333EA' : '#d2a8ff',
                brightCyan: isLight ? '#0891B2' : '#56d4dd',
                brightWhite: isLight ? '#0F172A' : '#ffffff',
            };
        }
    }, [isDarkMode]);

    const cleanupTerminal = useCallback(() => {
        if (wsRef.current) {
            if (wsRef.current._closer) wsRef.current._closer();
            wsRef.current.close();
            wsRef.current = null;
        }
        if (terminalInstance.current) {
            terminalInstance.current.dispose();
            terminalInstance.current = null;
        }
    }, []);

    const connectTerminal = useCallback(async (containerName, shell) => {
        if (!pod || !namespace || !containerName) return;

        setStatus("connecting");

        try {
            const { Terminal } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            import('@xterm/xterm/css/xterm.css');

            const isLight = !isDarkMode;

            const term = new Terminal({
                cursorBlink: true,
                theme: {
                    background: isLight ? '#FFFFFF' : '#0d1117',
                    foreground: isLight ? '#0F172A' : '#c9d1d9',
                    cursor: isLight ? '#2563EB' : '#58a6ff',
                    selectionBackground: isLight ? 'rgba(37, 99, 235, 0.3)' : 'rgba(88, 166, 255, 0.3)',
                    black: isLight ? '#000000' : '#484f58',
                    red: isLight ? '#B91C1C' : '#ff7b72',
                    green: isLight ? '#15803D' : '#3fb950',
                    yellow: isLight ? '#B45309' : '#d29922',
                    blue: isLight ? '#1D4ED8' : '#58a6ff',
                    magenta: isLight ? '#7E22CE' : '#bc8cff',
                    cyan: isLight ? '#0369A1' : '#39c5cf',
                    white: isLight ? '#FFFFFF' : '#b1bac4',
                    brightBlack: isLight ? '#64748B' : '#6e7681',
                    brightRed: isLight ? '#DC2626' : '#ffa198',
                    brightGreen: isLight ? '#16A34A' : '#56d364',
                    brightYellow: isLight ? '#D97706' : '#e3b341',
                    brightBlue: isLight ? '#2563EB' : '#79c0ff',
                    brightMagenta: isLight ? '#9333EA' : '#d2a8ff',
                    brightCyan: isLight ? '#0891B2' : '#56d4dd',
                    brightWhite: isLight ? '#0F172A' : '#ffffff',
                },
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 13,
                scrollback: 5000,
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            if (terminalRef.current) {
                terminalRef.current.innerHTML = '';
                term.open(terminalRef.current);
                setTimeout(() => fitAddon.fit(), 100);
            }

            terminalInstance.current = term;
            fitAddonRef.current = fitAddon;

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const token = localStorage.getItem('token');
            const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
            const shellParam = shell ? `&shell=${shell}` : '';
            const wsUrl = `${protocol}//${window.location.host}/api/exec/${namespace}/${pod}/${containerName}?ws=true${tokenParam}${shellParam}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setStatus("connected");
                const dims = fitAddon.proposeDimensions();
                if (dims) {
                    ws.send(JSON.stringify({ Op: "resize", Cols: dims.cols, Rows: dims.rows }));
                }
            };

            ws.onmessage = (event) => {
                if (event.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        term.write(new Uint8Array(reader.result));
                    };
                    reader.readAsArrayBuffer(event.data);
                } else if (typeof event.data === 'string') {
                    term.write(event.data);
                }
            };

            ws.onclose = () => {
                setStatus("error");
                term.write(`\r\n\x1b[31;1mConnection Closed\x1b[0m\r\n`);
            };

            ws.onerror = () => {
                setStatus("error");
                setErrorMsg("WebSocket connection failed.");
            };

            term.onData(data => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ Op: "stdin", Data: data }));
                }
            });

            const resizeObserver = new ResizeObserver(() => {
                if (fitAddonRef.current && terminalInstance.current) {
                    try {
                        fitAddonRef.current.fit();
                        const dims = fitAddonRef.current.proposeDimensions();
                        if (dims && ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ Op: "resize", Cols: dims.cols, Rows: dims.rows }));
                        }
                    } catch (e) { }
                }
            });

            if (terminalRef.current) {
                resizeObserver.observe(terminalRef.current);
            }

            wsRef.current = ws;
            wsRef.current._closer = () => resizeObserver.disconnect();

        } catch (err) {
            console.error("Terminal initialization failed:", err);
            setStatus("error");
            setErrorMsg(err.message || "Failed to load terminal script");
        }
    }, [pod, namespace, isDarkMode]);

    useEffect(() => {
        if (selectedContainer) {
            connectTerminal(selectedContainer, selectedShell);
        } else if (containers.length > 0) {
            const cName = containers[0].name;
            setSelectedContainer(cName);
            connectTerminal(cName, selectedShell);
        } else {
            setStatus("idle");
        }
        return cleanupTerminal;
    }, [pod, namespace, containers, connectTerminal, cleanupTerminal]);

    const handleReconnect = () => {
        if (selectedContainer) {
            cleanupTerminal();
            connectTerminal(selectedContainer, selectedShell);
        }
    };

    return (
        <div className="bg-glass glass rounded-2xl border border-border overflow-hidden flex flex-col h-[600px] resize-y shadow-2xl relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)]/60 border-b border-border shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    {icons.terminal && <icons.terminal size={18} className="text-info" />}
                    <span className="text-xs uppercase font-bold text-text-muted tracking-wider">
                        Interactive Shell
                    </span>
                    {status === "connected" && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/20 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                            Live
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Shell:</span>
                        <select
                            className="bg-card border border-border text-[10px] font-black text-info rounded px-2 py-1 outline-none focus:border-info cursor-pointer uppercase"
                            value={selectedShell}
                            onChange={(e) => {
                                const newShell = e.target.value;
                                setSelectedShell(newShell);
                                if (selectedContainer) {
                                    cleanupTerminal();
                                    connectTerminal(selectedContainer, newShell);
                                }
                            }}
                        >
                            <option value="">{t('shell_auto')}</option>
                            <option value="bash">bash</option>
                            <option value="sh">sh</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">Container:</span>
                        <select
                            className="bg-card border border-border text-[10px] font-black text-info rounded px-2 py-1 outline-none focus:border-info min-w-[120px] cursor-pointer"
                            value={selectedContainer}
                            onChange={(e) => {
                                const newContainer = e.target.value;
                                setSelectedContainer(newContainer);
                                if (newContainer) {
                                    cleanupTerminal();
                                    connectTerminal(newContainer, selectedShell);
                                }
                            }}
                        >
                            <option value="" disabled>Select Container</option>
                            {(containers || []).map(c => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleReconnect}
                        className="p-1.5 text-text-muted hover:text-info hover:bg-info/10 rounded transition-colors"
                        title="Reconnect"
                    >
                        {icons.refresh && <icons.refresh size={16} className={status === "connecting" ? "animate-spin" : ""} />}
                    </button>
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 relative w-full overflow-hidden bg-transparent">
                {(status === "idle" && containers.length === 0) ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8 border border-border rounded-xl bg-card/50 max-w-sm w-full">
                            {icons.terminal && <icons.terminal size={48} className="mx-auto text-text-muted mb-4 opacity-50" />}
                            <h3 className="text-foreground font-medium mb-2">No Containers</h3>
                            <p className="text-sm text-secondary mb-6">This pod has no containers to connect to.</p>
                        </div>
                    </div>
                ) : status === "connecting" ? (
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-text-muted">
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-t-info border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            Connecting to pod...
                        </span>
                    </div>
                ) : status === "error" && !terminalInstance.current ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-8 border border-error/30 rounded-xl bg-error/10 max-w-sm w-full">
                            {icons.alert && <icons.alert size={32} className="mx-auto text-error mb-4" />}
                            <h3 className="text-error font-medium mb-2">Connection Failed</h3>
                            <p className="text-sm text-error/80 mb-6">{errorMsg || "Failed to establish terminal session."}</p>
                            <button
                                onClick={handleReconnect}
                                className="px-4 py-2 border border-error/50 text-error hover:bg-error/20 rounded text-sm transition-colors"
                            >
                                Retry Connection
                            </button>
                        </div>
                    </div>
                ) : null}

                {/* xTerm Container */}
                <div
                    ref={terminalRef}
                    style={{ backgroundColor: isDarkMode ? '#0d1117' : '#FFFFFF' }}
                    className={`absolute inset-0 w-full h-full p-2 pl-4 transition-opacity duration-300 ${status === "idle" || (status === "error" && !terminalInstance.current) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                />
            </div>
        </div>
    );
});

export default PodTerminal;
