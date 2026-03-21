import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../SettingsContext';

export default function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { icons } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcutText = isMac ? '⌘K' : 'Ctrl+K';

    // Toggle the menu when Cmd+K or Ctrl+K is pressed
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Fetch dynamic results when search changes
    useEffect(() => {
        if (search.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (e) {
                console.error('Search failed:', e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const runCommand = (command) => {
        setOpen(false);
        setSearch('');
        command();
    };

    const resourceTypes = [
        { name: 'Pods', kind: 'Pods', icon: icons.pod },
        { name: 'Deployments', kind: 'Deployments', icon: icons.deployment },
        { name: 'Services', kind: 'Services', icon: icons.service },
        { name: 'Ingresses', kind: 'Ingresses', icon: icons.ingress },
        { name: 'Nodes', kind: 'Nodes', icon: icons.nodes },
        { name: 'Namespaces', kind: 'Namespaces', icon: icons.namespace },
        { name: 'ConfigMaps', kind: 'ConfigMaps', icon: icons.configmap },
        { name: 'Secrets', kind: 'Secrets', icon: icons.secret },
        { name: 'PersistentVolumeClaims', kind: 'PersistentVolumeClaims', icon: icons.pvc },
        { name: 'StatefulSets', kind: 'StatefulSets', icon: icons.sts || icons.statefulset },
        { name: 'DaemonSets', kind: 'DaemonSets', icon: icons.ds || icons.daemonset },
        { name: 'Jobs', kind: 'Jobs', icon: icons.job },
        { name: 'CronJobs', kind: 'CronJobs', icon: icons.cronjob },
    ];

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            shouldFilter={false}
            label="Global Command Menu"
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] p-4 bg-black/20 backdrop-blur-sm"
        >
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-200">
                <div className="flex items-center border-b border-border px-4 py-4">
                    <icons.search className={`mr-3 ${loading ? 'animate-pulse text-accent' : 'text-primary'}`} size={22} />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder={`${t('search_placeholder')} (${shortcutText})`}
                        className="flex-1 bg-transparent text-lg outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="flex items-center gap-2">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                            ESC
                        </kbd>
                    </div>
                </div>

                <Command.List key={search} className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    <Command.Empty className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <icons.search size={40} className="text-muted-foreground/30" />
                            <p className="text-muted-foreground font-medium">{t('search_no_results')}</p>
                        </div>
                    </Command.Empty>

                    {results.length > 0 && (
                        <Command.Group heading={t('search_results') || "Search Results"} className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent/90">
                            <div className="mt-2 space-y-1">
                                    {results.map((res, i) => (
                                        <Command.Item
                                            key={`${res.kind}-${res.name}-${i}`}
                                            value={`${res.kind}-${res.name}-${i}`}
                                            onSelect={() => runCommand(() => navigate(`/resources/${res.kind}/${res.namespace || '-'}/${res.name}`))}
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-muted group-aria-selected:bg-white/20 transition-colors">
                                                    <div className="text-foreground group-aria-selected:text-primary-foreground">
                                                        {res.kind === 'Pod' ? <icons.pod size={16} /> : 
                                                         res.kind === 'Service' ? <icons.service size={16} /> :
                                                         res.kind === 'Deployment' ? <icons.deployment size={16} /> :
                                                         <icons.box size={16} />}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground group-aria-selected:text-primary-foreground">{res.name}</span>
                                                    {res.namespace && <span className="text-[10px] text-muted-foreground group-aria-selected:text-primary-foreground/70">{res.namespace}</span>}
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-black uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md group-aria-selected:bg-white/20 group-aria-selected:text-primary-foreground">
                                                {res.kind}
                                            </span>
                                        </Command.Item>
                                    ))}
                            </div>
                        </Command.Group>
                    )}

                    {results.length > 0 && <div className="h-px bg-border/50 my-3 mx-2" />}

                    <Command.Group heading={t('search_resources')} className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {resourceTypes.map((res) => (
                                <Command.Item
                                    key={res.kind}
                                    value={res.kind}
                                    onSelect={() => runCommand(() => navigate(`/resources/${res.kind}`))}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-all group"
                                >
                                    <div className="p-1.5 rounded-lg bg-muted group-aria-selected:bg-white/20 transition-colors">
                                        <div className="text-foreground group-aria-selected:text-primary-foreground">
                                            <res.icon size={18} />
                                        </div>
                                    </div>
                                    <span className="font-semibold text-sm text-foreground group-aria-selected:text-primary-foreground">{res.name}</span>
                                </Command.Item>
                            ))}
                        </div>
                    </Command.Group>

                    <div className="h-px bg-border/50 my-3 mx-2" />

                    <Command.Group heading={t('search_actions')} className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                        <div className="mt-2 space-y-1">
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/settings'))}
                                value="settings"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-all group"
                            >
                                <div className="p-1.5 rounded-lg bg-muted group-aria-selected:bg-white/20 transition-colors">
                                    <div className="text-foreground group-aria-selected:text-primary-foreground">
                                        <icons.settings size={18} />
                                    </div>
                                </div>
                                <span className="font-semibold text-sm text-foreground group-aria-selected:text-primary-foreground">{t('settings')}</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => navigate('/rbac/status'))}
                                value="admin-panel"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground transition-all group"
                            >
                                <div className="p-1.5 rounded-lg bg-muted group-aria-selected:bg-white/20 transition-colors">
                                    <div className="text-foreground group-aria-selected:text-primary-foreground">
                                        <icons.admin_panel size={18} />
                                    </div>
                                </div>
                                <span className="font-semibold text-sm text-foreground group-aria-selected:text-primary-foreground">{t('admin_panel')}</span>
                            </Command.Item>
                        </div>
                    </Command.Group>
                </Command.List>
                
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-4 uppercase tracking-widest font-bold">
                        <span className="flex items-center gap-1.5"><icons.chevron_right size={10} className="text-primary" /> select</span>
                        <span className="flex items-center gap-1.5"><icons.refresh size={10} className="text-primary" /> navigate</span>
                    </div>
                    <span className="uppercase tracking-widest font-bold">K-View Global Search</span>
                </div>
            </div>
        </Command.Dialog>
    );
}
