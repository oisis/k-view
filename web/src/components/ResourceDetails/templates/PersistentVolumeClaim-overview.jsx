import React from 'react';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function PvcOverview({ data, metadata, spec, status, t }) {
    const { icons: themeIcons } = useTheme();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-4 py-2 text-center border-r border-border">Status</th>
                                <th className="px-4 py-2 text-center border-r border-border">Storage Class</th>
                                <th className="px-4 py-2 text-center border-r border-border">Volume name</th>
                                <th className="px-4 py-2 text-center border-r border-border">Capacity</th>
                                <th className="px-4 py-2 text-center">Access Modes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle text-center">
                                <td className="px-4 py-4 border-r border-border">{status?.phase || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">{spec?.storageClassName || '—'}</td>
                                <td className="px-4 py-4 border-r border-border font-mono text-xs">{spec?.volumeName || '—'}</td>
                                <td className="px-4 py-4 border-r border-border">{status?.capacity?.storage || '—'}</td>
                                <td className="px-4 py-4">
                                    <ExpandableCell value={spec?.accessModes || []} type="access-modes" icons={themeIcons} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </div>
    );
}
