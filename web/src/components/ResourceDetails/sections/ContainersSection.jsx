import React from 'react';
import DetailRow from '../DetailRow';
import ContainerDetails from '../ContainerDetails';

export default function ContainersSection({ podSpec, isPod, t, namespace }) {
    if (!podSpec.containers && !podSpec.initContainers) return null;

    return (
        <DetailRow label={t('containers')}>
            <div className="space-y-4">
                {(podSpec.containers || []).map(c => (
                    <ContainerDetails
                        key={c.name}
                        containers={[c]}
                        t={t}
                    />
                ))}
                {podSpec.initContainers?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4">Init Containers</p>
                        <div className="space-y-4">
                            {podSpec.initContainers.map(c => (
                                <ContainerDetails
                                    key={c.name}
                                    containers={[c]}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DetailRow>
    );
}
