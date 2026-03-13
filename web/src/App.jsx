import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Nodes from './components/Nodes';
import Settings from './components/Settings';
import Console from './components/Console';
import AdminPanel from './components/AdminPanel';
import ResourceList from './components/ResourceList';
import ResourceDetails from './components/ResourceDetails';
import About from './components/About';
import MainLayout from './components/MainLayout';

import { useTranslation, useSettings } from './SettingsContext';
import { useTheme } from './ThemeContext';

// ── Helper Components for Redirects (Defined before App to avoid Scope issues) ──
function RedirectToResources() {
    const { kind } = useParams();
    return <Navigate to={`/resources/${kind}`} replace />;
}

function RedirectToDetails() {
    const { kind, namespace, name } = useParams();
    // Prevent redirect loops for already correct paths or known routes
    const knownRoutes = ['resources', 'login', 'settings', 'about', 'console', 'access', 'nodes'];
    if (knownRoutes.includes(kind)) {
        return null; 
    }
    return <Navigate to={`/resources/${kind}/${namespace}/${name}`} replace />;
}

function NavigateToNamespace() {
    const { name } = useParams();
    return <Navigate to={`/resources/Namespaces/-/${name}`} replace />;
}

// ── Global Fetch Interceptor ───────────────────────────────────────────────
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    let [resource, config] = args;
    const token = localStorage.getItem('token');

    if (token && typeof resource === 'string' && resource.startsWith('/api/')) {
        config = config || {};
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const response = await originalFetch(resource, config);
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

    useEffect(() => {
        async function checkVersion() {
            try {
                const res = await fetch('/api/version');
                if (res.ok) {
                    const data = await res.json();
                    const currentVersion = data.version;
                    const storedVersion = localStorage.getItem('kview_app_version');

                    if (storedVersion && storedVersion !== currentVersion) {
                        localStorage.setItem('kview_app_version', currentVersion);
                        window.location.reload(true);
                    } else if (!storedVersion) {
                        localStorage.setItem('kview_app_version', currentVersion);
                    }
                }
            } catch (err) { }
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
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full shadow-lg" />
                </motion.div>
                <p className="animate-pulse font-semibold uppercase tracking-widest text-xs opacity-60">{t('loading')}...</p>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* Public Route */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

                {/* Protected Routes via MainLayout */}
                <Route element={
                    <MainLayout 
                        user={user}
                        onLogout={handleLogout}
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                        isCreateModalOpen={isCreateModalOpen}
                        setIsCreateModalOpen={setIsCreateModalOpen}
                        namespaces={namespaces}
                    />
                }>
                    <Route index element={<Dashboard isCollapsed={isCollapsed} />} />
                    <Route path="console" element={<Console />} />
                    <Route path="about" element={<About />} />
                    <Route path="settings" element={<Settings theme={theme} setTheme={setTheme} />} />
                    <Route path="access" element={user && (user.role === 'kview-cluster-admin' || user.role === 'admin') ? <AdminPanel /> : <Navigate to="/" />} />
                    
                    {/* Unified Resource Routes */}
                    <Route path="resources/Nodes" element={<Nodes />} />
                    <Route path="resources/:kind" element={<ResourceList />} />
                    <Route path="resources/:kind/:namespace/:name" element={<ResourceDetails />} />

                    {/* Backward Compatibility Redirects */}
                    <Route path="nodes" element={<Navigate to="/resources/Nodes" replace />} />
                    <Route path="workloads/:kind" element={<RedirectToResources />} />
                    <Route path="network/:kind" element={<RedirectToResources />} />
                    <Route path="config/:kind" element={<RedirectToResources />} />
                    <Route path="cluster/:kind" element={<RedirectToResources />} />
                    
                    {/* Legacy details redirect (e.g. /Pods/default/pod-name) */}
                    <Route path=":kind/:namespace/:name" element={<RedirectToDetails />} />

                    {/* Compatibility for Namespaces path used in older links */}
                    <Route path="namespaces/-/:name" element={<NavigateToNamespace />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
