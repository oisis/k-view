import React, { useState, useEffect } from 'react';
import DetailSection from './DetailSection';
import { cn } from "@/lib/utils";

export default function EventsTab({ kind, namespace, name, t }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchEvents = async () => {
            try {
                const nsPath = namespace && namespace !== '-' ? `/${namespace}` : '/-';
                const res = await fetch(`/api/resources/${kind}${nsPath}/${name}/events`);
                if (res.ok) {
                    const data = await res.json();
                    if (mounted) setEvents(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error('Failed to fetch events:', e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchEvents();
        return () => { mounted = false; };
    }, [kind, namespace, name]);

    if (loading) {
        return (
            <DetailSection title={t('recent_events')} className="flex-1 min-h-[400px]">
                <div className="p-8 text-center text-muted-foreground font-medium">{t('loading')}...</div>
            </DetailSection>
        );
    }

    return (
        <DetailSection title={t('recent_events')} className="flex-1 min-h-[400px]">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-muted/50 border-b-2 border-border">
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/60">{t('label_name')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/60">{t('reason')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/60">{t('message')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/60">{t('label_source')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/60">Sub-object</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center border-r border-border/60">{t('label_count')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-r border-border/60">First Seen</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Seen</th>
                    </tr>
                </thead>
                <tbody className="text-left">
                    {events && events.length > 0 ? (events || []).map((e, i) => (
                        <tr key={i} className="hover:bg-muted/50 transition-colors group">
                            <td className="px-6 py-4 border-b border-border border-r border-border/40">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[11px] font-mono font-semibold border",
                                    e.type === 'Warning' 
                                        ? 'bg-destructive/10 text-destructive border-destructive/20' 
                                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                )}>
                                    {e.name || '—'}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-foreground border-b border-border border-r border-border/40">{e.reason}</td>
                            <td className="px-6 py-4 text-foreground max-w-md break-words leading-relaxed border-b border-border border-r border-border/40">{e.message}</td>
                            <td className="px-6 py-4 text-muted-foreground text-xs italic border-b border-border border-r border-border/40">
                                {e.source?.component || e.source || '—'}
                            </td>
                            <td className="px-6 py-4 text-foreground text-[11px] font-mono break-all max-w-[150px] opacity-80 border-b border-border border-r border-border/40">
                                {e.subObject || '—'}
                            </td>
                            <td className="px-6 py-4 text-foreground text-center font-mono font-bold border-b border-border border-r border-border/40">
                                {e.count || 1}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap border-b border-border border-r border-border/40">
                                {e.firstSeen || e.age || '—'}
                            </td>
                            <td className="px-6 py-4 text-foreground font-semibold whitespace-nowrap text-xs border-b border-border">
                                {e.lastSeen || e.age || '—'}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-muted-foreground italic">
                                {t('no_events')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </DetailSection>
    );
}
