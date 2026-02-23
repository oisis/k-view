import React, { useState, useEffect } from 'react';
import { User, Shield, Activity, Fingerprint, Globe, Sun, Moon, Palette, ShieldCheck, Check, LayoutGrid, Clock, List, Languages, Server, RefreshCw } from 'lucide-react';
import { useSettings, useTranslation } from '../SettingsContext';

export default function Settings({ theme, setTheme }) {
    const { settings, updateSettings } = useSettings();
    const { t } = useTranslation();
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
        { id: 'default', name: t('theme_kview'), icon: ShieldCheck, desc: t('theme_kview_desc') },
        { id: 'light', name: t('theme_light'), icon: Sun, desc: t('theme_light_desc') },
        { id: 'black', name: t('theme_midnight'), icon: Moon, desc: t('theme_midnight_desc') },
    ];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-main)]">
                <div className="flex flex-col items-center gap-3">
                    <Activity className="animate-spin text-info" size={32} />
                    <p className="text-[13px] text-[var(--text-muted)]">{t('loading_settings')}</p>
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
                            <h1 className="text-2xl font-bold tracking-tight">{t('settings')}</h1>
                            <p className="text-[13px] text-[var(--text-muted)] mt-1">{t('settings_desc')}</p>
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
                            {t('reload')}
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
                            {t('save_changes')}
                        </button>
                    </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                        <Palette size={14} /> {t('interface_theme')}
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
                            <Server size={18} className="text-info" /> {t('cluster_configuration')}
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label={t('custom_cluster_name')}
                            icon={Fingerprint}
                            value={draftSettings.clusterName}
                            onChange={(v) => handleUpdateDraft({ clusterName: v })}
                            placeholder="My Dev Cluster"
                            description={t('custom_cluster_name_desc')}
                        />
                        <SelectField
                            label={t('default_namespace')}
                            icon={Globe}
                            value={draftSettings.defaultNamespace}
                            onChange={(v) => handleUpdateDraft({ defaultNamespace: v })}
                            options={[
                                { value: '', label: t('all_namespaces') },
                                ...namespaces.map(ns => ({ value: ns, label: ns }))
                            ]}
                            description={t('default_namespace_desc')}
                        />
                    </div>
                </div>

                {/* View Preferences */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden glass shadow-sm">
                    <div className="p-6 border-b border-[var(--border-color)]">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <LayoutGrid size={18} className="text-purple-400" /> {t('interface_preferences')}
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label={t('items_per_page')}
                            icon={List}
                            type="number"
                            min={5}
                            max={100}
                            value={draftSettings.itemsPerPage}
                            onChange={(v) => handleUpdateDraft({ itemsPerPage: v })}
                            description={t('items_per_page_desc')}
                        />
                        <InputField
                            label={t('labels_limit')}
                            icon={Shield}
                            type="number"
                            min={1}
                            max={50}
                            value={draftSettings.labelsLimit}
                            onChange={(v) => handleUpdateDraft({ labelsLimit: v })}
                            description={t('labels_limit_desc')}
                        />
                        <InputField
                            label={t('resource_refresh')}
                            icon={Clock}
                            type="number"
                            min={1}
                            max={300}
                            value={draftSettings.resourceRefreshInterval}
                            onChange={(v) => handleUpdateDraft({ resourceRefreshInterval: v })}
                            description={t('resource_refresh_desc')}
                        />
                        <InputField
                            label={t('logs_refresh')}
                            icon={Activity}
                            type="number"
                            min={0}
                            max={300}
                            value={draftSettings.logsRefreshInterval}
                            onChange={(v) => handleUpdateDraft({ logsRefreshInterval: v })}
                            description={t('logs_refresh_desc')}
                        />
                        <SelectField
                            label={t('localization')}
                            icon={Languages}
                            value={draftSettings.locale}
                            onChange={(v) => handleUpdateDraft({ locale: v })}
                            options={[
                                { value: 'en', label: 'English' },
                                { value: 'de', label: 'Deutsch' },
                                { value: 'fr', label: 'Français' },
                                { value: 'es', label: 'Español' },
                                { value: 'ja', label: '日本語' },
                                { value: 'ko', label: '한국어' },
                                { value: 'pl', label: 'Polski' },
                                { value: 'zh', label: '简体中文' }
                            ]}
                            description={t('localization_desc')}
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
                                    <h2 className="text-lg font-semibold">{t('user_identity')}</h2>
                                    <p className="text-[13px] text-[var(--text-muted)]">{t('user_identity_desc')}</p>
                                </div>
                            </div>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">{t('email_username')}</dt>
                                    <dd className="mt-1 text-base font-mono flex items-center gap-2">
                                        <Fingerprint size={14} className="text-info" />
                                        {details?.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">{t('namespace_scope')}</dt>
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
                                    <h2 className="text-lg font-semibold">{t('cluster_permissions')}</h2>
                                    <p className="text-[13px] text-[var(--text-muted)]">{t('cluster_permissions_desc')}</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">{t('assigned_role')}</dt>
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
                        <h2 className="text-lg font-semibold">{t('effective_permissions')}</h2>
                        <p className="text-[13px] text-[var(--text-muted)]">{t('effective_permissions_desc')}</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--bg-muted)]/30">
                                    <th className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">{t('resources')}</th>
                                    <th className="px-6 py-3 text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">{t('allowed_verbs')}</th>
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
