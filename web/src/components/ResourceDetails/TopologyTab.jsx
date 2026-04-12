import React, { useEffect, useState, useCallback, memo } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState,
    MarkerType,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useTheme } from '../../ThemeContext';
import { useNavigate } from 'react-router-dom';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 60;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (which is center-based) to top-left
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const CustomNode = memo(({ data }) => {
    const { icons } = useTheme();
    const Icon = icons[data.kind.toLowerCase()] || icons.box;
    const ShieldIcon = icons.shield_check;

    return (
        <div className={`px-4 py-3 rounded-xl border-2 shadow-lg min-w-[200px] transition-all bg-card ${data.isRoot ? 'border-primary ring-4 ring-primary/10' : 'border-border'} ${data.isProtected ? 'ring-2 ring-emerald-500/20' : ''}`}>
            <Handle 
                type="target" 
                position={Position.Top} 
                style={{ background: 'var(--primary)', width: '8px', height: '8px', border: '2px solid var(--card)' }}
            />
            <div className="flex items-center gap-3 relative">
                <div className={`p-2 rounded-lg ${data.isRoot ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{data.kind}</span>
                        {data.isProtected && (
                            <div className="text-emerald-500" title="Protected by NetworkPolicy">
                                <ShieldIcon size={12} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <span className="text-sm font-bold truncate text-foreground">{data.name}</span>
                </div>
            </div>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                style={{ background: 'var(--primary)', width: '8px', height: '8px', border: '2px solid var(--card)' }}
            />
        </div>
    );
});

const nodeTypes = {
    custom: CustomNode,
};

export default function TopologyTab({ kind, namespace, name, t }) {
    const { icons } = useTheme();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchTopology = useCallback(async () => {
        setLoading(true);
        try {
            const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
            const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/topology`);
            if (res.ok) {
                const data = await res.json();
                
                const protectedPodIds = new Set(
                    data.edges
                        .filter(e => e.type === 'security')
                        .map(e => e.target)
                );

                const initialNodes = data.nodes.map(n => ({
                    id: n.id,
                    type: 'custom',
                    data: { 
                        ...n, 
                        isRoot: n.name === name && n.kind.toLowerCase() === kind.toLowerCase().replace(/s$/, '') ,
                        isProtected: protectedPodIds.has(n.id)
                    },
                    position: { x: 0, y: 0 },
                }));

                const initialEdges = data.edges.map(e => {
                    let strokeColor = '#3b82f6'; // Default blue
                    let animated = true;
                    let strokeDasharray = null;

                    if (e.type === 'security') {
                        strokeColor = '#10b981'; // Emerald
                        strokeDasharray = '5,5';
                    } else if (e.type === 'scaling') {
                        strokeColor = '#f59e0b'; // Amber
                    }

                    return {
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        animated: animated,
                        style: { 
                            stroke: strokeColor, 
                            strokeWidth: 3,
                            strokeDasharray: strokeDasharray
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: strokeColor,
                        },
                    };
                });

                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                    initialNodes,
                    initialEdges
                );

                setNodes([...layoutedNodes]);
                setEdges([...layoutedEdges]);
            }
        } catch (e) {
            console.error('Failed to fetch topology:', e);
        } finally {
            setLoading(false);
        }
    }, [kind, namespace, name]);

    useEffect(() => {
        fetchTopology();
    }, [fetchTopology]);

    const onNodeClick = useCallback((event, node) => {
        const { kind, namespace, name } = node.data;
        // Map kind back to plural for URL if needed
        let pluralKind = kind;
        if (!pluralKind.endsWith('s')) pluralKind += 's';
        if (pluralKind === 'Ingresss') pluralKind = 'Ingresses';
        
        navigate(`/resources/${pluralKind}/${namespace || '-'}/${name}`);
    }, [navigate]);

    if (loading) {
        return (
            <div className="bg-glass glass rounded-2xl border border-border flex items-center justify-center p-8 min-h-[500px]">
                <icons.refresh size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-glass glass rounded-2xl border border-border h-[600px] overflow-hidden relative shadow-2xl">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.5}
                maxZoom={1.5}
            >
                <Background color="var(--border)" gap={20} />
                <Controls />
            </ReactFlow>
            
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <div className="px-3 py-1.5 bg-card/80 backdrop-blur-md border border-border rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Interactive View
                </div>
                <div className="p-3 bg-card/80 backdrop-blur-md border border-border rounded-lg flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#3b82f6]" />
                        <span className="text-[9px] font-bold uppercase opacity-70">Ownership</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#10b981] border-t border-dashed" />
                        <span className="text-[9px] font-bold uppercase opacity-70">Security (NetPol)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#f59e0b]" />
                        <span className="text-[9px] font-bold uppercase opacity-70">Scaling (HPA)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
