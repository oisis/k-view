import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';
import mermaid from 'mermaid';

export default function NetworkTrace({ kind, namespace, name }) {
    const { icons, activeTheme } = useTheme();
    const [traceData, setTraceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const mermaidRef = useRef(null);
    const [tooltip, setTooltip] = useState({ visible: false, type: '', data: null, coords: { x: 0, y: 0 } });

    // Helper to get HEX color from CSS variable for Mermaid line styling
    const getThemeColor = (varName, fallback) => {
        const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        if (!val) return fallback;
        if (val.startsWith('#')) return val;
        const match = val.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([\d.]+))?\)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        }
        return fallback;
    };

    const fetchTrace = async () => {
        if (!kind || !name) return;
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
    }, [kind, namespace, name]);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: activeTheme === 'light' ? 'default' : 'base',
            themeVariables: {
                background: 'transparent',
                fontFamily: 'inherit',
            },
            flowchart: {
                htmlLabels: true,
                curve: 'basis',
                useMaxWidth: true,
            }
        });

        if (traceData && mermaidRef.current) {
            renderDiagram();
        }
    }, [traceData, activeTheme]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const trigger = e.target.closest('.trace-tooltip-trigger');
            if (trigger && traceData) {
                const type = trigger.getAttribute('data-type');
                const idx = parseInt(trigger.getAttribute('data-node-idx'));
                let data = null;
                let title = '';
                
                if (type === 'Edge') {
                    data = traceData.edges[idx]?.details;
                    title = 'Port Mapping';
                } else if (traceData.nodes && traceData.nodes[idx]) {
                    const node = traceData.nodes[idx];
                    data = type === 'Labels' ? node.labels : node.selectors;
                    title = node.name;
                }
                
                if (data) {
                    const rect = trigger.getBoundingClientRect();
                    setTooltip({
                        visible: true,
                        type: title,
                        data,
                        coords: { x: rect.left, y: rect.top }
                    });
                }
            }
        };

        const container = mermaidRef.current;
        if (container) {
            container.addEventListener('mouseover', handleMouseMove);
            return () => container.removeEventListener('mouseover', handleMouseMove);
        }
    }, [traceData]);

    const renderDiagram = async () => {
        if (!traceData || !traceData.nodes) return;

        const successHex = getThemeColor('--text-success', '#22c55e');
        const errorHex = getThemeColor('--text-error', '#ef4444');

        let graphDef = "flowchart LR\n";

        // 1. Add nodes and apply CSS classes from index.css
        traceData.nodes.forEach((n, i) => {
            const nodeId = `N${i}`;
            const nodeClass = n.type === 'External' ? 'node-external' : (n.healthy ? 'node-healthy' : 'node-unhealthy');
            
            let label = `<div style='min-width:200px; padding:15px; text-align:left; color:var(--text-primary);'>`;
            label += `<div style='font-size:10px; font-weight:900; opacity:0.6; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;'>${n.type}</div>`;
            label += `<div style='font-size:15px; font-weight:800; line-height:1.2; word-break:break-all; text-align:center; margin-bottom:15px;'>${n.name}</div>`;
            
            label += `<div style='display:flex; justify-content:center; gap:8px;'>`;
            if (n.labels && Object.keys(n.labels).length > 0) {
                label += `<div class='trace-tooltip-trigger' data-type='Labels' data-node-idx='${i}' style='font-size:9px; font-weight:900; color:white; background:var(--accent); padding:4px 10px; border-radius:6px; cursor:pointer;'>LABELS</div>`;
            }
            if (n.selectors && Object.keys(n.selectors).length > 0) {
                label += `<div class='trace-tooltip-trigger' data-type='Selectors' data-node-idx='${i}' style='font-size:9px; font-weight:900; color:white; background:var(--text-purple); padding:4px 10px; border-radius:6px; cursor:pointer;'>SELECTORS</div>`;
            }
            label += `</div></div>`;

            const sanitizedLabel = label.replace(/\n/g, ' ').replace(/"/g, "'");
            graphDef += `  ${nodeId}("${sanitizedLabel}")\n`;
            graphDef += `  class ${nodeId} ${nodeClass}\n`;
        });

        // 2. Add edges with interactive labels using CSS classes
        if (traceData.edges) {
            let edgeCount = 0;
            traceData.edges.forEach((e, idx) => {
                const fromIdx = traceData.nodes.findIndex(n => `${n.type}:${n.name}` === e.from);
                const toIdx = traceData.nodes.findIndex(n => `${n.type}:${n.name}` === e.to);
                if (fromIdx >= 0 && toIdx >= 0) {
                    const arrow = e.healthy ? "-->" : "-.->";
                    let msg = e.message ? String(e.message).replace(/->/g, '&#8594;').replace(/"/g, "'") : "";
                    
                    const statusClass = e.healthy ? 'healthy' : 'unhealthy';
                    const edgeHex = e.healthy ? successHex : errorHex;
                    
                    // Simple div with trace-edge-label class (styled in index.css)
                    let labelHtml = `<div class='trace-tooltip-trigger trace-edge-label ${statusClass}' data-type='Edge' data-node-idx='${idx}'>${msg}</div>`;
                    
                    graphDef += `  N${fromIdx} ${arrow} |"${labelHtml.replace(/\n/g, ' ')}"| N${toIdx}\n`;
                    graphDef += `  linkStyle ${edgeCount} stroke:${edgeHex},stroke-width:2px,fill:none\n`;
                    edgeCount++;
                }
            });
        }

        try {
            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = '';
                const { svg } = await mermaid.render(`mermaid-svg-${Math.random().toString(36).substring(7)}`, graphDef);
                mermaidRef.current.innerHTML = svg;
            }
        } catch (e) {
            console.error("Mermaid rendering failed:", e, graphDef);
            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = `
                    <div class='p-6 text-sm bg-red-950/20 border border-red-900/50 rounded-xl text-red-400 font-mono'>
                        <div class='font-black uppercase mb-2 flex items-center gap-2'>
                            <span class='bg-red-500 text-black px-2 py-0.5 rounded text-[10px]'>Mermaid Syntax Error</span>
                        </div>
                        <div class='mb-4 text-xs opacity-80'>${e.message || e}</div>
                        <div class='text-[10px] opacity-50 mb-1 uppercase font-bold'>Raw Definition:</div>
                        <pre class='bg-black/40 p-3 rounded-lg overflow-x-auto text-[9px] leading-tight'>${graphDef.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                    </div>
                `;
            }
        }
    };

    const copyToClipboard = () => {
        const text = Object.entries(tooltip.data || {}).map(([k, v]) => `${k}: ${v}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex flex-col flex-1 gap-4" onClick={() => setTooltip({ ...tooltip, visible: false })}>
            <div className="detail-section-header rounded-2xl overflow-hidden shadow-xl flex-none">
                <div className="px-6 py-2.5 flex items-center justify-center relative">
                    <div className="flex items-center gap-3">
                        <icons.activity size={18} className="text-white" />
                        <h3 className="text-[13px] font-bold text-white uppercase tracking-widest">Network Flow Trace</h3>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); fetchTrace(); }} className="absolute right-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Refresh Trace">
                        {icons.refresh && <icons.refresh size={16} className={loading ? "animate-spin" : ""} />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[500px]">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 text-text-muted">
                        {icons.activity && <icons.activity size={32} className="animate-pulse mb-4 text-blue-500/50" />}
                        <p>Analyzing network topology...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-start gap-3 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
                        {icons.alert && <icons.alert size={20} className="shrink-0 mt-0.5" />}
                        <div><h3 className="font-bold mb-1">Trace Failed</h3><p className="text-sm opacity-90">{error}</p></div>
                    </div>
                ) : traceData ? (
                    <div className="space-y-6 flex-1 flex flex-col">
                        <div className="flex-1 bg-sidebar/40 border border-border rounded-2xl p-8 overflow-x-auto relative flex items-center justify-center glass shadow-inner">
                            <div className="absolute top-4 left-6 flex gap-10 text-lg font-bold font-mono text-primary p-2">
                                <span className="flex items-center gap-3"><div className="w-5 h-5 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div> Healthy</span>
                                <span className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-error shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div> Error</span>
                            </div>
                            <div ref={mermaidRef} className="w-full flex justify-center mermaid-container" />
                        </div>
                    </div>
                ) : null}
            </div>

            {tooltip.visible && createPortal(
                <div 
                    style={{ position: 'fixed', top: tooltip.coords.y, left: tooltip.coords.x, transform: 'translateY(-100%)', zIndex: 9999 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                    className="mb-2 bg-tooltip border border-border-tooltip rounded-xl shadow-2xl p-5 min-w-[320px] glass animate-in fade-in zoom-in duration-200 backdrop-blur-2xl"
                >
                    <div className="flex flex-col gap-1 mb-4 relative">
                        <h4 className="text-[15px] font-black text-primary pr-6 leading-tight">{tooltip.type}</h4>
                        <div className="text-[10px] font-bold text-accent uppercase tracking-widest opacity-70">Properties</div>
                        <button onClick={() => setTooltip({ ...tooltip, visible: false })} className="absolute top-0 right-0 text-text-muted hover:text-primary transition-colors">
                            <icons.close size={14}/>
                        </button>
                    </div>
                    
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5 relative group">
                        <pre className="text-[11px] font-mono text-secondary whitespace-pre-wrap break-all leading-relaxed">
                            {Object.entries(tooltip.data || {}).map(([k, v]) => (
                                <div key={k} className="mb-1 last:mb-0">
                                    <span className="text-accent font-bold">{k}:</span> <span className="text-primary/90">{v}</span>
                                </div>
                            ))}
                        </pre>
                        <button 
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-1.5 bg-accent/20 hover:bg-accent/40 rounded-md text-accent opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                            title="Copy all"
                        >
                            <icons.clipboard size={12} />
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
