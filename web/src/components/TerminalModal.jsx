import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, CircleAlert, CheckCircle2 } from 'lucide-react';

export default function TerminalModal({ isOpen, onClose, pod, namespace, containers = [] }) {
    const [selectedContainer, setSelectedContainer] = useState(containers.length === 1 ? containers[0].name : "");
    const [status, setStatus] = useState("idle"); // idle, connecting, connected, error
    const [errorMsg, setErrorMsg] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);

    const terminalRef = useRef(null);
    const terminalInstance = useRef(null);
    const wsRef = useRef(null);
    const fitAddonRef = useRef(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStatus("idle");
            setErrorMsg("");
            if (containers.length === 1) {
                setSelectedContainer(containers[0].name);
                connectTerminal(containers[0].name);
            } else {
                setSelectedContainer("");
            }
        } else {
            cleanupTerminal();
        }
        return cleanupTerminal;
    }, [isOpen, pod, namespace, containers]);

    const connectTerminal = useCallback(async (containerName) => {
        if (!isOpen || !pod || !namespace || !containerName) return;

        setStatus("connecting");

        // Dynamically import xterm to avoid SSR issues if used in frameworks, 
        // and because they are not ES modules by default in some bundlers.
        try {
            const { Terminal } = await import('xterm');
            const { FitAddon } = await import('xterm-addon-fit');
            import('xterm/css/xterm.css'); // Import styles dynamically

            const isLight = document.body.classList.contains('theme-light');

            // Initialize Terminal
            const term = new Terminal({
                cursorBlink: true,
                theme: {
                    background: isLight ? '#CBD5E1' : '#0d1117',
                    foreground: isLight ? '#000000' : '#c9d1d9',
                    cursor: isLight ? '#2563EB' : '#58a6ff',
                    selectionBackground: isLight ? 'rgba(37, 99, 235, 0.3)' : 'rgba(88, 166, 255, 0.3)',
                    black: isLight ? '#000000' : '#484f58',
                    red: isLight ? '#B91C1C' : '#ff7b72',
                    green: isLight ? '#15803D' : '#3fb950',
                    yellow: isLight ? '#B45309' : '#d29922',
                    blue: isLight ? '#1D4ED8' : '#58a6ff',
                    magenta: isLight ? '#7E22CE' : '#bc8cff',
                    cyan: isLight ? '#0369A1' : '#39c5cf',
                    white: isLight ? '#475569' : '#b1bac4',
                    brightBlack: isLight ? '#64748B' : '#6e7681',
                    brightRed: isLight ? '#DC2626' : '#ffa198',
                    brightGreen: isLight ? '#16A34A' : '#56d364',
                    brightYellow: isLight ? '#D97706' : '#e3b341',
                    brightBlue: isLight ? '#2563EB' : '#79c0ff',
                    brightMagenta: isLight ? '#9333EA' : '#d2a8ff',
                    brightCyan: isLight ? '#0891B2' : '#56d4dd',
                    brightWhite: isLight ? '#F8FAFC' : '#ffffff',
                },
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 13,
                scrollback: 5000,
            });

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            // Mount to DOM
            if (terminalRef.current) {
                terminalRef.current.innerHTML = ''; // Clear previous
                term.open(terminalRef.current);
                fitAddon.fit();
            }

            terminalInstance.current = term;
            fitAddonRef.current = fitAddon;

            // Connect WebSocket
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // JWT token must be sent via query param since WebSocket API doesn't support custom headers
            const token = localStorage.getItem('token');
            const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
            const wsUrl = `${protocol}//${window.location.host}/api/exec/${namespace}/${pod}/${containerName}${tokenParam}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                setStatus("connected");
                // Send initial resize
                const dims = fitAddon.proposeDimensions();
                if (dims) {
                    ws.send(JSON.stringify({ Op: "resize", Cols: dims.cols, Rows: dims.rows }));
                }
            };

            ws.onmessage = (event) => {
                // Determine if data is Blob (binary) or string
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

            ws.onclose = (e) => {
                setStatus("error");
                term.write(`\r\n\x1b[31;1mConnection Closed\x1b[0m\r\n`);
            };

            ws.onerror = (e) => {
                setStatus("error");
                setErrorMsg("WebSocket connection failed.");
            };

            // Handle user input
            term.onData(data => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ Op: "stdin", Data: data }));
                }
            });

            // Handle Resize
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

            // Store closer
            wsRef.current._closer = () => resizeObserver.disconnect();

        } catch (err) {
            console.error("Terminal initialization failed:", err);
            setStatus("error");
            setErrorMsg(err.message || "Failed to load terminal script");
        }
    }, [isOpen, namespace, pod]);

    const cleanupTerminal = () => {
        if (wsRef.current) {
            if (wsRef.current._closer) wsRef.current._closer();
            wsRef.current.close();
            wsRef.current = null;
        }
        if (terminalInstance.current) {
            terminalInstance.current.dispose();
            terminalInstance.current = null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (status !== "connected") onClose(); }} />

            <div className={`relative flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all ${isFullscreen
                ? 'fixed inset-4 w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] rounded-none border border-[#30363d]'
                : 'w-full max-w-6xl h-[85vh] rounded-2xl border border-[var(--border-color)]'
                } bg-[var(--bg-glass-deep)] glass`}>

                {/* Header Segment */}
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-sidebar)]/30 border-b border-[var(--border-color)] shrink-0">
                    <div className="flex items-center gap-3">
                        <TerminalIcon size={18} className="text-info" />
                        <h2 className="text-sm font-semibold text-[var(--text-white)] font-mono">
                            {pod}
                        </h2>
                        {status === "connected" && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/20 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse"></span>
                                Live
                            </span>
                        )}
                        {status === "error" && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/20 uppercase tracking-widest">
                                <CircleAlert size={10} />
                                Disconnected
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {containers.length > 1 && (
                            <div className="flex items-center gap-2 mr-2">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">Container:</span>
                                <select
                                    className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-bold text-info rounded px-3 py-1 outline-none focus:border-info min-w-[150px] cursor-pointer"
                                    value={selectedContainer}
                                    onChange={(e) => {
                                        const newContainer = e.target.value;
                                        setSelectedContainer(newContainer);
                                        if (newContainer) {
                                            cleanupTerminal();
                                            connectTerminal(newContainer);
                                        }
                                    }}
                                >
                                    <option value="" disabled>Select Container</option>
                                    {containers.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="w-px h-5 bg-[var(--border-color)] mx-1"></div>

                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-white)] hover:bg-[var(--bg-muted)] rounded transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-[var(--text-muted)] hover:text-error hover:bg-error/10 rounded transition-colors"
                            title="Close Terminal"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body Segment */}
                <div className="flex-1 relative w-full overflow-hidden bg-transparent">
                    {(status === "idle" && containers.length > 1) ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center p-8 border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)]/50 max-w-sm w-full">
                                <TerminalIcon size={48} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
                                <h3 className="text-[var(--text-white)] font-medium mb-2">Multiple Containers Detected</h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">This pod has {containers.length} containers. Please select one from the top right to open an interactive remote shell.</p>
                            </div>
                        </div>
                    ) : status === "connecting" ? (
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[var(--text-muted)]">
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-t-info border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                Establishing secure SPDY connection...
                            </span>
                        </div>
                    ) : status === "error" && !terminalInstance.current ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center p-8 border border-error/30 rounded-xl bg-error/10 max-w-sm w-full">
                                <CircleAlert size={32} className="mx-auto text-error mb-4" />
                                <h3 className="text-error font-medium mb-2">Connection Failed</h3>
                                <p className="text-sm text-error/80 mb-6">{errorMsg || "Failed to establish terminal session."}</p>
                                <button onClick={onClose} className="px-4 py-2 border border-error/50 text-error hover:bg-error/20 rounded text-sm transition-colors">
                                    Close Terminal
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {/* Actual xTerm Container */}
                    <div
                        ref={terminalRef}
                        className={`absolute inset-0 w-full h-full p-2 pl-4 transition-opacity duration-300 ${status === "idle" || (status === "error" && !terminalInstance.current) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    />
                </div>
            </div>
        </div>
    );
}
