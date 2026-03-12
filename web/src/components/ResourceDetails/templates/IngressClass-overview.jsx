import React from 'react';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function IngressClassOverview({ spec, t }) {
    const { icons } = useTheme();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center">Controller</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-foreground align-middle">
                                <td className="px-6 py-4 text-center">{spec?.controller || '—'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </div>
    );
}
