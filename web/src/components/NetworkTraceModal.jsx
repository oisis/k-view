import React, { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, AlertCircle, Activity, Box, Network, Globe } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#334155',
        lineColor: '#64748b',
        secondaryColor: '#1e293b', // Neutral dark for labels
        tertiaryColor: '#16a34a',
        edgeLabelBackground: '#1e293b',
    },
    flowchart: {
        htmlLabels: true,
        curve: 'basis'
    }
});

const kindIconMap = {
    'ingress': <Globe size={14} className="text-purple-400" />,
    'service': <Network size={14} className="text-orange-400" />,
    'pod': <Box size={14} className="text-blue-400" />,
    'external': <Activity size={14} className="text-green-400" />
};

export default function NetworkTraceModal({ isOpen, onClose, kind, namespace, name }) {
    const [traceData, setTraceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const mermaidRef = useRef(null);

    const fetchTrace = async () => {
        if (!isOpen || !kind || !name) return;
        setLoading(true);
        setError(null);
        setTraceData(null);

        try {
            const res = await fetch(`/api/network/trace/${kind}/${namespace || 'default'}/${name}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setTraceData(data);
        } catch (err) {
            setError(err.message || "Failed to fetch network trace");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrace();
    }, [isOpen, kind, namespace, name]);

    useEffect(() => {
        if (traceData && mermaidRef.current) {
            renderDiagram();
        }
    }, [traceData]);

    const renderDiagram = async () => {
        if (!traceData || !traceData.nodes) return;

        // Basic initialization
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark'
        });

        // 1. Header
        let graphDef = "graph LR\n";

        // 2. Nodes (using very simple plain text labels)
        traceData.nodes.forEach((n, i) => {
            const nodeId = `N${i}`;
            const cleanType = String(n.type).replace(/[^\w]/g, "");
            const cleanName = String(n.name).replace(/[^\w-]/g, "");
            graphDef += `  ${nodeId}["${cleanType}: ${cleanName}"]\n`;
        });

        // 3. Edges
        let edgeCount = 0;
        if (traceData.edges) {
            traceData.edges.forEach((e) => {
                const fromIdx = traceData.nodes.findIndex(n => `${n.type}:${n.name}` === e.from);
                const toIdx = traceData.nodes.findIndex(n => `${n.type}:${n.name}` === e.to);

                if (fromIdx >= 0 && toIdx >= 0) {
                    const arrow = e.healthy ? "-->" : "---";
                    graphDef += `  N${fromIdx} ${arrow} N${toIdx}\n`;

                    // Style links with named colors ONLY
                    const color = e.healthy ? "green" : "red";
                    graphDef += `  linkStyle ${edgeCount} stroke:${color},stroke-width:2px\n`;
                    edgeCount++;
                }
            });
        }

        // 4. Styles (Individual style instead of classDef for maximum compatibility)
        traceData.nodes.forEach((n, i) => {
            const nodeId = `N${i}`;
            if (n.type === 'External') {
                graphDef += `  style ${nodeId} fill:darkgreen,stroke:white,color:white\n`;
            } else if (n.healthy) {
                graphDef += `  style ${nodeId} fill:darkblue,stroke:green,color:white\n`;
            } else {
                graphDef += `  style ${nodeId} fill:darkred,stroke:red,color:white\n`;
            }
        });

        try {
            mermaidRef.current.innerHTML = '';
            const renderId = `m${Math.random().toString(36).substring(7)}`;
            const { svg } = await mermaid.render(renderId, graphDef);
            mermaidRef.current.innerHTML = svg;
        } catch (e) {
            console.error("Mermaid error:", e);
            mermaidRef.current.innerHTML = `
                <div class='p-4 text-sm border border-red-900/50 bg-red-950/20 rounded text-red-400'>
                  <p class='font-bold mb-1'>Diagram Trace Error</p>
                  <pre class='text-[10px] mt-2 bg-black/40 p-2 overflow-auto'>${graphDef}</pre>
                </div>`;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-white)]">Network Flow Trace</h2>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                                {kind.toUpperCase()} • {namespace ? `${namespace}/` : ''}{name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchTrace} className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-muted)] rounded transition-colors" title="Refresh Trace">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-red-900/30 hover:text-red-400 rounded transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-[var(--bg-main)]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)] h-full min-h-[400px]">
                            <Activity size={32} className="animate-pulse mb-4 text-blue-500/50" />
                            <p>Analyzing network topology...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold mb-1">Trace Failed</h3>
                                    <p className="text-sm opacity-90">{error}</p>
                                </div>
                            </div>
                        </div>
                    ) : traceData ? (
                        <div className="p-6 space-y-6">
                            {/* Validation Badges */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {traceData.nodes.map((n, i) => (
                                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${n.healthy ? 'bg-green-900/10 border-green-800/50' : 'bg-red-900/10 border-red-800/50'}`}>
                                        <div className="mt-0.5">
                                            {kindIconMap[n.type.toLowerCase()] || <Box size={14} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${n.healthy ? 'text-green-400' : 'text-red-400'}`}>
                                                    {n.type}: {n.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1">{n.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Diagram Container */}
                            <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 overflow-x-auto relative min-h-[300px] flex items-center justify-center">
                                <div className="absolute top-3 left-3 flex gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Healthy</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Error</span>
                                </div>
                                <div ref={mermaidRef} className="w-full h-full flex justify-center mermaid-container" />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
