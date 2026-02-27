import React, { useState, useEffect } from 'react';
import { useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';

export default function AdminPanel() {
    const { t } = useTranslation();
    const { icons } = useTheme();

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

    if (loading) return <div className="p-8 text-text-muted">{t('loading')}</div>;

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
                    <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
                        {icons.role && React.createElement(icons.role, { className: "text-info" })} {t('access_control')}
                    </h2>
                    <p className="text-secondary">{t('effective_permissions_desc')}</p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-muted)] border border-border px-3 py-1.5 rounded-full text-xs text-text-muted shadow-sm">
                    {icons.deployment && React.createElement(icons.deployment, { size: 14, className: "text-green-400" })}
                    Config loaded from: Git/Helm (Read-Only)
                </div>
            </div>

            {/* My Permissions Section */}
            <div className="glass rounded-2xl border border-border overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-border bg-transparent flex justify-between items-center">
                    <h3 className="font-semibold text-secondary flex items-center gap-2">
                        {icons.admin_panel && React.createElement(icons.admin_panel, { className: "text-info", size: 18 })} {t('effective_permissions')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-text-muted">{t('assigned_role')}:</span>
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-info/10 text-info">
                            {status?.role} {status?.namespace ? `(${status.namespace})` : ''}
                        </span>
                    </div>
                </div>
                <div className="p-6 bg-main">
                    <div className="mb-4 text-sm text-secondary">
                        {t('connected_as')} <strong className="text-primary">{status?.email}</strong>. {t('effective_permissions_desc')}:
                    </div>
                    <div className="space-y-3">
                        {status?.rules?.map((rule, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-[var(--bg-muted)]/50 rounded-md">
                                <div className="sm:w-1/3 flex items-center gap-2">
                                    {icons.check_circle && React.createElement(icons.check_circle, { size: 16, className: "text-green-500 shrink-0" })}
                                    <span className="text-sm font-medium text-primary">{rule.resource}</span>
                                </div>
                                <div className="sm:w-2/3 text-sm text-text-muted font-mono bg-[var(--bg-muted)]/80 p-1.5 rounded">
                                    {rule.verbs}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Role Definitions Section */}
            <div className="glass rounded-2xl border border-border overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-border bg-transparent">
                    <h3 className="font-semibold text-secondary flex items-center gap-2">
                        {icons.lock && React.createElement(icons.lock, { className: "text-cyan", size: 18 })} {t('role_definitions')}
                    </h3>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                    {roles.length === 0 ? (
                        <div className="p-8 text-center text-text-muted">No K-View roles detected.</div>
                    ) : (
                        roles.map((role, i) => (
                            <div key={i} className="bg-main">
                                <button
                                    onClick={() => toggleRole(role.name)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--sidebar-hover)]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--text-cyan)]/10 flex items-center justify-center">
                                            {icons.shield && React.createElement(icons.shield, { size: 16, className: "text-cyan" })}
                                        </div>
                                        <span className="font-mono text-sm font-semibold text-cyan">{role.name}</span>
                                    </div>
                                    {expandedRoles[role.name] ? (icons.chevron_up && React.createElement(icons.chevron_up, { size: 18, className: "text-text-muted" })) : (icons.chevron_down && React.createElement(icons.chevron_down, { size: 18, className: "text-text-muted" }))}
                                </button>

                                {expandedRoles[role.name] && (
                                    <div className="px-6 pb-6 pt-2 overflow-x-auto">
                                        <table className="w-full text-left text-xs border border-border rounded-lg overflow-hidden">
                                            <thead className="bg-[var(--bg-sidebar)]/10 text-text-muted uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-2 border-b border-r border-border">{t('api_groups')}</th>
                                                    <th className="px-4 py-2 border-b border-r border-border">{t('resources')}</th>
                                                    <th className="px-4 py-2 border-b border-border">{t('verbs')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-color)]">
                                                {role.rules?.map((rule, idx) => (
                                                    <tr key={idx} className="hover:bg-[var(--bg-muted)]/30">
                                                        <td className="px-4 py-2 border-r border-border font-mono text-secondary">
                                                            {rule.apiGroups?.map(g => g === "" ? "(core)" : g).join(', ')}
                                                        </td>
                                                        <td className="px-4 py-2 border-r border-border text-primary">
                                                            <div className="flex flex-wrap gap-1">
                                                                {rule.resources?.map((res, rIdx) => (
                                                                    <span key={rIdx} className="bg-transparent px-1.5 py-0.5 rounded text-[10px]">
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
            <div className="glass rounded-2xl border border-border overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-border bg-transparent">
                    <h3 className="font-semibold text-secondary flex items-center gap-2">
                        {icons.shield && React.createElement(icons.shield, { className: "text-green-400", size: 18 })} Global Assignments
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-primary">
                        <thead className="text-xs text-text-muted bg-[var(--bg-sidebar)]/10 uppercase tracking-wider border-b border-border">
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
                                    <td colSpan="4" className="px-6 py-8 text-center text-text-muted">No k-view role bindings detected in the cluster.</td>
                                </tr>
                            ) : (
                                status.assignments.map((assignment, i) => (
                                    <tr key={i} className="border-b border-border hover:bg-[var(--sidebar-hover)]/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {assignment.user || assignment.group || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs uppercase font-bold bg-transparent text-text-muted">
                                                {assignment.user ? 'User' : 'Group'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-info font-mono text-xs">
                                            {assignment.role}
                                        </td>
                                        <td className="px-6 py-4 text-text-muted">
                                            {assignment.namespace || <span className="text-xs bg-[var(--text-purple)]/10 text-purple px-1.5 py-0.5 rounded">Cluster-Wide</span>}
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
