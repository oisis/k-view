import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
    return (
        <a
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-all duration-200 group
        ${active
                    ? 'bg-accent text-white shadow-lg shadow-indigo-500/20'
                    : 'text-secondary hover:bg-[var(--sidebar-hover)] hover:text-primary'}
                ${isCollapsed ? 'justify-center w-11 h-11 px-0' : 'w-full'}`}
            title={isCollapsed ? label : ''}
        >
            <Icon size={isCollapsed ? 20 : 16} className={`${active ? 'text-white' : 'text-text-muted group-hover:text-primary'} transition-colors shrink-0`} />
            {!isCollapsed && (
                <>
                    <span className="flex-1 truncate tracking-tight">{label}</span>
                    {active && <icons.chevron_right size={12} className="text-white/70" />}
                </>
            )}
        </a>
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
    const { icons } = useTheme();

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[var(--bg-sidebar)] border-r border-border flex flex-col hidden md:flex h-full shrink-0 transition-all duration-300 ease-in-out shadow-2xl z-20 overflow-hidden`}>
            {/* Logo + Toggle */}
            <div className={`border-b border-border flex items-center transition-all duration-300 min-h-[64px] py-2 ${isCollapsed ? 'px-0 justify-center' : 'px-4 justify-between gap-2'}`}>
                {!isCollapsed ? (
                    <div className="flex-1 flex justify-center overflow-hidden">
                        <img src={logo} alt="K-View Logo" className="w-44 h-auto opacity-95 transition-all duration-300 transform origin-left" />
                    </div>
                ) : null}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-xl text-text-muted hover:text-primary hover:bg-[var(--sidebar-hover)] transition-all active:scale-90 shrink-0
                        ${isCollapsed ? 'hover:bg-[var(--accent)]/10 text-accent' : ''}`}
                    title={isCollapsed ? t('expand_menu') : t('collapse_menu')}
                >
                    {isCollapsed ? <icons.expand_menu size={20} /> : <icons.collapse_menu size={20} />}
                </button>
            </div>

            {/* Scrollable nav */}
            <nav className={`flex-1 overflow-y-auto mt-2 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-2 pb-2'}`}>

                {/* Dashboard — standalone, no section */}
                <div className={`pb-1 ${isCollapsed ? 'flex flex-col items-center gap-0.5 mb-1' : 'space-y-0.5'}`}>
                    <NavItem href="/" iconKey="dashboard" label={t('dashboard')} active={p === '/'} isCollapsed={isCollapsed} />
                </div>

                <Section id="workloads" label={t('workloads')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/workloads/cronjobs" iconKey="cronjob" label={t('cronjobs')} active={p === '/workloads/cronjobs'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/daemonsets" iconKey="daemonset" label={t('daemonsets')} active={p === '/workloads/daemonsets'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/deployments" iconKey="deployment" label={t('deployments')} active={p === '/workloads/deployments'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/jobs" iconKey="job" label={t('jobs')} active={p === '/workloads/jobs'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/pods" iconKey="pod" label={t('pods')} active={p === '/workloads/pods'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/replicasets" iconKey="replicaset" label={t('replicasets')} active={p === '/workloads/replicasets'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/replicationcontrollers" iconKey="replicationcontroller" label={t('replicationcontrollers')} active={p === '/workloads/replicationcontrollers'} isCollapsed={isCollapsed} />
                    <NavItem href="/workloads/statefulsets" iconKey="statefulset" label={t('statefulsets')} active={p === '/workloads/statefulsets'} isCollapsed={isCollapsed} />
                </Section>

                <Section id="network" label={t('network')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/cluster/ingress-classes" iconKey="ingressclass" label={t('ingress_classes')} active={p === '/cluster/ingress-classes'} isCollapsed={isCollapsed} />
                    <NavItem href="/network/ingresses" iconKey="ingress" label={t('ingresses')} active={p === '/network/ingresses'} isCollapsed={isCollapsed} />
                    <NavItem href="/network/services" iconKey="service" label={t('services')} active={p === '/network/services'} isCollapsed={isCollapsed} />
                </Section>

                <Section id="config" label={t('config')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/config/configmaps" iconKey="configmap" label={t('configmaps')} active={p === '/config/configmaps'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/pvcs" iconKey="pvc" label={t('pvc')} active={p === '/config/pvcs'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/secrets" iconKey="secret" label={t('secrets')} active={p === '/config/secrets'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/storage-classes" iconKey="storageclass" label={t('storageclasses')} active={p === '/config/storage-classes'} isCollapsed={isCollapsed} />
                </Section>

                <Section id="cluster" label={t('cluster')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavItem href="/cluster/cluster-role-bindings" iconKey="clusterrolebinding" label={t('clusterrolebindings')} active={p === '/cluster/cluster-role-bindings'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/cluster-roles" iconKey="clusterrole" label={t('clusterroles')} active={p === '/cluster/cluster-roles'} isCollapsed={isCollapsed} />
                    <NavItem href="/crd" iconKey="crd" label={t('crd')} active={p === '/crd'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/events" iconKey="event" label={t('events')} active={p === '/cluster/events'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/namespaces" iconKey="namespace" label={t('namespaces')} active={p === '/cluster/namespaces'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/network-policies" iconKey="networkpolicy" label={t('network_policies')} active={p === '/cluster/network-policies'} isCollapsed={isCollapsed} />
                    <NavItem href="/nodes" iconKey="nodes" label={t('nodes')} active={p === '/nodes'} isCollapsed={isCollapsed} />
                    <NavItem href="/config/pvs" iconKey="pv" label={t('pv')} active={p === '/config/pvs'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/role-bindings" iconKey="rolebinding" label={t('rolebindings')} active={p === '/cluster/role-bindings'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/roles" iconKey="role" label={t('roles')} active={p === '/cluster/roles'} isCollapsed={isCollapsed} />
                    <NavItem href="/cluster/service-accounts" iconKey="serviceaccount" label={t('serviceaccounts')} active={p === '/cluster/service-accounts'} isCollapsed={isCollapsed} />
                </Section>

                <Section id="tools" label={t('tools')} defaultOpen={false} isCollapsed={isCollapsed} userEmail={user?.email}>
                    <NavActionButton onClick={onCreateResource} iconKey="plus" label={t('add_resource')} isCollapsed={isCollapsed} />
                    <NavItem href="/about" iconKey="about" label={t('about')} active={p === '/about'} isCollapsed={isCollapsed} />
                    <NavItem href="/console" iconKey="console" label={t('console')} active={p === '/console'} isCollapsed={isCollapsed} />
                    <NavItem href="/settings" iconKey="settings" label={t('settings')} active={p === '/settings'} isCollapsed={isCollapsed} />
                </Section>

            </nav>

            {/* Bottom: admin + mode label + logout */}
            <div className={`border-t border-border transition-all duration-300 ${isCollapsed ? 'py-3 px-2 flex flex-col items-center gap-4' : 'px-3 py-3 space-y-2'}`}>
                {!isCollapsed && (user.role === 'kview-cluster-admin' || user.role === 'admin') && (
                    <a
                        href="/access"
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-all w-full
                ${p === '/access'
                                ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30 shadow-sm'
                                : 'text-text-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors'}`}
                    >
                        <icons.admin_panel size={16} /> {t('admin_panel')}
                    </a>
                )}

                <div className={`flex items-center justify-between gap-2 px-1 ${isCollapsed ? 'flex-col gap-4 w-full items-center' : ''}`}>
                    {user.devMode ? (
                        <div className={`flex items-center gap-1.5 text-xs font-black text-green-500 tracking-tight uppercase ${isCollapsed ? 'flex-col items-center' : ''}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            {!isCollapsed ? t('development') : <span className="text-[8px]">DEV</span>}
                        </div>
                    ) : (
                        <div className={`flex items-center gap-1.5 text-xs font-black text-red-600 tracking-tight uppercase ${isCollapsed ? 'flex-col items-center' : ''}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.4)]" />
                            {!isCollapsed ? t('production') : <span className="text-[8px]">PROD</span>}
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        className={`p-1.5 rounded-xl bg-red-600/20 text-red-500 border border-red-600/40 hover:bg-red-600/30 hover:text-red-400 hover:border-red-600/60 transition-all active:scale-90 flex items-center justify-center group shadow-sm ${isCollapsed ? 'w-10 h-10' : ''}`}
                        title={t('logout')}
                    >
                        <icons.logout size={18} className="group-hover:translate-x-0.5 transition-transform" />
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
