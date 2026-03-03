import React from 'react';
import DetailSection from '../DetailSection';
import SubjectsTable from '../SubjectsTable';
import RulesTable from '../RulesTable';

/**
 * RbacOverview - RESTORED FROZEN VIEW FROM MAIN
 * Rewritten to consume DTO.
 */
export default function RbacOverview({ data, metadata, spec, t, isBinding }) {
    if (!data) return null;

    // Map DTO spec to legacy variables
    const roleRef = spec?.roleRef || data.roleRef;
    const subjects = spec?.subjects || data.subjects || [];
    const rules = spec?.rules || data.rules || [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {isBinding ? (
                <>
                    <DetailSection title={t('resource_info') || "Role Reference"}>
                        <table className="w-full text-sm text-left border-collapse">
                            <tbody className="divide-y divide-border">
                                <tr className="border-b border-border">
                                    <td className="px-4 py-3 w-48 text-xs font-bold text-text-muted uppercase tracking-wider bg-[var(--bg-sidebar)]/10">Role Reference</td>
                                    <td className="px-4 py-3 text-sm text-primary">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-wider border border-purple-500/20">
                                                {roleRef?.kind || '—'}
                                            </span>
                                            <span className="font-mono text-info font-bold">{roleRef?.name || '—'}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </DetailSection>
                    <SubjectsTable subjects={subjects} t={t} />
                </>
            ) : (
                <RulesTable rules={rules} t={t} />
            )}
        </div>
    );
}
