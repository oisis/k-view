import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function JobsTable({ title, jobs, t, kind, namespace }) {
    return (
        <DetailSection title={title} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-muted)]/50 border-b-2 border-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-center">Pods</th>
                            <th className="px-4 py-3 text-left">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-[var(--text-muted)] italic">
                                    No jobs found.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2">
                                        <Link to={`/jobs/${job.namespace}/${job.name}`} className="font-bold text-[var(--accent)] hover:underline font-mono">
                                            {job.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-secondary)]">{job.namespace}</td>
                                    <td className="px-4 py-2">
                                        <ExpandableCell value={job.extra?.images} type="images" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <ExpandableCell value={job.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold text-[var(--text-primary)]">
                                        {job.extra?.ready || '1/1'}
                                    </td>
                                    <td className="px-4 py-2 text-[var(--text-muted)]">{job.age}</td>
                                    <td className="px-4 py-2 text-right">
                                        <ResourceActionMenu
                                            kind="jobs"
                                            namespace={job.namespace}
                                            name={job.name}
                                            onRefresh={() => window.location.reload()}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
