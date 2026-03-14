import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    Handle, 
    Position, 
    MarkerType,
    useNodesState,
    useEdgesState,
    Panel,
    EdgeLabelRenderer,
    getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Custom Edge Label Component ──────────────────────────────────────────

const CustomEdgeLabel = ({ id, x, y, label, healthy, onSelect }) => {
    return (
        <EdgeLabelRenderer>
            <div
                style={{
                    position: 'absolute',
                    transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
                    pointerEvents: 'all', // Crucial for clicking
                    zIndex: 1000,
                }}
                className="nodrag nopan"
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onSelect) onSelect();
                    }}
                    className={cn(
                        "px-3 py-1 rounded-lg text-[11px] font-black font-mono tracking-tight shadow-xl transition-all border-2 active:scale-95 whitespace-nowrap",
                        healthy 
                            ? "bg-background border-emerald-500 text-emerald-600 hover:bg-emerald-50" 
                            : "bg-background border-destructive text-destructive hover:bg-destructive/5"
                    )}
                >
                    {label || 'Link'}
                </button>
            </div>
        </EdgeLabelRenderer>
    );
};

// ── Custom Edge Component ────────────────────────────────────────────────

const DetailedEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data,
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                style={{ ...style, strokeWidth: 6 }} 
                className="react-flow__edge-path cursor-pointer"
                d={edgePath}
                markerEnd={markerEnd}
                onClick={(e) => {
                    e.stopPropagation();
                    if (data?.onSelect) data.onSelect();
                }}
            />
            <CustomEdgeLabel
                id={id}
                x={labelX}
                y={labelY}
                label={label}
                healthy={data?.healthy}
                onSelect={() => data?.onSelect && data.onSelect()}
            />
        </>
    );
};

const edgeTypes = {
    detailed: DetailedEdge,
};

// ── Custom Node Components ───────────────────────────────────────────────

const ResourceNode = ({ data }) => {
    const { icons } = useTheme();
    const Icon = icons[data.type?.toLowerCase()] || icons.pod;
    
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "px-4 py-3 rounded-xl border-2 bg-card shadow-2xl min-w-[200px] transition-all",
                data.healthy ? "border-emerald-500/40 shadow-emerald-500/5" : "border-destructive/40 shadow-destructive/5"
            )}
        >
            <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-primary border-2 border-background" />
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1 rounded-lg",
                            data.healthy ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        )}>
                            <Icon size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {data.type}
                        </span>
                    </div>
                    <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        data.healthy ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-destructive animate-pulse"
                    )} />
                </div>
                <div className="text-sm font-black tracking-tight text-foreground truncate max-w-[170px]">
                    {data.name}
                </div>
                <div className="flex flex-wrap gap-1">
                    {data.labels && Object.entries(data.labels).slice(0, 1).map(([k, v]) => (
                        <div key={k} className="text-[9px] bg-muted/50 px-2 py-0.5 rounded border border-border/30 text-muted-foreground truncate max-w-[140px] font-mono font-bold">
                            {k}={v}
                        </div>
                    ))}
                </div>
            </div>
            <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-primary border-2 border-background" />
        </motion.div>
    );
};

const nodeTypes = {
    resource: ResourceNode,
};

// ── Main Trace Component ──────────────────────────────────────────────────

export default function NetworkTrace({ kind, namespace, name }) {
    const { icons } = useTheme();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedEdge, setSelectedEdge] = useState(null);

    const fetchTrace = useCallback(async () => {
        if (!kind || !name) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/network/trace/${kind}/${namespace || 'default'}/${name}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            
            const typeOrder = ['External', 'Ingress', 'Service', 'Endpoint', 'Pod'];
            const presentTypes = typeOrder.filter(t => (data.nodes || []).some(n => n.type === t));
            const columns = {};
            presentTypes.forEach((t, i) => columns[t] = i);

            const newNodes = (data.nodes || []).map((n, i) => {
                const col = columns[n.type] ?? 2;
                const sameTypeNodes = data.nodes.filter(tn => tn.type === n.type);
                const typeIdx = sameTypeNodes.findIndex(tn => tn.name === n.name);
                const x = col * 260;
                const y = typeIdx * 140;
                
                return {
                    id: `${n.type}:${n.name}`,
                    type: 'resource',
                    position: { x, y },
                    data: { ...n },
                };
            });

            const newEdges = (data.edges || []).map((e, i) => {
                let displayLabel = e.message;
                if (e.details && e.details['Service Port'] && e.details['Target Port']) {
                    displayLabel = `${e.details['Service Port']} \u2192 ${e.details['Target Port']}`;
                } else if (displayLabel === "Points to Service" && e.details?.['Protocol']) {
                    displayLabel = e.details['Protocol'];
                }

                const sNode = newNodes.find(n => n.id === e.from);
                const tNode = newNodes.find(n => n.id === e.to);

                return {
                    id: `e${i}`,
                    type: 'detailed',
                    source: e.from,
                    target: e.to,
                    label: displayLabel,
                    data: { 
                        ...e, 
                        sourceNode: sNode,
                        targetNode: tNode,
                        onSelect: () => setSelectedEdge({ ...e, sourceNode: sNode, targetNode: tNode })
                    },
                    animated: e.healthy,
                    style: { 
                        stroke: e.healthy ? '#10b981' : '#ef4444', 
                        strokeWidth: 6,
                        opacity: 0.8
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 15, // Reduced from default
                        height: 15,
                        color: e.healthy ? '#10b981' : '#ef4444',
                    },
                };
            });

            setNodes(newNodes);
            setEdges(newEdges);
        } catch (err) {
            setError(err.message || "Failed to fetch network trace");
        } finally {
            setLoading(false);
        }
    }, [kind, namespace, name, setNodes, setEdges]);

    useEffect(() => {
        fetchTrace();
    }, [fetchTrace]);

    return (
        <div className="flex flex-col flex-1 h-[640px] gap-4 relative">
            <style>{`
                .react-flow__controls {
                    display: flex !important;
                    flex-direction: row !important;
                    box-shadow: none !important;
                }
                .react-flow__controls-button {
                    background-color: hsl(var(--card)) !important;
                    border-right: 1px solid hsl(var(--border)) !important;
                    border-bottom: none !important;
                    fill: hsl(var(--foreground)) !important;
                }
                .react-flow__controls-button:last-child {
                    border-right: none !important;
                }
                .react-flow__controls-button:hover {
                    background-color: hsl(var(--muted)) !important;
                }
                .react-flow__controls-button svg {
                    fill: currentColor !important;
                }
                .react-flow__edge:hover .react-flow__edge-path {
                    stroke-width: 10 !important;
                    opacity: 1 !important;
                }
            `}</style>

            <div className="flex-1 bg-card/30 border border-border/50 rounded-2xl overflow-hidden relative shadow-2xl backdrop-blur-md mt-2">
                {loading && !nodes.length ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-lg">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <icons.refresh size={40} className="text-primary" />
                        </motion.div>
                        <p className="mt-4 animate-pulse font-black uppercase tracking-[0.2em] text-[10px] opacity-60">Intercepting Packets...</p>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-destructive/5">
                        <div className="p-5 rounded-full bg-destructive/10 text-destructive mb-6 shadow-xl">
                            <icons.alert size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-destructive uppercase italic mb-2">Topology Scan Failed</h3>
                        <p className="text-muted-foreground text-sm max-w-md font-medium leading-relaxed">{error}</p>
                        <Button onClick={fetchTrace} variant="destructive" className="mt-8 rounded-xl font-black uppercase tracking-widest text-xs px-8 h-12 shadow-lg">Retry Analysis</Button>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onPaneClick={() => setSelectedEdge(null)}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        className="transition-opacity duration-500"
                    >
                        <Background color="var(--primary)" opacity={0.04} gap={24} variant="dots" />
                        <Controls position="top-right" className="bg-card/90 border-border fill-foreground m-4 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md flex flex-row" />
                        <Panel position="top-center" className="m-4">
                            <div className="px-6 py-2 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col items-center">
                                <h3 className="text-sm font-black tracking-[0.2em] text-foreground uppercase italic leading-none">Network Flow Trace</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground opacity-50 mt-1">Deep Packet Topology Mapping</p>
                            </div>
                        </Panel>
                        <Panel position="top-left" className="flex gap-3 px-3 py-1.5 bg-background/90 backdrop-blur-xl border border-border/50 rounded-xl m-4 shadow-2xl pointer-events-none select-none">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-foreground">Healthy</span>
                            </div>
                            <div className="flex items-center gap-2 border-l border-border/50 pl-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-foreground">Error</span>
                            </div>
                        </Panel>
                    </ReactFlow>
                )}
            </div>

            {/* Global Edge Details Modal */}
            <AnimatePresence>
                {selectedEdge && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                            onClick={() => setSelectedEdge(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-[550px] bg-card border-2 border-border rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] p-8 overflow-hidden text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                            
                            <div className="flex flex-col gap-8 relative z-10">
                                <div className="flex items-center justify-between border-b border-border/50 pb-5">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-4 h-4 rounded-full",
                                            selectedEdge.healthy ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" : "bg-destructive shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                                        )} />
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-foreground">Network Transaction</h2>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">Real-time Packet Analysis</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedEdge(null)}
                                        className="p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground active:scale-90 border border-transparent hover:border-border"
                                    >
                                        <icons.close size={20} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-10 relative">
                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-50">Source ({selectedEdge.sourceNode?.data?.type || '—'})</span>
                                            <p className="text-sm font-black text-foreground break-all leading-tight">{selectedEdge.sourceNode?.data?.name || '—'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">Port / Protocol</span>
                                            <div className="text-2xl font-black text-foreground font-mono tracking-tighter">
                                                {selectedEdge.details?.['Service Port'] || selectedEdge.details?.['Protocol'] || selectedEdge.message || '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                                        <icons.chevrons_right size={60} className="text-primary" />
                                    </div>

                                    <div className="space-y-6 text-right">
                                        <div>
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2 opacity-50">Target ({selectedEdge.targetNode?.data?.type || '—'})</span>
                                            <p className="text-sm font-black text-foreground break-all leading-tight">{selectedEdge.targetNode?.data?.name || '—'}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-tighter">Target Port</span>
                                            <div className="text-2xl font-black text-foreground font-mono tracking-tighter">
                                                {selectedEdge.details?.['Target Port'] || 'ANY'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-muted/20 p-5 rounded-[1.5rem] border border-border/40 mt-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <icons.activity size={16} className={selectedEdge.healthy ? "text-emerald-500" : "text-destructive"} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Status: {selectedEdge.healthy ? 'Verified' : 'Connection Error'}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium italic opacity-80">
                                        {selectedEdge.message || "Network path validated against Kubernetes API and metrics server."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-4 justify-center py-2 opacity-30">
                <div className="h-px w-12 bg-border/30" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Click connections for details</p>
                <div className="h-px w-12 bg-border/30" />
            </div>
        </div>
    );
}
