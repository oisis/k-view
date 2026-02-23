import React, { useState, useEffect } from 'react';
import { User, Shield, Activity, Fingerprint, Globe } from 'lucide-react';

export default function UserInfo() {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/auth/details')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch user details');
                return res.json();
            })
            .then(data => {
                setDetails(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-3">
                    <Activity className="animate-spin text-blue-400" size={32} />
                    <p className="text-[13px] text-[var(--text-muted)]">Loading user details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-8 bg-[var(--bg-main)]">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                    Error: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto bg-[var(--bg-main)] text-[var(--text-primary)]">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">User Information</h1>
                    <p className="text-[13px] text-[var(--text-muted)] mt-1">Details about your session and cluster permissions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden glass shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Identity</h2>
                                    <p className="text-[13px] text-[var(--text-muted)]">Authenticated user profile.</p>
                                </div>
                            </div>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <dt className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Email / Username</dt>
                                    <dd className="mt-1 text-base font-mono flex items-center gap-2">
                                        <Fingerprint size={14} className="text-blue-400" />
                                        {details.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Namespace Scope</dt>
                                    <dd className="mt-1 text-base font-mono flex items-center gap-2">
                                        <Globe size={14} className="text-green-400" />
                                        {details.namespace || '<all namespaces>'}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden glass shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Cluster Role</h2>
                                    <p className="text-[13px] text-[var(--text-muted)]">Computed RBAC classification.</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <dt className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Assigned Role</dt>
                                <dd className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {details.role}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permissions Table */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden glass shadow-sm">
                    <div className="p-6 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-semibold">Effective Permissions</h2>
                        <p className="text-[13px] text-[var(--text-muted)]">What you are authorized to do in the cluster.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--bg-muted)]/30">
                                    <th className="px-6 py-3 text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Resources</th>
                                    <th className="px-6 py-3 text-[11px] font-bold tracking-widest uppercase text-[var(--text-muted)]">Allowed Verbs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {details.rules.map((rule, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--bg-muted)]/10 transition-colors">
                                        <td className="px-6 py-4 text-[13px] font-medium">{rule.resource}</td>
                                        <td className="px-6 py-4 text-[13px] font-mono text-blue-400">{rule.verbs}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
