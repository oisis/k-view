import React from 'react';
import DetailSection from '../DetailSection';
import DetailRow from '../DetailRow';

export default function StorageClassOverview({ data, spec, t }) {
    // StorageClass fields are often at the root of the object
    const parameters = data.parameters || spec?.parameters || {};

    return (
        <>
            <DetailSection title="Parameters" className="mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 w-1/3 text-center">Parameter</th>
                                <th className="px-4 py-3 text-center">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {Object.keys(parameters).length === 0 ? (
                                <tr><td colSpan="2" className="px-4 py-8 text-center text-text-muted italic">No parameters defined.</td></tr>
                            ) : (
                                Object.entries(parameters).map(([k, v]) => (
                                    <tr key={k} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-primary text-center">{k}</td>
                                        <td className="px-4 py-3 font-mono text-info text-center">{v}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DetailSection>
        </>
    );
}
