import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    Handle, 
    Position, 
    MarkerType,
    useNodesState,
    useEdgesState,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Custom Node Components ───────────────────────────────────────────────

const ResourceNode = ({ data }) => {
    const { icons } = useTheme();
    const Icon = icons[data.type?.toLowerCase()] || icons.pod;
    
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "px-4 py-3 rounded-2xl border-2 bg-card shadow-2xl min-w-[220px] transition-all",
                data.healthy ? "border-emerald-500/50 shadow-emerald-500/10" : "border-destructive/50 shadow-destructive/10"
            )}
        >
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-primary border-2 border-background" />
            
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-1">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-lg",
                            data.healthy ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                        )}>
                            <Icon size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {data.type}
                        </span>
                    </div>
                    <Badge variant={data.healthy ? "outline" : "destructive"} className="text-[8px] h-4 font-black uppercase">
                        {data.healthy ? "Healthy" : "Error"}
                    </Badge>
                </div>
                
                <div className="text-sm font-black tracking-tight text-foreground truncate max-w-[180px] italic">
                    {data.name}
                </div>

                <div className="flex flex-wrap gap-1 mt-1">
                    {data.labels && Object.entries(data.labels).slice(0, 2).map(([k, v]) => (
                        <div key={k} className="text-[8px] bg-muted px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground truncate max-w-[100px]">
                            {k}={v}
                        </div>
                    ))}
                    {Object.keys(data.labels || {}).length > 2 && (
                        <div className="text-[8px] text-primary font-black">+ {Object.keys(data.labels).length - 2} more</div>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-background" />
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

    const fetchTrace = useCallback(async () => {
        if (!kind || !name) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/network/trace/${kind}/${namespace || 'default'}/${name}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            
            // Layout logic: columns based on resource type
            const columns = {
                'External': 0,
                'Ingress': 1,
                'Service': 2,
                'Endpoint': 3,
                'Pod': 4,
            };

            const nodePositions = {};
            const colCounts = {};

            const newNodes = data.nodes.map((n, i) => {
                const col = columns[n.type] ?? 2;
                colCounts[col] = (colCounts[col] || 0) + 1;
                
                const x = col * 350;
                const y = (colCounts[col] - 1) * 150;
                
                const id = `${n.type}:${n.name}`;
                nodePositions[id] = { x, y };

                return {
                    id,
                    type: 'resource',
                    position: { x, y },
                    data: { ...n },
                };
            });

            const newEdges = data.edges.map((e, i) => ({
                id: `e${i}`,
                source: e.from,
                target: e.to,
                label: e.message,
                animated: e.healthy,
                style: { 
                    stroke: e.healthy ? '#10b981' : '#ef4444', 
                    strokeWidth: 3,
                    opacity: 0.8
                },
                labelStyle: { 
                    fill: e.healthy ? '#10b981' : '#ef4444', 
                    fontWeight: 900, 
                    fontSize: '10px',
                    textTransform: 'uppercase'
                },
                labelBgPadding: [8, 4],
                labelBgBorderRadius: 4,
                labelBgStyle: { fill: 'var(--background)', fillOpacity: 0.8 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: e.healthy ? '#10b981' : '#ef4444',
                },
            }));

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
        <div className="flex flex-col flex-1 h-[700px] gap-4">
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-2"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <icons.activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight text-foreground uppercase italic">Network Flow Trace</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Interactive Topology</p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchTrace} 
                    className="rounded-xl border-border/50 font-black uppercase tracking-widest text-[10px] h-10 px-4"
                >
                    <icons.refresh size={14} className={cn("mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </motion.div>

            <div className="flex-1 bg-card/30 border border-border/50 rounded-[2rem] overflow-hidden relative shadow-2xl backdrop-blur-sm">
                {loading && !nodes.length ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                            <icons.refresh size={32} className="text-primary" />
                        </motion.div>
                        <p className="mt-4 animate-pulse font-black uppercase tracking-widest text-xs opacity-60">Analyzing topology...</p>
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center">
                        <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                            <icons.alert size={32} />
                        </div>
                        <h3 className="text-xl font-black text-destructive uppercase italic mb-2">Trace Failed</h3>
                        <p className="text-muted-foreground text-sm max-w-md font-medium">{error}</p>
                        <Button onClick={fetchTrace} variant="destructive" className="mt-6 rounded-xl font-black uppercase tracking-widest text-xs">Retry</Button>
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        fitView
                        className="transition-opacity duration-500"
                    >
                        <Background color="var(--primary)" opacity={0.05} gap={20} />
                        <Controls className="bg-card border-border fill-foreground" />
                        <Panel position="top-left" className="flex gap-6 p-4 bg-background/80 backdrop-blur-md border border-border/50 rounded-2xl m-4 shadow-xl pointer-events-none select-none">
                            <div className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground">Traffic Healthy</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground">Error Detected</span>
                            </div>
                        </Panel>
                    </ReactFlow>
                )}
            </div>
            
            <div className="flex items-center gap-4 justify-center py-2">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
                    Interact with nodes to inspect network mapping
                </p>
            </div>
        </div>
    );
}
