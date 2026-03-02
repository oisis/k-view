import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Nodes from './components/Nodes';
import Settings from './components/Settings';
import Console from './components/Console';
import AdminPanel from './components/AdminPanel';
import ResourceList from './components/ResourceList';
import EventsList from './components/EventsList';
import ResourceDetails from './components/ResourceDetails';
import About from './components/About';
import CreateResourceModal from './components/CreateResourceModal';
import { useTranslation, useSettings } from './SettingsContext';
import { useTheme } from './ThemeContext';

import logo from './assets/k-view-logo.png';
import background from './assets/background.png';

// ── Collapsible section ────────────────────────────────────────────────────
function Section({ id, label, children, defaultOpen = false, isCollapsed, userEmail }) {
    const { icons } = useTheme();
    const scope = userEmail || 'anonymous';
    const key = `sidebar-section-${scope}-${id || label}`;
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
                <span className="text-sm font-bold tracking-wider uppercase text-text-muted group-hover:text-secondary transition-colors block">
                    {label}
                </span>
                {open
                    ? <icons.chevron_down size={10} className="text-text-muted" />
                    : <icons.chevron_right size={10} className="text-text-muted" />
                }
            </button>
            {open && <div className="space-y-0.5">{children}</div>}
        </div>
    );
}

// ── Nav item ───────────────────────────────────────────────────────────────
function NavItem({ href, iconKey, label, active, isCollapsed }) {
    const { icons } = useTheme();
    const Icon = icons[iconKey] || icons.pod;
    
    // Identify cluster-scoped resources to apply a subtle highlight
    const clusterScopedPaths = [
        '/nodes', 
        '/config/pvs', 
        '/config/storage-classes', 
        '/cluster/cluster-role-bindings', 
        '/cluster/cluster-roles', 
        '/cluster/crds', 
        '/cluster/namespaces', 
        '/cluster/ingress-classes'
    ];
    const isClusterResource = clusterScopedPaths.some(p => href === p);

    return (
        <Link
            to={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 group relative
                ${active
                    ? 'bg-accent text-white shadow-lg shadow-indigo-500/20'
                    : `text-secondary hover:bg-[var(--sidebar-hover)] hover:text-primary ${isClusterResource ? 'bg-green-500/10 !bg-opacity-10 border-l-2 border-green-500/40 rounded-l-none' : ''}`}
                ${isCollapsed ? 'justify-center w-11 h-11 px-0' : 'w-full'}`}
            title={isCollapsed ? label : ''}
        >
            <Icon size={isCollapsed ? 20 : 16} className={`${active ? 'text-white' : (isClusterResource ? 'text-green-400' : 'text-text-muted')} group-hover:text-primary transition-colors shrink-0`} />
            {!isCollapsed && (
                <>
                    <span className="flex-1 truncate tracking-tight">{label}</span>
                    {active && <icons.chevron_right size={12} className="text-white/70" />}
                </>
            )}
        </Link>
    );
}

// ── Nav action item ────────────────────────────────────────────────────────
function NavActionButton({ onClick, iconKey, label, isCollapsed }) {
    const { icons } = useTheme();
    const Icon = icons[iconKey] || icons.plus;
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 group
        text-secondary hover:bg-[var(--sidebar-hover)] hover:text-primary
        ${isCollapsed ? 'justify-center w-11 h-11 px-0' : 'w-full text-left'}`}
            title={isCollapsed ? label : ''}
        >
            <Icon size={isCollapsed ? 20 : 16} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
            {!isCollapsed && (
                <span className="flex-1 truncate tracking-tight font-bold text-accent">{label}</span>
            )}
        </button>
    );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ user, onLogout, isCollapsed, setIsCollapsed, onCreateResource }) {
    const { pathname: p } = useLocation();
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { icons, activeTheme } = useTheme();

    const isPathActive = (href) => {
        if (p === href) return true;
        if (href === '/') return p === '/';

        const parts = href.split('/');
        const kind = parts[parts.length - 1]; // e.g. "pods", "crds"

        // Handle CRD vs CRDS naming inconsistency and cluster prefix
        const isCrd = kind === 'crds' || kind === 'crd';
        if (isCrd) {
            return p.startsWith('/crd/') || p.startsWith('/crds/') || p.startsWith('/cluster/crds') || p === '/crd';
        }

        return p.startsWith(`/${kind}/`) || p.startsWith(`/workloads/${kind}`) || p.startsWith(`/network/${kind}`) || p.startsWith(`/config/${kind}`) || p.startsWith(`/cluster/${kind}`);
    };
    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[var(--bg-sidebar)] border-r border-border flex flex-col hidden md:flex h-full shrink-0 transition-all duration-300 ease-in-out shadow-2xl z-20 overflow-hidden`}>
            {/* Header: Logo (left) + Buttons (right stack) */}
            <div className={`border-b border-border flex items-center transition-all duration-300 py-4 ${isCollapsed ? 'flex-col gap-6 px-0' : 'flex-row justify-between px-4 gap-2'}`}>
                
                {/* Logo Area */}
                {!isCollapsed && (
                    <div className="flex-1 flex justify-center overflow-hidden">
                        <img src={logo} alt="K-View Logo" className="w-44 h-auto opacity-95 transition-all duration-300 transform origin-left" />
                    </div>
                )}

                {/* Buttons Vertical Stack */}
                <div className={`flex flex-col ${isCollapsed ? 'gap-6' : 'gap-10'} items-center`}>
                    {/* Logout Button (Red) */}
                    <button
                        onClick={onLogout}
                        className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20 hover:text-red-400 transition-all active:scale-90 flex items-center justify-center shadow-sm w-10 h-10"
                        title={t('logout')}
                    >
                        <icons.logout size={20} />
                    </button>

                    {/* Toggle Button (Green) */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-xl bg-[var(--text-green)]/10 text-[var(--text-green)] border border-[var(--text-green)]/20 hover:bg-[var(--text-green)]/20 transition-all active:scale-90 shrink-0 w-10 h-10"
                        title={isCollapsed ? t('expand_menu') : t('collapse_menu')}
                    >
                        {isCollapsed ? <icons.expand_menu size={20} /> : <icons.collapse_menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Scrollable nav */}
            <nav className={`flex-1 overflow-y-auto mt-2 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-2 pb-2'}`}>

                {/* Dashboard — standalone, no section */}
                <div className={`pb-1 ${isCollapsed ? 'flex flex-col items-center gap-0.5 mb-1' : 'space-y-0.5'}`}>
                    <NavItem href="/" iconKey="dashboard" label={t('dashboard')} active={isPathActive('/')} isCollapsed={isCollapsed} />
                </div>

                <Section id="workloads" label={t('workloads')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/workloads/cronjobs" iconKey="cronjob" label={t('cronjobs')} active={isPathActive('/workloads/cronjobs')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/daemonsets" iconKey="daemonset" label={t('daemonsets')} active={isPathActive('/workloads/daemonsets')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/deployments" iconKey="deployment" label={t('deployments')} active={isPathActive('/workloads/deployments')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/jobs" iconKey="job" label={t('jobs')} active={isPathActive('/workloads/jobs')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/pods" iconKey="pod" label={t('pods')} active={isPathActive('/workloads/pods')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/replicasets" iconKey="replicaset" label={t('replicasets')} active={isPathActive('/workloads/replicasets')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/replicationcontrollers" iconKey="replicationcontroller" label={t('replicationcontrollers')} active={isPathActive('/workloads/replicationcontrollers')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/statefulsets" iconKey="statefulset" label={t('statefulsets')} active={isPathActive('/workloads/statefulsets')} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/hpas" iconKey="hpa" label={t('hpas')} active={isPathActive('/workloads/hpas')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="network" label={t('services')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/cluster/ingress-classes" iconKey="ingressclass" label={t('ingress_classes')} active={isPathActive('/cluster/ingress-classes')} isCollapsed={isCollapsed} />
                    <NavItem href="/network/ingresses" iconKey="ingress" label={t('ingresses')} active={isPathActive('/network/ingresses')} isCollapsed={isCollapsed} />
                    <NavItem href="/network/services" iconKey="service" label={t('services')} active={isPathActive('/network/services')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="config" label={t('config')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/config/configmaps" iconKey="configmap" label={t('configmaps')} active={isPathActive('/config/configmaps')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/pvcs" iconKey="pvc" label={t('pvc')} active={isPathActive('/config/pvcs')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/secrets" iconKey="secret" label={t('secrets')} active={isPathActive('/config/secrets')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/storage-classes" iconKey="storageclass" label={t('storageclasses')} active={isPathActive('/config/storage-classes')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="cluster" label={t('cluster')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/cluster/cluster-role-bindings" iconKey="clusterrolebinding" label={t('clusterrolebindings')} active={isPathActive('/cluster/cluster-role-bindings')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/cluster-roles" iconKey="clusterrole" label={t('clusterroles')} active={isPathActive('/cluster/cluster-roles')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/crds" iconKey="crd" label={t('crd')} active={isPathActive('/cluster/crds')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/events" iconKey="event" label={t('events')} active={isPathActive('/cluster/events')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/namespaces" iconKey="namespace" label={t('namespaces')} active={isPathActive('/cluster/namespaces')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/network-policies" iconKey="networkpolicy" label={t('network_policies')} active={isPathActive('/cluster/network-policies')} isCollapsed={isCollapsed} />
                    <NavItem href="/nodes" iconKey="nodes" label={t('nodes')} active={isPathActive('/nodes')} isCollapsed={isCollapsed} />
                    <NavItem href="/config/pvs" iconKey="pv" label={t('pv')} active={isPathActive('/config/pvs')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/role-bindings" iconKey="rolebinding" label={t('rolebindings')} active={isPathActive('/cluster/role-bindings')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/roles" iconKey="role" label={t('roles')} active={isPathActive('/cluster/roles')} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/service-accounts" iconKey="serviceaccount" label={t('serviceaccounts')} active={isPathActive('/cluster/service-accounts')} isCollapsed={isCollapsed} />
                </Section>

                <Section id="tools" label={t('tools')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavActionButton onClick={onCreateResource} iconKey="plus" label={t('add_resource')} isCollapsed={isCollapsed} />
                    {user.role === 'kview-cluster-admin' && (
                        <NavItem href="/access" iconKey="admin_panel" label={t('admin_panel')} active={isPathActive('/access')} isCollapsed={isCollapsed} />
                    )}
                    <NavItem href="/about" iconKey="about" label={t('about')} active={isPathActive('/about')} isCollapsed={isCollapsed} />
                    <NavItem href="/console" iconKey="console" label={t('console')} active={isPathActive('/console')} isCollapsed={isCollapsed} />
                    <NavItem href="/settings" iconKey="settings" label={t('settings')} active={isPathActive('/settings')} isCollapsed={isCollapsed} />
                </Section>

            </nav>

            {/* Bottom spacer or empty */}
            <div className={`transition-all duration-300 ${isCollapsed ? 'py-1' : 'py-2'}`}>
            </div>

            {/* Custom Cluster Name (Background Watermark) */}
            {settings.clusterName && (
                <div className="mt-auto px-2 pb-4 pointer-events-none select-none">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-cluster-name)] opacity-40 break-all text-center leading-tight">
                        {settings.clusterName}
                    </p>
                </div>
            )}
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
    const { t } = useTranslation();
    const { setScope } = useSettings();
    const { setTheme, activeTheme: theme } = useTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [namespaces, setNamespaces] = useState(['default']);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Version check for cache busting
    useEffect(() => {
        async function checkVersion() {
            try {
                const res = await fetch('/api/version');
                if (res.ok) {
                    const data = await res.json();
                    const currentVersion = data.version;
                    const storedVersion = localStorage.getItem('kview_app_version');

                    if (storedVersion && storedVersion !== currentVersion) {
                        console.log(`New version detected: ${currentVersion}. Refreshing...`);
                        localStorage.setItem('kview_app_version', currentVersion);
                        window.location.reload(true);
                    } else if (!storedVersion) {
                        localStorage.setItem('kview_app_version', currentVersion);
                    }
                }
            } catch (err) {
                console.error('Version check failed:', err);
            }
        }
        checkVersion();
    }, []);

    useEffect(() => {
        if (user?.email) {
            setScope(user.email);
            const key = `kview-sidebar-collapsed-${user.email}`;
            try {
                const saved = localStorage.getItem(key);
                if (saved !== null) setIsCollapsed(JSON.parse(saved));
            } catch (e) { }
        } else {
            setScope('anonymous');
        }
    }, [user, setScope]);

    useEffect(() => {
        if (user?.email) {
            const key = `kview-sidebar-collapsed-${user.email}`;
            localStorage.setItem(key, JSON.stringify(isCollapsed));
        }
    }, [isCollapsed, user]);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => {
                setUser(d);
                // Pre-fetch namespaces if logged in
                fetch('/api/resources/namespaces')
                    .then(r => r.json())
                    .then(data => setNamespaces(data.map(ns => ns.name)))
                    .catch(() => { });
            })
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
        return <div className="flex items-center justify-center min-h-screen text-secondary bg-main">{t('loading')}</div>;
    }

    const protect = (el) => user ? el : <Navigate to="/login" />;

    return (
        <Router>
            <div className={`flex h-screen text-primary relative overflow-hidden transition-colors duration-200`}>
                <div
                    className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
                    style={{
                        backgroundImage: `url(${background})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 'var(--wallpaper-opacity, 0.6)',
                        filter: `grayscale(var(--wallpaper-grayscale, 0%)) brightness(var(--wallpaper-brightness, 0.6))`,
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundColor: 'var(--bg-overlay)',
                        backdropFilter: 'blur(4px)', // Soft blur for the overlay itself
                    }}
                />
                {user && (
                    <div className="relative z-10 flex h-full">
                        <Sidebar
                            user={user}
                            onLogout={handleLogout}
                            isCollapsed={isCollapsed}
                            setIsCollapsed={setIsCollapsed}
                            onCreateResource={() => setIsCreateModalOpen(true)}
                        />
                    </div>
                )}

                <CreateResourceModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        // Individual lists refresh themselves
                    }}
                    namespaces={namespaces}
                />
                <main className="flex-1 overflow-auto flex flex-col relative z-10">
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
                        <Route path="/workloads/hpas" element={protect(<ResourceList kind="hpas" />)} />

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
                        <Route path="/cluster/crds" element={protect(<ResourceList kind="crds" />)} />
                        <Route path="/crd" element={<Navigate to="/cluster/crds" replace />} />

                        {/* Cluster */}
                        <Route path="/cluster/cluster-role-bindings" element={protect(<ResourceList kind="cluster-role-bindings" />)} />
                        <Route path="/cluster/cluster-roles" element={protect(<ResourceList kind="cluster-roles" />)} />
                        <Route path="/cluster/namespaces" element={protect(<ResourceList kind="namespaces" />)} />
                        <Route path="/cluster/events" element={protect(<EventsList />)} />
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
