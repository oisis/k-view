import React from 'react';
import DetailSection from '../DetailSection';
import CommonTable from '../../Common/CommonTable';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function NetworkPolicyOverview({ spec, t }) {
    const { icons: themeIcons } = useTheme();

    const ingressRules = (spec?.ingress || []).map((r, i) => ({
        id: i,
        from: r.from,
        ports: r.ports
    }));

    const egressRules = (spec?.egress || []).map((r, i) => ({
        id: i,
        to: r.to,
        ports: r.ports
    }));

    const ruleColumns = [
        { header: 'Source / Destination (Peers)', accessor: (r) => <ExpandableCell value={r.from || r.to || []} type="peers" icons={themeIcons} /> },
        { header: 'Allowed Ports', accessor: (r) => <ExpandableCell value={(r.ports || []).map(p => `${p.port}/${p.protocol}`)} type="ports" icons={themeIcons} /> }
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-[var(--bg-sidebar)]/10 text-[10px] font-black uppercase tracking-widest text-text-muted border-b border-border">
                                <th className="px-6 py-2 text-center border-r border-border">Pod Selector</th>
                                <th className="px-6 py-2 text-center">Policy Types</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-primary font-bold align-middle">
                                <td className="px-6 py-4 text-center border-r border-border">
                                    <ExpandableCell value={spec?.podSelector?.matchLabels || {}} type="labels" icons={themeIcons} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {spec?.policyTypes?.join(', ') || '—'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </DetailSection>

            <CommonTable title="Ingress Rules (Incoming Traffic)" columns={ruleColumns} data={ingressRules} t={t} />
            <CommonTable title="Egress Rules (Outgoing Traffic)" columns={ruleColumns} data={egressRules} t={t} />
        </div>
    );
}
