import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Nodes from './components/Nodes';
import Settings from './components/Settings';
import Console from './components/Console';
import AdminPanel from './components/AdminPanel';
import ResourceList from './components/ResourceList';
import ResourceDetails from './components/ResourceDetails';
import About from './components/About';
import { useTranslation } from './SettingsContext';

import logo from './assets/k-view-logo.png';
import background from './assets/background.png';

import {
    LayoutDashboard, Server, Terminal, LogOut, FlaskConical, ShieldAlert,
    Boxes, Package, GitBranch, RefreshCw, Clock, Network, Globe,
    FileText, Lock, Database, Puzzle, ChevronDown, ChevronRight,
    Shield, Key, User, Users, Link, AlertTriangle, Globe2, Activity,
    Settings as SettingsIcon, Moon, Sun, Palette, Info, PanelLeftClose, PanelLeftOpen,
    Layers, Repeat, ShieldCheck
} from 'lucide-react';

// ── Collapsible section ────────────────────────────────────────────────────
function Section({ label, children, defaultOpen = true, isCollapsed }) {
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

    if (isCollapsed) {
        return <div className="flex flex-col items-center gap-0.5 mb-1">{children}</div>;
    }

    return (
        <div className="transition-all duration-300">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between px-2 pt-3 pb-1 group"
            >
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors block">
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
function NavItem({ href, icon: Icon, label, active, isCollapsed }) {
    return (
        <a
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group
        ${active
                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-indigo-500/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-white)]'}
                ${isCollapsed ? 'justify-center w-11 h-11 px-0' : 'w-full'}`}
            title={isCollapsed ? label : ''}
        >
            <Icon size={isCollapsed ? 20 : 16} className={`${active ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-white)]'} transition-colors shrink-0`} />
            {!isCollapsed && (
                <>
                    <span className="flex-1 truncate tracking-tight">{label}</span>
                    {active && <ChevronRight size={12} className="text-white/70" />}
                </>
            )}
        </a>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ user, onLogout, theme, setTheme, isCollapsed, setIsCollapsed }) {
    const { pathname: p } = useLocation();
    const { t } = useTranslation();

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col hidden md:flex h-full shrink-0 transition-all duration-300 ease-in-out shadow-2xl z-20 overflow-hidden`}>
            {/* Logo + Toggle */}
            <div className={`border-b border-[var(--border-color)] flex items-center transition-all duration-300 min-h-[64px] py-2 ${isCollapsed ? 'px-0 justify-center' : 'px-4 justify-between gap-2'}`}>
                {!isCollapsed ? (
                    <div className="flex-1 flex justify-center overflow-hidden">
                        <img src={logo} alt="K-View Logo" className="w-44 h-auto opacity-95 transition-all duration-300 transform origin-left" />
                    </div>
                ) : null}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-white)] hover:bg-[var(--sidebar-hover)] transition-all active:scale-90 shrink-0
                        ${isCollapsed ? 'hover:bg-[var(--accent)]/10 text-[var(--accent)]' : ''}`}
                    title={isCollapsed ? "Expand menu" : "Collapse menu"}
                >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>

            {/* Scrollable nav */}
            <nav className={`flex-1 overflow-y-auto mt-2 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-2 pb-2'}`}>

                {/* Dashboard — standalone, no section */}
                <div className={`pb-1 ${isCollapsed ? 'flex flex-col items-center gap-0.5 mb-1' : 'space-y-0.5'}`}>
                    <NavItem href="/" icon={LayoutDashboard} label={t('dashboard')} active={p === '/'} isCollapsed={isCollapsed} />
                </div>

                <Section label={t('workloads')} defaultOpen={false} isCollapsed={isCollapsed}>
                    <NavItem href="/workloads/cronjobs" icon={Clock} label={t('cronjobs')} active={p === '/workloads/cronjobs'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/daemonsets" icon={RefreshCw} label={t('daemonsets')} active={p === '/workloads/daemonsets'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/deployments" icon={Package} label={t('deployments')} active={p === '/workloads/deployments'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/jobs" icon={Database} label={t('jobs')} active={p === '/workloads/jobs'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/pods" icon={Boxes} label={t('pods')} active={p === '/workloads/pods'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/replicasets" icon={Layers} label={t('replicasets')} active={p === '/workloads/replicasets'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/replicationcontrollers" icon={Repeat} label={t('replicationcontrollers')} active={p === '/workloads/replicationcontrollers'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/statefulsets" icon={GitBranch} label={t('statefulsets')} active={p === '/workloads/statefulsets'} isCollapsed={isCollapsed} />
                </Section>

                <Section label={t('network')} defaultOpen={false} isCollapsed={isCollapsed}>
                    <NavItem href="/cluster/ingress-classes" icon={Globe} label={t('ingress_classes')} active={p === '/cluster/ingress-classes'} isCollapsed={isCollapsed} />
                    <NavItem href="/network/ingresses" icon={Globe} label={t('ingresses')} active={p === '/network/ingresses'} isCollapsed={isCollapsed} />
                    <NavItem href="/network/services" icon={Network} label={t('services')} active={p === '/network/services'} isCollapsed={isCollapsed} />
                </Section>

                <Section label={t('config')} defaultOpen={false} isCollapsed={isCollapsed}>
                    <NavItem href="/config/configmaps" icon={FileText} label={t('configmaps')} active={p === '/config/configmaps'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/pvcs" icon={Database} label={t('pvc')} active={p === '/config/pvcs'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/secrets" icon={Lock} label={t('secrets')} active={p === '/config/secrets'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/storage-classes" icon={Database} label={t('storageclasses')} active={p === '/config/storage-classes'} isCollapsed={isCollapsed} />
                </Section>

                <Section label={t('cluster')} defaultOpen={false} isCollapsed={isCollapsed}>
                    <NavItem href="/cluster/cluster-role-bindings" icon={Link} label={t('clusterrolebindings')} active={p === '/cluster/cluster-role-bindings'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/cluster-roles" icon={Shield} label={t('clusterroles')} active={p === '/cluster/cluster-roles'} isCollapsed={isCollapsed} />
                    <NavItem href="/crd" icon={Puzzle} label={t('crd')} active={p === '/crd'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/events" icon={Activity} label={t('events')} active={p === '/cluster/events'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/namespaces" icon={Globe2} label={t('namespaces')} active={p === '/cluster/namespaces'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/network-policies" icon={AlertTriangle} label={t('network_policies')} active={p === '/cluster/network-policies'} isCollapsed={isCollapsed} />
                    <NavItem href="/nodes" icon={Server} label={t('nodes')} active={p === '/nodes'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/pvs" icon={Database} label={t('pv')} active={p === '/config/pvs'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/role-bindings" icon={Link} label={t('rolebindings')} active={p === '/cluster/role-bindings'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/roles" icon={Key} label={t('roles')} active={p === '/cluster/roles'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/service-accounts" icon={Users} label={t('serviceaccounts')} active={p === '/cluster/service-accounts'} isCollapsed={isCollapsed} />
                </Section>

                <Section label={t('tools')} defaultOpen={false} isCollapsed={isCollapsed}>
                    <NavItem href="/about" icon={Info} label={t('about')} active={p === '/about'} isCollapsed={isCollapsed} />
                    <NavItem href="/console" icon={Terminal} label={t('console')} active={p === '/console'} isCollapsed={isCollapsed} />
                    <NavItem href="/settings" icon={SettingsIcon} label={t('settings')} active={p === '/settings'} isCollapsed={isCollapsed} />
                </Section>

            </nav>

            {/* Bottom: admin + mode label + logout */}
            <div className={`border-t border-[var(--border-color)] transition-all duration-300 ${isCollapsed ? 'py-3 px-2 flex flex-col items-center gap-4' : 'px-3 py-3 space-y-2'}`}>
                {!isCollapsed && (user.role === 'kview-cluster-admin' || user.role === 'admin') && (
                    <a
                        href="/access"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-bold transition-all w-full
                ${p === '/access'
                                ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30 shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-colors'}`}
                    >
                        <ShieldAlert size={16} /> Admin Panel
                    </a>
                )}

                <div className={`flex items-center justify-between gap-2 px-1 ${isCollapsed ? 'flex-col gap-4 w-full items-center' : ''}`}>
                    {user.devMode ? (
                        <div className={`flex items-center gap-1.5 text-[11px] font-black text-green-500 tracking-tight uppercase ${isCollapsed ? 'flex-col items-center' : ''}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            {!isCollapsed ? 'DEVELOPMENT' : <span className="text-[8px]">DEV</span>}
                        </div>
                    ) : (
                        <div className={`flex items-center gap-1.5 text-[11px] font-black text-red-600 tracking-tight uppercase ${isCollapsed ? 'flex-col items-center' : ''}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
                            {!isCollapsed ? 'PRODUCTION' : <span className="text-[8px]">PROD</span>}
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        className={`p-1.5 rounded-xl bg-red-600/20 text-red-500 border border-red-600/40 hover:bg-red-600/30 hover:text-red-400 hover:border-red-600/60 transition-all active:scale-90 flex items-center justify-center group shadow-sm ${isCollapsed ? 'w-10 h-10' : ''}`}
                        title="Logout"
                    >
                        <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

// ── Global Fetch Interceptor ───────────────────────────────────────────────
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    let [resource, config] = args;
    const token = localStorage.getItem('token');

    // Only intercept API calls
    if (token && typeof resource === 'string' && resource.startsWith('/api/')) {
        config = config || {};
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const response = await originalFetch(resource, config);
    // If we're unauthorized, force clear token and prompt login
    if (response.status === 401 && resource !== '/api/auth/me') {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    return response;
};

// ── App ────────────────────────────────────────────────────────────────────
function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(() => localStorage.getItem('kview-theme') || 'default');
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('kview-sidebar-collapsed')) ?? false; }
        catch { return false; }
    });

    useEffect(() => {
        localStorage.setItem('kview-sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

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
        localStorage.removeItem('token');
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
                {user && (
                    <Sidebar
                        user={user}
                        onLogout={handleLogout}
                        theme={theme}
                        setTheme={setTheme}
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                    />
                )}
                <main className="flex-1 overflow-auto flex flex-col">
                    <Routes>
                        {/* Auth */}
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

                        {/* Top-level */}
                        <Route path="/" element={protect(<Dashboard isCollapsed={isCollapsed} />)} />
                        <Route path="/nodes" element={protect(<Nodes />)} />
                        <Route path="/console" element={protect(<Console />)} />
                        <Route path="/about" element={protect(<About />)} />
                        <Route path="/settings" element={protect(<Settings theme={theme} setTheme={setTheme} />)} />

                        {/* Workloads */}
                        <Route path="/workloads/pods" element={protect(<ResourceList kind="pods" />)} />
                        <Route path="/workloads/deployments" element={protect(<ResourceList kind="deployments" />)} />
                        <Route path="/workloads/statefulsets" element={protect(<ResourceList kind="statefulsets" />)} />
                        <Route path="/workloads/daemonsets" element={protect(<ResourceList kind="daemonsets" />)} />
                        <Route path="/workloads/jobs" element={protect(<ResourceList kind="jobs" />)} />
                        <Route path="/workloads/cronjobs" element={protect(<ResourceList kind="cronjobs" />)} />
                        <Route path="/workloads/replicasets" element={protect(<ResourceList kind="replicasets" />)} />
                        <Route path="/workloads/replicationcontrollers" element={protect(<ResourceList kind="replicationcontrollers" />)} />

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
                        <Route path="/cluster/events" element={protect(<ResourceList kind="events" />)} />
                        <Route path="/cluster/ingress-classes" element={protect(<ResourceList kind="ingress-classes" />)} />
                        <Route path="/cluster/network-policies" element={protect(<ResourceList kind="network-policies" />)} />
                        <Route path="/cluster/role-bindings" element={protect(<ResourceList kind="role-bindings" />)} />
                        <Route path="/cluster/roles" element={protect(<ResourceList kind="roles" />)} />
                        <Route path="/cluster/service-accounts" element={protect(<ResourceList kind="service-accounts" />)} />

                        <Route path="/:kind/:namespace/:name" element={protect(<ResourceDetails user={user} />)} />
                        <Route path="/access" element={user && (user.role === 'kview-cluster-admin' || user.role === 'admin') ? protect(<AdminPanel />) : <Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
