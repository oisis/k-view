import React from 'react';
import DetailRow from '../DetailRow';
import ContainerDetails from '../ContainerDetails';

/**
 * Renders Pod containers (including init and ephemeral).
 * Handles flat container arrays safely.
 */
export default function ContainersSection({ containers = [], initContainers = [], ephemeralContainers = [], statuses = [], t }) {
    const hasContainers = (containers || []).length > 0;
    const hasInit = (initContainers || []).length > 0;
    const hasEphemeral = (ephemeralContainers || []).length > 0;

    if (!hasContainers && !hasInit && !hasEphemeral) {
        return (
            <DetailRow label={t('containers')}>
                <div className="px-6 py-4 text-center text-text-muted italic bg-sidebar/5 rounded-xl border border-dashed border-border/50">
                    No container definitions found in spec.
                </div>
            </DetailRow>
        );
    }

    return (
        <DetailRow label={t('containers')}>
            <div className="space-y-4">
                {/* Regular Containers */}
                {(containers || []).map(c => (
                    <ContainerDetails
                        key={c.name}
                        containers={[c]}
                        statuses={statuses}
                        t={t}
                    />
                ))}

                {/* Init Containers */}
                {hasInit && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Init Containers</p>
                        <div className="space-y-4">
                            {(initContainers || []).map(c => (
                                <ContainerDetails
                                    key={c.name}
                                    containers={[c]}
                                    statuses={statuses}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Ephemeral Containers */}
                {hasEphemeral && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">Ephemeral Containers</p>
                        <div className="space-y-4">
                            {(ephemeralContainers || []).map(c => (
                                <ContainerDetails
                                    key={c.name}
                                    containers={[c]}
                                    statuses={statuses}
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
