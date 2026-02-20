import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { LayoutDashboard, Users, LogOut, FlaskConical } from 'lucide-react';

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
            <div className="flex items-center justify-center min-h-screen text-gray-400">
                Loading...
            </div>
        );
    }

    return (
        <Router>
            <div className="flex h-screen bg-gray-900 text-gray-100">
                {user && (
                    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex-col hidden md:flex">
                        <div className="p-4 border-b border-gray-700">
                            <h1 className="text-xl font-bold text-blue-400">K-View</h1>
                            {/* DEV MODE badge */}
                            {user.devMode && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400 bg-yellow-900/40 border border-yellow-700 rounded px-2 py-1">
                                    <FlaskConical size={12} />
                                    DEVELOPMENT MODE
                                </div>
                            )}
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <a href="/" className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                                <LayoutDashboard size={20} />
                                Dashboard
                            </a>
                            {user.role === 'admin' && (
                                <a href="/admin" className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors">
                                    <Users size={20} />
                                    Admin Panel
                                </a>
                            )}
                        </nav>
                        <div className="p-4 border-t border-gray-700">
                            <div className="mb-4 truncate text-sm text-gray-400">{user.email}</div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 justify-center p-2 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    </aside>
                )}

                <main className="flex-1 overflow-auto">
                    <Routes>
                        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
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
