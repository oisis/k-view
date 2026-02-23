import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, GitBranch, Key, CheckCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useTranslation } from '../SettingsContext';

export default function AdminPanel() {
    const { t } = useTranslation();

    const [status, setStatus] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRoles, setExpandedRoles] = useState({});

    useEffect(() => {
        Promise.all([
            fetch('/api/rbac/status').then(res => {
                if (!res.ok) throw new Error('Failed to fetch RBAC status');
                return res.json();
            }),
            fetch('/api/rbac/roles').then(res => {
                if (!res.ok) throw new Error('Failed to fetch K-View roles');
                return res.json();
            })
        ])
            .then(([statusData, rolesData]) => {
                setStatus(statusData);
                setRoles(rolesData);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const toggleRole = (roleName) => {
        setExpandedRoles(prev => ({
            ...prev,
            [roleName]: !prev[roleName]
        }));
    };

    if (loading) return <div className="p-8 text-[var(--text-muted)]">{t('loading')}</div>;

    if (error) {
        return (
            <div className="p-8">
                <div className="p-4 bg-red-900/30 border border-red-800 text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-white)] mb-2 flex items-center gap-2">
                        <Key className="text-info" /> {t('access_control')}
                    </h2>
                    <p className="text-[var(--text-secondary)]">{t('effective_permissions_desc')}</p>
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
                        <ShieldAlert className="text-info" size={18} /> {t('effective_permissions')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-muted)]">{t('assigned_role')}:</span>
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-info/10 text-info border border-info/20">
                            {status?.role} {status?.namespace ? `(${status.namespace})` : ''}
                        </span>
                    </div>
                </div>
                <div className="p-6 bg-[var(--bg-main)]">
                    <div className="mb-4 text-sm text-[var(--text-secondary)]">
                        {t('connected_as')} <strong className="text-[var(--text-primary)]">{status?.email}</strong>. {t('effective_permissions_desc')}:
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

            {/* Role Definitions Section */}
            <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/50">
                    <h3 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                        <Lock className="text-cyan" size={18} /> {t('role_definitions')}
                    </h3>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                    {roles.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-muted)]">No K-View roles detected.</div>
                    ) : (
                        roles.map((role, i) => (
                            <div key={i} className="bg-[var(--bg-main)]">
                                <button
                                    onClick={() => toggleRole(role.name)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--sidebar-hover)]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--text-cyan)]/10 flex items-center justify-center border border-[var(--text-cyan)]/20">
                                            <Shield size={16} className="text-cyan" />
                                        </div>
                                        <span className="font-mono text-sm font-semibold text-cyan">{role.name}</span>
                                    </div>
                                    {expandedRoles[role.name] ? <ChevronUp size={18} className="text-[var(--text-muted)]" /> : <ChevronDown size={18} className="text-[var(--text-muted)]" />}
                                </button>

                                {expandedRoles[role.name] && (
                                    <div className="px-6 pb-6 pt-2 overflow-x-auto">
                                        <table className="w-full text-left text-xs border border-[var(--border-color)] rounded-lg overflow-hidden">
                                            <thead className="bg-[var(--bg-muted)] text-[var(--text-muted)] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-2 border-b border-r border-[var(--border-color)]">{t('api_groups')}</th>
                                                    <th className="px-4 py-2 border-b border-r border-[var(--border-color)]">{t('resources')}</th>
                                                    <th className="px-4 py-2 border-b border-[var(--border-color)]">{t('verbs')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                {role.rules?.map((rule, idx) => (
                                                    <tr key={idx} className="hover:bg-[var(--bg-muted)]/30">
                                                        <td className="px-4 py-2 border-r border-[var(--border-color)] font-mono text-[var(--text-secondary)]">
                                                            {rule.apiGroups?.length > 0 ? rule.apiGroups.join(', ') : '"" (core)'}
                                                        </td>
                                                        <td className="px-4 py-2 border-r border-[var(--border-color)] text-[var(--text-primary)]">
                                                            <div className="flex flex-wrap gap-1">
                                                                {rule.resources?.map((res, rIdx) => (
                                                                    <span key={rIdx} className="bg-[var(--bg-muted)] border border-[var(--border-color)] px-1.5 py-0.5 rounded text-[10px]">
                                                                        {res}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-info">
                                                            {rule.verbs?.join(', ')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Global Assignments Table */}
            <div className="bg-[var(--bg-glass)] glass rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/50">
                    <h3 className="font-semibold text-[var(--text-secondary)] flex items-center gap-2">
                        <Shield className="text-green-400" size={18} /> Global Assignments
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--text-primary)]">
                        <thead className="text-xs text-[var(--text-muted)] bg-[var(--bg-muted)]/60 uppercase tracking-wider border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-3">{t('user')}</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Namespace</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!status?.assignments || status.assignments.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)]">No k-view role bindings detected in the cluster.</td>
                                </tr>
                            ) : (
                                status.assignments.map((assignment, i) => (
                                    <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--sidebar-hover)]/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-[var(--text-white)]">
                                            {assignment.user || assignment.group || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs uppercase font-bold bg-[var(--bg-muted)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                                {assignment.user ? 'User' : 'Group'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-info font-mono text-xs">
                                            {assignment.role}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-muted)]">
                                            {assignment.namespace || <span className="text-xs bg-[var(--text-purple)]/10 text-purple px-1.5 py-0.5 rounded border border-[var(--text-purple)]/20">Cluster-Wide</span>}
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
