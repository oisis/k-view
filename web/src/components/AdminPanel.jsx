import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, GitBranch, Key, CheckCircle } from 'lucide-react';

export default function AdminPanel() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/rbac/status')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch RBAC status');
                return res.json();
            })
            .then(data => setStatus(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-[var(--text-muted)]">Loading access overview...</div>;

    if (error) {
        return (
            <div className="p-8">
                <div className="p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-white)] mb-2 flex items-center gap-2">
                        <Key className="text-blue-400" /> Access Overview
                    </h2>
                    <p className="text-[var(--text-secondary)]">View cluster access assignments and your permissions</p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-muted)] border border-[var(--border-color)] px-3 py-1.5 rounded-full text-xs text-[var(--text-muted)] shadow-sm">
                    <GitBranch size={14} className="text-green-400" />
                    Config loaded from: Git/Helm (Read-Only)
                </div>
            </div>

            {/* My Permissions Section */}
            <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/50 flex justify-between items-center">
                    <h3 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                        <ShieldAlert className="text-blue-400" size={18} /> My Permissions
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-muted)]">Effective Role:</span>
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-900/40 text-blue-300 border border-blue-800">
                            {status?.role} {status?.namespace ? `(${status.namespace})` : ''}
                        </span>
                    </div>
                </div>
                <div className="p-6 bg-[var(--bg-main)]">
                    <div className="mb-4 text-sm text-[var(--text-secondary)]">
                        Logged in as <strong className="text-[var(--text-primary)]">{status?.email}</strong>. Based on your role, here are your capabilities:
                    </div>
                    <div className="space-y-3">
                        {status?.rules?.map((rule, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-[var(--bg-muted)]/50 border border-[var(--border-color)] rounded-md">
                                <div className="sm:w-1/3 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{rule.resource}</span>
                                </div>
                                <div className="sm:w-2/3 text-sm text-[var(--text-muted)] font-mono bg-black/20 p-1.5 rounded">
                                    {rule.verbs}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Global Assignments Table */}
            <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/50">
                    <h3 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                        <Shield className="text-purple-400" size={18} /> Global Assignments
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--text-primary)]">
                        <thead className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)]/60 uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-3">Subject</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Namespace</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!status?.assignments || status.assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">No static assignments loaded.</td>
                                </tr>
                            ) : (
                                status.assignments.map((assignment, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--sidebar-hover)]/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[var(--text-white)]">
                                            {assignment.user || assignment.group || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-[10px] uppercase font-bold bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                                {assignment.user ? 'User' : 'Group'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-blue-400 font-mono text-xs">
                                            {assignment.role}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-muted)]">
                                            {assignment.namespace || <span className="text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800/50">Cluster-Wide</span>}
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
