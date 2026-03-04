import React from 'react';
import DetailSection from '../DetailSection';
import ExpandableCell from '../ExpandableCell';
import { useTheme } from '../../../ThemeContext';

export default function EndpointsOverview({ data, spec, t, icons }) {
    const { icons: themeIcons } = useTheme();
    const subsets = spec?.subsets || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <DetailSection title="Resource Info">
                <div className="glass rounded-2xl border border-border p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 block text-center">Subsets</span>
                    <div className="space-y-4">
                        {subsets.map((s, i) => (
                            <div key={i} className="bg-sidebar/10 p-4 rounded-xl border border-border/30">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] text-text-muted uppercase font-bold block mb-1">Addresses</span>
                                        <ExpandableCell value={(s.addresses || []).map(a => a.ip)} type="endpoints" icons={themeIcons} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-text-muted uppercase font-bold block mb-1">Ports</span>
                                        <ExpandableCell value={(s.ports || []).map(p => `${p.port}/${p.protocol}`)} type="ports" icons={themeIcons} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {subsets.length === 0 && <div className="text-center text-text-muted italic">No subsets defined</div>}
                    </div>
                </div>
            </DetailSection>
        </div>
    );
}
