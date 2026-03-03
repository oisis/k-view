import React from 'react';
import DetailRow from '../DetailRow';
import ContainerDetails from '../ContainerDetails';

/**
 * ContainersSection - RESTORED FROZEN VIEW FROM MAIN
 * Rewritten to be DOM-safe (wraps rows in table if needed).
 */
export default function ContainersSection({ containers = [], initContainers = [], ephemeralContainers = [], statuses = [], t }) {
    const hasContainers = (containers || []).length > 0;
    const hasInit = (initContainers || []).length > 0;
    const hasEphemeral = (ephemeralContainers || []).length > 0;

    if (!hasContainers && !hasInit && !hasEphemeral) return null;

    return (
        <div className="bg-glass glass rounded-2xl border border-border overflow-hidden shadow-xl">
            <table className="w-full text-sm text-left border-collapse">
                <tbody className="divide-y divide-border">
                    <DetailRow label={t('containers')}>
                        <div className="space-y-4 py-2">
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
                        </div>
                    </DetailRow>
                </tbody>
            </table>
        </div>
    );
}
