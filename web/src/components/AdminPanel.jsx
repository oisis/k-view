import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert } from 'lucide-react';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const fetchUsers = () => {
        setLoading(true);
        fetch('/api/admin/users')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch users');
                return res.json();
            })
            .then(data => setUsers(data || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (email, newRole) => {
        try {
            const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) throw new Error('Failed to update role');

            setMessage(`Successfully updated role for ${email}`);
            fetchUsers();

            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    if (loading && users.length === 0) return <div className="p-8">Loading users...</div>;

    return (
        <div className="p-8">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-white)] mb-2">Admin Panel</h2>
                <p className="text-[var(--text-secondary)]">Manage user roles and permissions</p>
            </div>

            {message && (
                <div className="mb-4 p-4 bg-green-900/30 border border-green-800 text-green-400 rounded-lg">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/30">
                    <h3 className="font-semibold text-[var(--text-secondary)]">User Management</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--text-primary)]">
                        <thead className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)]/60 uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-3">User Email</th>
                                <th className="px-6 py-3">Current Role</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-[var(--text-muted)]">No users found in database.</td>
                                </tr>
                            ) : (
                                users.map((user, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--sidebar-hover)]/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[var(--text-white)]">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            {user.role === 'admin' ? (
                                                <span className="flex items-center gap-1 text-purple-400 bg-purple-900/30 px-2 py-1 rounded text-xs font-semibold">
                                                    <ShieldAlert size={12} /> Admin
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-blue-400 bg-blue-900/30 px-2 py-1 rounded text-xs">
                                                    <Shield size={12} /> Viewer
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.email, e.target.value)}
                                                className="bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2"
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
