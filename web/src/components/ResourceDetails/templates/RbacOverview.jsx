import React from 'react';
import DetailSection from '../DetailSection';
import SubjectsTable from '../SubjectsTable';
import RulesTable from '../RulesTable';

export default function RbacOverview({ data, metadata, t, isBinding }) {
    const roleRef = data?.roleRef || data?.Object?.roleRef;
    const subjects = data?.subjects || data?.Object?.subjects || [];
    const rules = data?.rules || data?.Object?.rules || [];

    return (
        <>
            {isBinding ? (
                <>
                    <DetailSection title={t('resource_info') || "Role Reference"}>
                        <table className="w-full text-sm text-left border-collapse">
                            <tbody className="divide-y divide-slate-600">
                                <tr className="border-b border-slate-600">
                                    <td className="px-4 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] w-1/4">Role Reference</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                                                                         <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-wider">                                                {roleRef?.kind || '—'}
                                            </span>
                                            <span className="font-mono text-info font-bold">{roleRef?.name || '—'}</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </DetailSection>
                    {subjects.length > 0 && <SubjectsTable subjects={subjects} t={t} />}
                </>
            ) : (
                <RulesTable rules={rules} t={t} />
            )}
        </>
    );
}
