import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
                    <Route path="nodes" element={<Nodes />} />
                    <Route path="console" element={<Console />} />
                    <Route path="about" element={<About />} />
                    <Route path="settings" element={<Settings theme={theme} setTheme={setTheme} />} />
                    
                    {/* Workloads */}
                    <Route path="workloads/Pods" element={<ResourceList kind="Pods" />} />
                    <Route path="workloads/Deployments" element={<ResourceList kind="Deployments" />} />
                    <Route path="workloads/StatefulSets" element={<ResourceList kind="StatefulSets" />} />
                    <Route path="workloads/DaemonSets" element={<ResourceList kind="DaemonSets" />} />
                    <Route path="workloads/Jobs" element={<ResourceList kind="Jobs" />} />
                    <Route path="workloads/CronJobs" element={<ResourceList kind="CronJobs" />} />
                    <Route path="workloads/ReplicaSets" element={<ResourceList kind="ReplicaSets" />} />
                    <Route path="workloads/ReplicationControllers" element={<ResourceList kind="ReplicationControllers" />} />
                    <Route path="workloads/HorizontalPodAutoscalers" element={<ResourceList kind="HorizontalPodAutoscalers" />} />
                    
                    {/* Network */}
                    <Route path="network/Services" element={<ResourceList kind="Services" />} />
                    <Route path="network/Ingresses" element={<ResourceList kind="Ingresses" />} />
                    <Route path="network/Endpoints" element={<ResourceList kind="Endpoints" />} />
                    
                    {/* Config & Storage */}
                    <Route path="config/ConfigMaps" element={<ResourceList kind="ConfigMaps" />} />
                    <Route path="config/Secrets" element={<ResourceList kind="Secrets" />} />
                    <Route path="config/PersistentVolumeClaims" element={<ResourceList kind="PersistentVolumeClaims" />} />
                    <Route path="config/PersistentVolumes" element={<ResourceList kind="PersistentVolumes" />} />
                    <Route path="config/StorageClasses" element={<ResourceList kind="StorageClasses" />} />
                    
                    {/* Cluster Resources */}
                    <Route path="cluster/CustomResourceDefinitions" element={<ResourceList kind="CustomResourceDefinitions" />} />
                    <Route path="CustomResourceDefinition" element={<Navigate to="/cluster/CustomResourceDefinitions" replace />} />
                    <Route path="cluster/ClusterRoleBindings" element={<ResourceList kind="ClusterRoleBindings" />} />
                    <Route path="cluster/ClusterRoles" element={<ResourceList kind="ClusterRoles" />} />
                    <Route path="cluster/Namespaces" element={<ResourceList kind="Namespaces" />} />
                    <Route path="cluster/Events" element={<ResourceList kind="Events" />} />
                    <Route path="cluster/IngressClasses" element={<ResourceList kind="IngressClasses" />} />
                    <Route path="cluster/NetworkPolicies" element={<ResourceList kind="NetworkPolicies" />} />
                    <Route path="cluster/RoleBindings" element={<ResourceList kind="RoleBindings" />} />
                    <Route path="cluster/Roles" element={<ResourceList kind="Roles" />} />
                    <Route path="cluster/ServiceAccounts" element={<ResourceList kind="ServiceAccounts" />} />
                    
                    {/* Details View */}
                    <Route path=":kind/:namespace/:name" element={<ResourceDetails user={user} />} />
                    
                    {/* Admin/Access */}
                    <Route path="access" element={user && (user.role === 'kview-cluster-admin' || user.role === 'admin') ? <AdminPanel /> : <Navigate to="/" />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
