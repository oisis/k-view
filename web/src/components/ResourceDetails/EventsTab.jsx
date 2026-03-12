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
                    <tr className="bg-muted/50">
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('label_name')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('reason')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('message')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('label_source')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sub-object</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">{t('label_count')}</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">First Seen</th>
                        <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Seen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border text-left">
                    {events && events.length > 0 ? (events || []).map((e, i) => (
                        <tr key={i} className="hover:bg-muted/50 transition-colors group">
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[11px] font-mono font-semibold border",
                                    e.type === 'Warning' 
                                        ? 'bg-destructive/10 text-destructive border-destructive/20' 
                                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                )}>
                                    {e.name || '—'}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-foreground">{e.reason}</td>
                            <td className="px-6 py-4 text-foreground max-w-md break-words leading-relaxed">{e.message}</td>
                            <td className="px-6 py-4 text-muted-foreground text-xs italic">
                                {e.source?.component || e.source || '—'}
                            </td>
                            <td className="px-6 py-4 text-foreground text-[11px] font-mono break-all max-w-[150px] opacity-80">
                                {e.subObject || '—'}
                            </td>
                            <td className="px-6 py-4 text-foreground text-center font-mono font-bold">
                                {e.count || 1}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                                {e.firstSeen || e.age || '—'}
                            </td>
                            <td className="px-6 py-4 text-foreground font-semibold whitespace-nowrap text-xs">
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
