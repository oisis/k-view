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
        secondaryColor: '#dc2626',
        tertiaryColor: '#16a34a',
    },
    flowchart: {
        htmlLabels: true,
        curve: 'basis'
    }
});

const kindIconMap = {
    'ingress': <Globe size={14} className="text-purple-400" />,
    'service': <Network size={14} className="text-orange-400" />,
    'pod': <Box size={14} className="text-blue-400" />
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

        let graphDef = "graph LR\n";

        // Define classes
        graphDef += "classDef healthy fill:#0f172a,stroke:#22c55e,stroke-width:2px,color:#f8fafc;\n";
        graphDef += "classDef error fill:#450a0a,stroke:#ef4444,stroke-width:2px,stroke-dasharray: 4 4,color:#fca5a5;\n";
        graphDef += "classDef default fill:#1e293b,stroke:#475569,stroke-width:1px,color:#cbd5e1;\n";

        // Add Nodes
        traceData.nodes.forEach((n, i) => {
            const nodeId = `node_${i}`;
            let label = `<b>${n.type}</b><br/>${n.name}`;

            if (n.selectors && Object.keys(n.selectors).length > 0) {
                const selStr = Object.entries(n.selectors).map(([k, v]) => `${k}=${v}`).join('<br/>');
                label += `<br/><i style="font-size:10px; opacity:0.8; color:#94a3b8">Selector:<br/>${selStr}</i>`;
            }

            if (n.labels && Object.keys(n.labels).length > 0) {
                // Only show a few labels to keep it clean
                const labStr = Object.entries(n.labels).slice(0, 3).map(([k, v]) => `${k}=${v}`).join('<br/>');
                label += `<br/><i style="font-size:10px; opacity:0.8; color:#94a3b8">Labels:<br/>${labStr}${Object.keys(n.labels).length > 3 ? '<br/>...' : ''}</i>`;
            }

            graphDef += `${nodeId}["${label}"]\n`;

            if (n.healthy) {
                graphDef += `class ${nodeId} healthy\n`;
            } else if (n.message && n.message.includes("Not Found")) {
                graphDef += `class ${nodeId} error\n`;
            } else {
                graphDef += `class ${nodeId} default\n`;
            }
        });

        // Add Edges
        traceData.edges?.forEach(e => {
            const fromIdx = traceData.nodes.findIndex(n => `${n.type}:${n.name}` === e.from);
            const toIdx = traceData.nodes.findIndex(n => `${n.type}:${n.name}` === e.to);

            if (fromIdx >= 0 && toIdx >= 0) {
                const arrow = e.healthy ? "-->" : "-.->";
                const text = e.message ? `|${e.message}|` : "";
                graphDef += `node_${fromIdx} ${arrow} ${text} node_${toIdx}\n`;
            }
        });

        try {
            mermaidRef.current.innerHTML = '';
            const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}`, graphDef);
            mermaidRef.current.innerHTML = svg;
        } catch (e) {
            console.error("Mermaid rendering failed:", e);
            mermaidRef.current.innerHTML = `<div class="text-red-400 p-4 border border-red-800 rounded bg-red-900/20">Diagram rendering failed</div>`;
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
