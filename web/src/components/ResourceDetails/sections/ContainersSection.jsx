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
                        container={c}
                        isPod={isPod}
                        t={t}
                        namespace={namespace}
                    />
                ))}
                {podSpec.initContainers?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-600/50">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Init Containers</p>
                        <div className="space-y-4">
                            {podSpec.initContainers.map(c => (
                                <ContainerDetails
                                    key={c.name}
                                    container={c}
                                    isPod={isPod}
                                    t={t}
                                    namespace={namespace}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DetailRow>
    );
}
