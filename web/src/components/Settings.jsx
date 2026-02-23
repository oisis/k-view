import React, { useState, useEffect } from 'react';
import { User, Shield, Activity, Fingerprint, Globe, Sun, Moon, Palette, ShieldCheck, Check, LayoutGrid, Clock, List, Languages, Server, RefreshCw } from 'lucide-react';
import { useSettings } from '../SettingsContext';

export default function Settings({ theme, setTheme }) {
    const { settings, updateSettings } = useSettings();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [namespaces, setNamespaces] = useState([]);

    // Draft state for "Save/Reload" pattern
    const [draftSettings, setDraftSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setDraftSettings(settings);
        setHasChanges(false);
    }, [settings]);

    const handleUpdateDraft = (update) => {
        setDraftSettings(prev => {
            const next = { ...prev, ...update };
            setHasChanges(JSON.stringify(next) !== JSON.stringify(settings));
            return next;
        });
    };

    const handleSave = () => {
        updateSettings(draftSettings);
        setHasChanges(false);
    };

    const handleReload = () => {
        setDraftSettings(settings);
        setHasChanges(false);
    };

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/details').then(res => {
                if (!res.ok) throw new Error('Failed to fetch user details');
                return res.json();
            }),
            fetch('/api/namespaces').then(res => res.ok ? res.json() : [])
        ])
            .then(([userData, nsData]) => {
                setDetails(userData);
                setNamespaces(nsData);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const themes = [
        { id: 'default', name: 'K-view', icon: ShieldCheck, desc: 'Deep cosmic indigo with glass accents' },
        { id: 'light', name: 'Crisp Light', icon: Sun, desc: 'Professional clean light interface' },
        { id: 'black', name: 'Midnight', icon: Moon, desc: 'Pure dark for focused work' },
    ];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-3">
                    <Activity className="animate-spin text-info" size={32} />
                    <p className="text-[13px] text-[var(--text-muted)]">Loading settings...</p>
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

    const InputField = ({ label, icon: Icon, value, onChange, type = "text", min, max, placeholder, description }) => (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                <Icon size={14} /> {label}
            </label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    className="w-full bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                />
            </div>
            {description && <p className="text-[11px] text-[var(--text-muted)] italic">{description}</p>}
        </div>
    );

    const SelectField = ({ label, icon: Icon, value, onChange, options, description }) => (
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                <Icon size={14} /> {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {description && <p className="text-[11px] text-[var(--text-muted)] italic">{description}</p>}
        </div>
    );

    return (
        <div className="flex-1 overflow-auto bg-[var(--bg-main)] text-[var(--text-primary)]">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--accent)] text-white">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                            <p className="text-[13px] text-[var(--text-muted)] mt-1">Manage your interface preferences and view session details.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReload}
                            disabled={!hasChanges}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border
                                ${hasChanges
                                    ? 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
                                    : 'bg-transparent border-transparent text-[var(--text-muted)] cursor-default'}`}
                        >
                            <RefreshCw size={16} />
                            Reload
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all shadow-lg
                                ${hasChanges
                                    ? 'bg-[var(--accent)] text-white hover:opacity-90 shadow-indigo-500/20 active:scale-95'
                                    : 'bg-[var(--bg-muted)] text-[var(--text-muted)] cursor-default'}`}
                        >
                            <ShieldCheck size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <Palette size={14} /> Interface Theme
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {themes.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTheme(t.id)}
                                className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-200 group relative
                                    ${theme === t.id
                                        ? 'bg-[var(--bg-card)] border-[var(--accent)] shadow-lg shadow-indigo-500/10'
                                        : 'bg-[var(--bg-sidebar)] border-[var(--border-color)] hover:border-[var(--accent)]/50'}`}
                            >
                                <div className={`p-2 w-fit rounded-lg mb-3 ${theme === t.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)] group-hover:text-[var(--text-white)]'}`}>
                                    <t.icon size={18} />
                                </div>
                                <h3 className="font-bold text-[var(--text-white)]">{t.name}</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{t.desc}</p>

                                {theme === t.id && (
                                    <div className="absolute top-4 right-4 text-[var(--accent)]">
                                        <Check size={16} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cluster Settings */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden glass shadow-sm">
                    <div className="p-6 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Server size={18} className="text-info" /> Cluster Configuration
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Custom Cluster Name"
                            icon={Fingerprint}
                            value={draftSettings.clusterName}
                            onChange={(v) => handleUpdateDraft({ clusterName: v })}
                            placeholder="My Dev Cluster"
                            description="Will be displayed in the Dashboard instead of the detected platform name."
                        />
                        <SelectField
                            label="Default Namespace"
                            icon={Globe}
                            value={draftSettings.defaultNamespace}
                            onChange={(v) => handleUpdateDraft({ defaultNamespace: v })}
                            options={[
                                { value: '', label: 'All Namespaces' },
                                ...namespaces.map(ns => ({ value: ns, label: ns }))
                            ]}
                            description="The namespace that will be selected by default on all resource lists."
                        />
                    </div>
                </div>

                {/* View Preferences */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden glass shadow-sm">
                    <div className="p-6 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <LayoutGrid size={18} className="text-purple-400" /> Interface Preferences
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Items per page"
                            icon={List}
                            type="number"
                            min={5}
                            max={100}
                            value={draftSettings.itemsPerPage}
                            onChange={(v) => handleUpdateDraft({ itemsPerPage: v })}
                            description="Number of resources to display per page in lists."
                        />
                        <InputField
                            label="Labels limit"
                            icon={Shield}
                            type="number"
                            min={1}
                            max={50}
                            value={draftSettings.labelsLimit}
                            onChange={(v) => handleUpdateDraft({ labelsLimit: v })}
                            description="Maximum number of labels to display before truncating in detail views."
                        />
                        <InputField
                            label="Resource Refresh Interval"
                            icon={Clock}
                            type="number"
                            min={1}
                            max={300}
                            value={draftSettings.resourceRefreshInterval}
                            onChange={(v) => handleUpdateDraft({ resourceRefreshInterval: v })}
                            description="Seconds between automatic data refreshes in lists and dashboard."
                        />
                        <InputField
                            label="Logs Refresh Interval"
                            icon={Activity}
                            type="number"
                            min={0}
                            max={300}
                            value={draftSettings.logsRefreshInterval}
                            onChange={(v) => handleUpdateDraft({ logsRefreshInterval: v })}
                            description="Seconds between automatic log refreshes in pod details. Set to 0 to disable."
                        />
                        <SelectField
                            label="Localization (Language)"
                            icon={Languages}
                            value={draftSettings.locale}
                            onChange={(v) => handleUpdateDraft({ locale: v })}
                            options={[
                                { value: 'en', label: 'English' }
                            ]}
                            description="Support for more languages coming soon."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden glass shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-info/10 text-info rounded-xl border border-info/20">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">User Identity</h2>
                                    <p className="text-[13px] text-[var(--text-muted)]">Authenticated user profile.</p>
                                </div>
                            </div>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Email / Username</dt>
                                    <dd className="mt-1 text-base font-mono flex items-center gap-2">
                                        <Fingerprint size={14} className="text-info" />
                                        {details?.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Namespace Scope</dt>
                                    <dd className="mt-1 text-base font-mono flex items-center gap-2">
                                        <Globe size={14} className="text-info" />
                                        {details?.namespace || '<all namespaces>'}
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
                                    <h2 className="text-lg font-semibold">Cluster Permissions</h2>
                                    <p className="text-[13px] text-[var(--text-muted)]">Computed RBAC classification.</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Assigned Role</dt>
                                <dd className="mt-2 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    {details?.role}
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
                                    <th className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Resources</th>
                                    <th className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Allowed Verbs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {details?.rules?.map((rule, idx) => (
                                    <tr key={idx} className="hover:bg-[var(--bg-muted)]/10 transition-colors">
                                        <td className="px-6 py-4 text-[13px] font-medium">{rule.resource}</td>
                                        <td className="px-6 py-4 text-[13px] font-mono text-info">{rule.verbs}</td>
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
