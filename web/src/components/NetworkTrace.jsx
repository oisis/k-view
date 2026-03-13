import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Custom Edge Label Component ──────────────────────────────────────────

const CustomEdgeLabel = ({ id, x, y, label, data, healthy, expanded, setExpanded }) => {
    const { icons } = useTheme();
    const sourceNode = data?.sourceNode?.data;
    const targetNode = data?.targetNode?.data;
    
    return (
        <EdgeLabelRenderer>
            <div
                style={{
                    position: 'absolute',
                    transform: `translate(-50%, -50%) translate(${x}px,${y}px)`,
                    pointerEvents: 'all',
                    zIndex: 1000,
                }}
                className="nodrag nopan"
            >
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(expanded === id ? null : id);
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

                    <AnimatePresence>
                        {expanded === id && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[500px] bg-card/98 backdrop-blur-3xl border-2 border-border rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.5)] p-7 z-[2000] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                
                                <div className="flex flex-col gap-6 text-left relative z-10">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-3 h-3 rounded-full",
                                                healthy ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse" : "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                                            )} />
                                            <span className="text-xs font-black uppercase tracking-[0.25em] text-foreground/80">Network Transaction</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setExpanded(null); }}
                                            className="p-1.5 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
                                        >
                                            <icons.close size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 relative">
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Source ({sourceNode?.type || '—'})</span>
                                                <p className="text-xs font-bold text-foreground truncate">{sourceNode?.name || '—'}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Port / Out</span>
                                                <div className="text-xl font-black text-primary font-mono tracking-tighter">
                                                    {data?.details?.['Service Port'] || data?.details?.['Protocol'] || label || '—'}
                                                </div>
                                            </div>
                                            {(sourceNode?.selectors || sourceNode?.labels) && (
                                                <div className="space-y-1.5">
                                                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Selectors / Labels</span>
                                                    <div className="flex flex-col gap-1">
                                                        {Object.entries(sourceNode.selectors || sourceNode.labels || {}).slice(0, 4).map(([k, v]) => (
                                                            <div key={k} className="text-[10px] font-mono bg-muted/50 px-2 py-1 rounded border border-border/30 truncate">
                                                                <span className="opacity-50">{k}:</span> {v}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                                            <icons.chevrons_right size={40} className="text-primary" />
                                        </div>

                                        <div className="space-y-4 text-right">
                                            <div>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Target ({targetNode?.type || '—'})</span>
                                                <p className="text-xs font-bold text-foreground truncate">{targetNode?.name || '—'}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Port / In</span>
                                                <div className="text-xl font-black text-primary font-mono tracking-tighter">
                                                    {data?.details?.['Target Port'] || '—'}
                                                </div>
                                            </div>
                                            {(targetNode?.labels || targetNode?.selectors) && (
                                                <div className="space-y-1.5">
                                                    <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-tighter">Matching Metadata</span>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {Object.entries(targetNode.labels || targetNode.selectors || {}).slice(0, 4).map(([k, v]) => (
                                                            <div key={k} className="text-[10px] font-mono bg-primary/5 text-primary px-2 py-1 rounded border border-primary/10 truncate max-w-full">
                                                                <span className="opacity-50">{k}:</span> {v}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 mt-2">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <icons.activity size={14} className={healthy ? "text-emerald-500" : "text-destructive"} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Status: {healthy ? 'Healthy' : 'Error'}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                                            {data?.message || "Connection verified by Kubernetes control plane."}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            <CustomEdgeLabel
                id={id}
                x={labelX}
                y={labelY}
                label={label}
                data={data}
                healthy={data?.healthy}
                expanded={data?.expandedId}
                setExpanded={data?.setExpandedId}
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
    const [expandedEdgeId, setExpandedEdgeId] = useState(null);

    const fetchTrace = useCallback(async () => {
        if (!kind || !name) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/network/trace/${kind}/${namespace || 'default'}/${name}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            
            // Dynamic Column mapping: order the types that are actually present
            const typeOrder = ['External', 'Ingress', 'Service', 'Endpoint', 'Pod'];
            const presentTypes = typeOrder.filter(t => (data.nodes || []).some(n => n.type === t));
            const columns = {};
            presentTypes.forEach((t, i) => columns[t] = i);

            const newNodes = (data.nodes || []).map((n, i) => {
                const col = columns[n.type] ?? 2;
                const sameTypeNodes = data.nodes.filter(tn => tn.type === n.type);
                const typeIdx = sameTypeNodes.findIndex(tn => tn.name === n.name);
                
                const x = col * 260; // Significantly reduced spacing and multiplier
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
                        expandedId: expandedEdgeId, 
                        setExpandedId: setExpandedEdgeId,
                        sourceNode: sNode,
                        targetNode: tNode
                    },
                    animated: e.healthy,
                    style: { 
                        stroke: e.healthy ? '#10b981' : '#ef4444', 
                        strokeWidth: 6,
                        opacity: 0.8
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 5, // Even smaller arrows
                        height: 5,
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
    }, [kind, namespace, name, setNodes, setEdges, expandedEdgeId]);

    useEffect(() => {
        setEdges((eds) =>
            eds.map((edge) => ({
                ...edge,
                data: {
                    ...edge.data,
                    expandedId: expandedEdgeId,
                    setExpandedId: setExpandedEdgeId,
                },
            }))
        );
    }, [expandedEdgeId, setEdges]);

    useEffect(() => {
        fetchTrace();
    }, [fetchTrace]);

    return (
        <div className="flex flex-col flex-1 h-[750px] gap-4">
            <style>{`
                .react-flow__controls-button {
                    background-color: hsl(var(--card)) !important;
                    border-bottom: 1px solid hsl(var(--border)) !important;
                    fill: hsl(var(--foreground)) !important;
                }
                .react-flow__controls-button:hover {
                    background-color: hsl(var(--muted)) !important;
                }
                .react-flow__controls-button svg {
                    fill: currentColor !important;
                }
            `}</style>

            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-2"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                        <icons.activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-foreground uppercase italic">Network Flow Trace</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Deep Packet Topology Mapping</p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchTrace} 
                    className="rounded-xl border-border/50 font-black uppercase tracking-widest text-[10px] h-10 px-4 hover:bg-accent transition-all"
                >
                    <icons.refresh size={14} className={cn("mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </motion.div>

            <div className="flex-1 bg-card/30 border border-border/50 rounded-[2.5rem] overflow-hidden relative shadow-2xl backdrop-blur-md">
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
                        onPaneClick={() => setExpandedEdgeId(null)}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        className="transition-opacity duration-500"
                    >
                        <Background color="var(--primary)" opacity={0.04} gap={24} variant="dots" />
                        
                        <Controls position="top-right" className="bg-card/90 border-border fill-foreground m-6 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md" />
                        
                        <Panel position="top-left" className="flex gap-5 p-3.5 bg-background/90 backdrop-blur-xl border border-border/50 rounded-[1.25rem] m-6 shadow-2xl pointer-events-none select-none">
                            <div className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground">Healthy</span>
                            </div>
                            <div className="flex items-center gap-2.5 border-l border-border/50 pl-5">
                                <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground">Error</span>
                            </div>
                        </Panel>
                    </ReactFlow>
                )}
            </div>
            
            <div className="flex items-center gap-4 justify-center py-2">
                <div className="h-px w-12 bg-border/30" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-30">
                    Interact with connections to reveal network metadata
                </p>
                <div className="h-px w-12 bg-border/30" />
            </div>
        </div>
    );
}
