import React from 'react';
import { Link } from 'react-router-dom';
import DetailSection from './DetailSection';
import ExpandableCell from './ExpandableCell';
import ResourceActionMenu from '../ResourceActionMenu';

export default function JobsTable({ title, jobs, t, kind, namespace }) {
    return (
        <DetailSection title={title} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-secondary border-b border-border bg-white/5 uppercase text-[10px] tracking-widest font-bold">
                            <th className="px-4 py-3 text-left">{t('label_name')}</th>
                            <th className="px-4 py-3 text-left">{t('label_namespace')}</th>
                            <th className="px-4 py-3 text-left">Images</th>
                            <th className="px-4 py-3 text-left">Labels</th>
                            <th className="px-4 py-3 text-center">Pods</th>
                            <th className="px-4 py-3 text-right">Created</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-4 py-8 text-center text-text-muted italic">
                                    No jobs found.
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-2">
                                        <Link to={`/jobs/${job.namespace}/${job.name}`} className="font-bold text-accent hover:underline font-mono">
                                            {job.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-secondary font-medium">{job.namespace}</td>
                                    <td className="px-4 py-2">
                                        <ExpandableCell value={job.extra?.images} type="images" />
                                    </td>
                                    <td className="px-4 py-2">
                                        <ExpandableCell value={job.extra?.labels} type="labels" />
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold text-primary">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${job.extra?.pods?.startsWith('0/') ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                                            {job.extra?.pods || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-text-muted font-mono text-xs">{job.age}</td>
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
