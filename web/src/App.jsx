import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Nodes from './components/Nodes';
import Console from './components/Console';
import AdminPanel from './components/AdminPanel';
import { LayoutDashboard, Server, Terminal, LogOut, FlaskConical, ShieldAlert } from 'lucide-react';

function NavLink({ href, icon: Icon, label, active }) {
    return (
        <a
            href={href}
            className={`flex items-center gap-3 p-2 rounded transition-colors
        ${active
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
        >
            <Icon size={18} />
            {label}
        </a>
    );
}

function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const path = location.pathname;

    return (
        <aside className="w-64 bg-gray-800 border-r border-gray-700 flex-col hidden md:flex h-full">
            {/* Logo */}
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-xl font-bold text-blue-400">K-View</h1>
                <p className="text-xs text-gray-500 mt-0.5">Kubernetes Dashboard</p>
                {user.devMode && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/40 border border-yellow-700 rounded px-2 py-1">
                        <FlaskConical size={12} />
                        DEVELOPMENT MODE
                    </div>
                )}
            </div>

            {/* Main nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <NavLink href="/" icon={LayoutDashboard} label="Dashboard" active={path === '/'} />
                <NavLink href="/nodes" icon={Server} label="Nodes" active={path === '/nodes'} />
                <NavLink href="/console" icon={Terminal} label="Console" active={path === '/console'} />
            </nav>

            {/* Bottom: user + admin + logout */}
            <div className="p-4 border-t border-gray-700 space-y-2">
                <div className="text-xs text-gray-500 truncate px-1">{user.email}</div>

                {user.role === 'admin' && (
                    <a
                        href="/admin"
                        className={`flex items-center gap-3 p-2 rounded transition-colors w-full
              ${path === '/admin'
                                ? 'bg-red-900/50 text-red-300 border border-red-700'
                                : 'text-red-400 hover:bg-red-900/30 border border-red-900/50'}`}
                    >
                        <ShieldAlert size={18} />
                        Admin Panel
                    </a>
                )}

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 justify-center p-2 rounded bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </aside>
    );
}

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Not authenticated');
            })
            .then(data => setUser(data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>
        );
    }

    return (
        <Router>
            <div className="flex h-screen bg-gray-900 text-gray-100">
                {user && <Sidebar user={user} onLogout={handleLogout} />}
                <main className="flex-1 overflow-auto flex flex-col">
                    <Routes>
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                        <Route path="/nodes" element={user ? <Nodes /> : <Navigate to="/login" />} />
                        <Route path="/console" element={user ? <Console /> : <Navigate to="/login" />} />
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
