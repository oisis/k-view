import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Nodes from './components/Nodes';
import Console from './components/Console';
import AdminPanel from './components/AdminPanel';
import ResourceList from './components/ResourceList';
import ResourceDetails from './components/ResourceDetails';

import logo from './assets/k-view-logo.png';
import background from './assets/background.png';

import {
    LayoutDashboard, Server, Terminal, LogOut, FlaskConical, ShieldAlert,
    Boxes, Package, GitBranch, RefreshCw, Clock, Network, Globe,
    FileText, Lock, Database, Puzzle, ChevronDown, ChevronRight,
    Shield, Key, Users, Link, AlertTriangle, Globe2, Activity,
    Settings, Moon, Sun, Palette
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
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    {label}
                </span>
                {open
                    ? <ChevronDown size={10} className="text-[var(--text-muted)]" />
                    : <ChevronRight size={10} className="text-[var(--text-muted)]" />
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
                    : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-white)]'}`}
        >
            <Icon size={14} className="shrink-0" />
            <span className="flex-1 truncate text-[14px]">{label}</span>
            {active && <ChevronRight size={10} className="text-blue-400" />}
        </a>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ user, onLogout, theme, setTheme }) {
    const { pathname: p } = useLocation();

    return (
        <aside className="w-56 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex-col hidden md:flex h-full shrink-0 transition-colors duration-200">
            {/* Logo */}
            <div className="border-b border-[var(--border-color)] flex flex-col items-center">
                <img src={logo} alt="K-View Logo" className="w-44 h-auto opacity-95" />
            </div>

            {/* Scrollable nav */}
            <nav className="flex-1 overflow-y-auto px-2 pb-2 mt-2">

                {/* Dashboard — standalone, no section */}
                <div className="pb-1 space-y-0.5">
                    <NavItem href="/" icon={LayoutDashboard} label="Dashboard" active={p === '/'} />
                </div>

                <Section label="Workloads" defaultOpen={false}>
                    <NavItem href="/workloads/pods" icon={Boxes} label="Pods" active={p === '/workloads/pods'} />
                    <NavItem href="/workloads/deployments" icon={Package} label="Deployments" active={p === '/workloads/deployments'} />
                    <NavItem href="/workloads/statefulsets" icon={GitBranch} label="StatefulSets" active={p === '/workloads/statefulsets'} />
                    <NavItem href="/workloads/daemonsets" icon={RefreshCw} label="DaemonSets" active={p === '/workloads/daemonsets'} />
                    <NavItem href="/workloads/jobs" icon={Database} label="Jobs" active={p === '/workloads/jobs'} />
                    <NavItem href="/workloads/cronjobs" icon={Clock} label="CronJobs" active={p === '/workloads/cronjobs'} />
                </Section>

                <Section label="Services" defaultOpen={false}>
                    <NavItem href="/network/services" icon={Network} label="Services" active={p === '/network/services'} />
                    <NavItem href="/network/ingresses" icon={Globe} label="Ingresses" active={p === '/network/ingresses'} />
                </Section>

                <Section label="Config &amp; Storage" defaultOpen={false}>
                    <NavItem href="/config/configmaps" icon={FileText} label="ConfigMaps" active={p === '/config/configmaps'} />
                    <NavItem href="/config/secrets" icon={Lock} label="Secrets" active={p === '/config/secrets'} />
                    <NavItem href="/config/pvcs" icon={Database} label="PVCs" active={p === '/config/pvcs'} />
                </Section>

                <Section label="Cluster" defaultOpen={false}>
                    <NavItem href="/cluster/namespaces" icon={Globe2} label="Namespaces" active={p === '/cluster/namespaces'} />
                    <NavItem href="/nodes" icon={Server} label="Nodes" active={p === '/nodes'} />
                    <NavItem href="/cluster/ingress-classes" icon={Globe} label="Ingress Classes" active={p === '/cluster/ingress-classes'} />
                    <NavItem href="/config/storage-classes" icon={Database} label="Storage Classes" active={p === '/config/storage-classes'} />
                    <NavItem href="/crd" icon={Puzzle} label="Custom Resources" active={p === '/crd'} />
                    <NavItem href="/cluster/cluster-role-bindings" icon={Link} label="Cluster Role Bindings" active={p === '/cluster/cluster-role-bindings'} />
                    <NavItem href="/cluster/cluster-roles" icon={Shield} label="Cluster Roles" active={p === '/cluster/cluster-roles'} />
                    <NavItem href="/cluster/network-policies" icon={AlertTriangle} label="Network Policies" active={p === '/cluster/network-policies'} />
                    <NavItem href="/config/pvs" icon={Database} label="Persistent Volumes" active={p === '/config/pvs'} />
                    <NavItem href="/cluster/role-bindings" icon={Key} label="Role Bindings" active={p === '/cluster/role-bindings'} />
                    <NavItem href="/cluster/roles" icon={Key} label="Roles" active={p === '/cluster/roles'} />
                    <NavItem href="/cluster/service-accounts" icon={Users} label="Service Accounts" active={p === '/cluster/service-accounts'} />
                </Section>

                <Section label="Tools" defaultOpen={false}>
                    <NavItem href="/console" icon={Terminal} label="Console" active={p === '/console'} />
                </Section>

                {/* Settings Section at the bottom of the nav list */}
                <div className="mt-auto">
                    <Section label="Settings" defaultOpen={false}>
                        <div className="px-2 py-2 space-y-3">
                            <div>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">Interface Theme</p>
                                <div className="grid grid-cols-3 gap-1">
                                    <button
                                        onClick={() => setTheme('default')}
                                        className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${theme === 'default' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-secondary)]'}`}
                                        title="Default Dark"
                                    >
                                        <Moon size={14} />
                                        <span className="text-[9px] mt-1">Default</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-secondary)]'}`}
                                        title="Light (macOS)"
                                    >
                                        <Sun size={14} />
                                        <span className="text-[9px] mt-1">Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('black')}
                                        className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${theme === 'black' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-[var(--border-color)] hover:border-[var(--text-muted)] text-[var(--text-secondary)]'}`}
                                        title="Pure Black"
                                    >
                                        <Palette size={14} />
                                        <span className="text-[9px] mt-1">Black</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

            </nav>

            {/* Bottom: admin + mode label + logout */}
            <div className="px-3 py-3 border-t border-[var(--border-color)] space-y-1.5">
                {(user.role === 'kview-cluster-admin' || user.role === 'admin') && (
                    <a
                        href="/access"
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] transition-colors w-full
                ${p === '/access'
                                ? 'bg-blue-900/40 text-blue-300 border border-blue-800'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-white)] border border-transparent'}`}
                    >
                        <ShieldAlert size={14} /> Access Overview
                    </a>
                )}

                {/* Env Status Label moved here */}
                {user.devMode ? (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-400 py-1 tracking-[0.2em] uppercase">
                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        DEV MODE
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-red-500 py-1 tracking-[0.2em] uppercase">
                        <div className="w-1 h-1 rounded-full bg-red-600" />
                        PROD MODE
                    </div>
                )}

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 justify-center py-1.5 rounded text-[13px] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-white)] transition-colors border border-[var(--border-color)]"
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
    const [theme, setTheme] = useState(() => localStorage.getItem('kview-theme') || 'default');

    useEffect(() => {
        // Apply theme class to the root <html> element for reliable CSS variable inheritance
        const root = document.documentElement;
        root.classList.remove('theme-default', 'theme-light', 'theme-black');
        root.classList.add(`theme-${theme}`);
        localStorage.setItem('kview-theme', theme);
    }, [theme]);

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
        return <div className="flex items-center justify-center min-h-screen text-[var(--text-secondary)] bg-[var(--bg-main)]">Loading...</div>;
    }

    const protect = (el) => user ? el : <Navigate to="/login" />;

    return (
        <Router>
            <div className={`flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative overflow-hidden transition-colors duration-200`}>
                {user && (
                    <>
                        {/* Global Background Wallpaper */}
                        <div
                            className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
                            style={{
                                backgroundImage: `url(${background})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                opacity: 'var(--wallpaper-opacity)',
                                filter: `grayscale(100%) brightness(var(--wallpaper-brightness))`,
                            }}
                        />
                        <Sidebar user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
                    </>
                )}
                <main className="flex-1 overflow-auto flex flex-col relative z-10">
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
                        <Route path="/config/storage-classes" element={protect(<ResourceList kind="storage-classes" />)} />

                        {/* CRD */}
                        <Route path="/crd" element={protect(<ResourceList kind="crds" />)} />

                        {/* Cluster */}
                        <Route path="/cluster/cluster-role-bindings" element={protect(<ResourceList kind="cluster-role-bindings" />)} />
                        <Route path="/cluster/cluster-roles" element={protect(<ResourceList kind="cluster-roles" />)} />
                        <Route path="/cluster/namespaces" element={protect(<ResourceList kind="namespaces" />)} />
                        <Route path="/cluster/ingress-classes" element={protect(<ResourceList kind="ingress-classes" />)} />
                        <Route path="/cluster/network-policies" element={protect(<ResourceList kind="network-policies" />)} />
                        <Route path="/cluster/role-bindings" element={protect(<ResourceList kind="role-bindings" />)} />
                        <Route path="/cluster/roles" element={protect(<ResourceList kind="roles" />)} />
                        <Route path="/cluster/service-accounts" element={protect(<ResourceList kind="service-accounts" />)} />

                        <Route path="/:kind/:namespace/:name" element={protect(<ResourceDetails />)} />
                        <Route path="/access" element={user && (user.role === 'kview-cluster-admin' || user.role === 'admin') ? protect(<AdminPanel />) : <Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
