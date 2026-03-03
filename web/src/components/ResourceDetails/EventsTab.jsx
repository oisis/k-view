import React, { useState, useEffect } from 'react';
import DetailSection from './DetailSection';

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
                <div className="p-8 text-center text-text-muted">{t('loading')}</div>
            </DetailSection>
        );
    }

    return (
        <DetailSection title={t('recent_events')} className="flex-1 min-h-[400px]">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr>
                        <th className="px-6 py-3">{t('label_name')}</th>
                        <th className="px-6 py-3">{t('reason')}</th>
                        <th className="px-6 py-3">{t('message')}</th>
                        <th className="px-6 py-3">{t('label_source')}</th>
                        <th className="px-6 py-3">Sub-object</th>
                        <th className="px-6 py-3 text-center">{t('label_count')}</th>
                        <th className="px-6 py-3">First Seen</th>
                        <th className="px-6 py-3">Last Seen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-left">
                    {events && events.length > 0 ? (events || []).map((e, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${e.type === 'Warning' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                    {e.name || '—'}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-[var(--text-white)]">{e.reason}</td>
                            <td className="px-6 py-4 text-secondary max-w-md break-words">{e.message}</td>
                            <td className="px-6 py-4 text-text-muted text-xs">
                                {e.source?.component || e.source || '—'}
                            </td>
                            <td className="px-6 py-4 text-secondary text-xs font-mono break-all max-w-[150px]">
                                {e.subObject || '—'}
                            </td>
                            <td className="px-6 py-4 text-secondary text-center font-bold">
                                {e.count || 1}
                            </td>
                            <td className="px-6 py-4 text-text-muted whitespace-nowrap text-xs">
                                {e.firstSeen || e.age || '—'}
                            </td>
                            <td className="px-6 py-4 text-primary font-bold whitespace-nowrap text-xs">
                                {e.lastSeen || e.age || '—'}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-text-muted">
                                {t('no_events')}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </DetailSection>
    );
}
