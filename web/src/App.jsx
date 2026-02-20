import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Nodes from './components/Nodes';
import Console from './components/Console';
import AdminPanel from './components/AdminPanel';
import ResourceList from './components/ResourceList';
import {
    LayoutDashboard, Server, Terminal, LogOut, FlaskConical, ShieldAlert,
    Boxes, Package, GitBranch, RefreshCw, Clock, Network, Globe,
    FileText, Lock, Database, Puzzle, ChevronDown, ChevronRight,
    Shield, Key, Users, Link, AlertTriangle, Globe2
} from 'lucide-react';

// ── Collapsible section ────────────────────────────────────────────────────
function Section({ label, children, defaultOpen = true }) {
    const key = `sidebar-section-${label}`;
    const [open, setOpen] = useState(() => {
        try { return JSON.parse(localStorage.getItem(key)) ?? defaultOpen; }
        catch { return defaultOpen; }
    });

    const toggle = () => {
        setOpen(v => {
            try { localStorage.setItem(key, JSON.stringify(!v)); } catch { }
            return !v;
        });
    };

    return (
        <div>
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-2 pt-3 pb-1 group"
            >
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 group-hover:text-gray-400 transition-colors">
                    {label}
                </span>
                {open
                    ? <ChevronDown size={10} className="text-gray-600" />
                    : <ChevronRight size={10} className="text-gray-600" />
                }
            </button>
            {open && <div className="space-y-0.5">{children}</div>}
        </div>
    );
}

// ── Nav item ───────────────────────────────────────────────────────────────
function NavItem({ href, icon: Icon, label, active }) {
    return (
        <a
            href={href}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors
        ${active
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-800/40'
                    : 'text-gray-400 hover:bg-gray-700/60 hover:text-white'}`}
        >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1 truncate text-[13px]">{label}</span>
            {active && <ChevronRight size={10} className="text-blue-400" />}
        </a>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ user, onLogout }) {
    const { pathname: p } = useLocation();

    return (
        <aside className="w-56 bg-gray-800 border-r border-gray-700 flex-col hidden md:flex h-full shrink-0">
            {/* Logo */}
            <div className="px-4 py-3 border-b border-gray-700">
                <h1 className="text-lg font-bold text-blue-400 tracking-tight">K-View</h1>
                <p className="text-[11px] text-gray-500">Kubernetes Dashboard</p>
                {user.devMode && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-yellow-400 bg-yellow-900/30 border border-yellow-700/50 rounded px-2 py-0.5">
                        <FlaskConical size={10} /> DEV MODE
                    </div>
                )}
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto px-2 pb-2">

                {/* Dashboard — standalone, no section */}
                <div className="pt-2 pb-1 space-y-0.5">
                    <NavItem href="/" icon={LayoutDashboard} label="Dashboard" active={p === '/'} />
                    <NavItem href="/console" icon={Terminal} label="Console" active={p === '/console'} />
                </div>

                <Section label="Workloads">
                    <NavItem href="/workloads/pods" icon={Boxes} label="Pods" active={p === '/workloads/pods'} />
                    <NavItem href="/workloads/deployments" icon={Package} label="Deployments" active={p === '/workloads/deployments'} />
                    <NavItem href="/workloads/statefulsets" icon={GitBranch} label="StatefulSets" active={p === '/workloads/statefulsets'} />
                    <NavItem href="/workloads/daemonsets" icon={RefreshCw} label="DaemonSets" active={p === '/workloads/daemonsets'} />
                    <NavItem href="/workloads/jobs" icon={Database} label="Jobs" active={p === '/workloads/jobs'} />
                    <NavItem href="/workloads/cronjobs" icon={Clock} label="CronJobs" active={p === '/workloads/cronjobs'} />
                </Section>

                <Section label="Services">
                    <NavItem href="/network/services" icon={Network} label="Services" active={p === '/network/services'} />
                    <NavItem href="/network/ingresses" icon={Globe} label="Ingresses" active={p === '/network/ingresses'} />
                </Section>

                <Section label="Config &amp; Storage">
                    <NavItem href="/config/configmaps" icon={FileText} label="ConfigMaps" active={p === '/config/configmaps'} />
                    <NavItem href="/config/secrets" icon={Lock} label="Secrets" active={p === '/config/secrets'} />
                    <NavItem href="/config/pvcs" icon={Database} label="PVCs" active={p === '/config/pvcs'} />
                </Section>

                <Section label="CRD">
                    <NavItem href="/crd" icon={Puzzle} label="Custom Resources" active={p === '/crd'} />
                </Section>

                {/* Cluster — at the bottom */}
                <Section label="Cluster" defaultOpen={false}>
                    <NavItem href="/cluster/cluster-role-bindings" icon={Link} label="Cluster Role Bindings" active={p === '/cluster/cluster-role-bindings'} />
                    <NavItem href="/cluster/cluster-roles" icon={Shield} label="Cluster Roles" active={p === '/cluster/cluster-roles'} />
                    <NavItem href="/cluster/namespaces" icon={Globe2} label="Namespaces" active={p === '/cluster/namespaces'} />
                    <NavItem href="/cluster/network-policies" icon={AlertTriangle} label="Network Policies" active={p === '/cluster/network-policies'} />
                    <NavItem href="/nodes" icon={Server} label="Nodes" active={p === '/nodes'} />
                    <NavItem href="/config/pvs" icon={Database} label="Persistent Volumes" active={p === '/config/pvs'} />
                    <NavItem href="/cluster/role-bindings" icon={Key} label="Role Bindings" active={p === '/cluster/role-bindings'} />
                    <NavItem href="/cluster/roles" icon={Key} label="Roles" active={p === '/cluster/roles'} />
                    <NavItem href="/cluster/service-accounts" icon={Users} label="Service Accounts" active={p === '/cluster/service-accounts'} />
                </Section>

            </nav>

            {/* Bottom: admin + logout */}
            <div className="px-3 py-3 border-t border-gray-700 space-y-1.5">
                <div className="text-[11px] text-gray-500 truncate px-1">{user.email}</div>

                {user.role === 'admin' && (
                    <a
                        href="/admin"
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] transition-colors w-full
              ${p === '/admin'
                                ? 'bg-red-900/50 text-red-300 border border-red-700'
                                : 'text-red-400 hover:bg-red-900/30 border border-red-900/40'}`}
                    >
                        <ShieldAlert size={14} /> Admin Panel
                    </a>
                )}

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 justify-center py-1.5 rounded text-[13px] bg-gray-700/40 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </aside>
    );
}

// ── App ────────────────────────────────────────────────────────────────────
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => setUser(d))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/login';
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
    }

    const protect = (el) => user ? el : <Navigate to="/login" />;

    return (
        <Router>
            <div className="flex h-screen bg-gray-900 text-gray-100">
                {user && <Sidebar user={user} onLogout={handleLogout} />}
                <main className="flex-1 overflow-auto flex flex-col">
                    <Routes>
                        {/* Auth */}
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

                        {/* Top-level */}
                        <Route path="/" element={protect(<Dashboard />)} />
                        <Route path="/nodes" element={protect(<Nodes />)} />
                        <Route path="/console" element={protect(<Console />)} />

                        {/* Workloads */}
                        <Route path="/workloads/pods" element={protect(<ResourceList kind="pods" />)} />
                        <Route path="/workloads/deployments" element={protect(<ResourceList kind="deployments" />)} />
                        <Route path="/workloads/statefulsets" element={protect(<ResourceList kind="statefulsets" />)} />
                        <Route path="/workloads/daemonsets" element={protect(<ResourceList kind="daemonsets" />)} />
                        <Route path="/workloads/jobs" element={protect(<ResourceList kind="jobs" />)} />
                        <Route path="/workloads/cronjobs" element={protect(<ResourceList kind="cronjobs" />)} />

                        {/* Services / Networking */}
                        <Route path="/network/services" element={protect(<ResourceList kind="services" />)} />
                        <Route path="/network/ingresses" element={protect(<ResourceList kind="ingresses" />)} />

                        {/* Config & Storage */}
                        <Route path="/config/configmaps" element={protect(<ResourceList kind="configmaps" />)} />
                        <Route path="/config/secrets" element={protect(<ResourceList kind="secrets" />)} />
                        <Route path="/config/pvcs" element={protect(<ResourceList kind="pvcs" />)} />
                        <Route path="/config/pvs" element={protect(<ResourceList kind="pvs" />)} />

                        {/* CRD */}
                        <Route path="/crd" element={protect(<ResourceList kind="crds" />)} />

                        {/* Cluster */}
                        <Route path="/cluster/cluster-role-bindings" element={protect(<ResourceList kind="cluster-role-bindings" />)} />
                        <Route path="/cluster/cluster-roles" element={protect(<ResourceList kind="cluster-roles" />)} />
                        <Route path="/cluster/namespaces" element={protect(<ResourceList kind="namespaces" />)} />
                        <Route path="/cluster/network-policies" element={protect(<ResourceList kind="network-policies" />)} />
                        <Route path="/cluster/role-bindings" element={protect(<ResourceList kind="role-bindings" />)} />
                        <Route path="/cluster/roles" element={protect(<ResourceList kind="roles" />)} />
                        <Route path="/cluster/service-accounts" element={protect(<ResourceList kind="service-accounts" />)} />

                        {/* Admin */}
                        <Route
                            path="/admin"
                            element={user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
