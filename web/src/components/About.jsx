import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function About() {
    const [version, setVersion] = useState("Loading...");

    useEffect(() => {
        fetch('/api/version')
            .then(res => res.json())
            .then(data => setVersion(data.version || "unknown"))
            .catch(() => setVersion("unknown"));
    }, []);

    return (
        <div className="flex-1 overflow-auto bg-[var(--bg-main)]">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">About K-View</h1>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Information about the application.</p>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden glass shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-info/10 text-info rounded-xl border border-info/20">
                                <Info size={32} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Version Information</h2>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Current build version of the application image.</p>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-[var(--border-color)] pt-6">
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Image Version</dt>
                                    <dd className="mt-1 text-2xl font-mono text-[var(--text-white)]">{version}</dd>
                                </div>
                                <div className="pt-2">
                                    <dt className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)]">Homepage</dt>
                                    <dd className="mt-1">
                                        <a href="https://github.com/oisis/k-view" target="_blank" rel="noopener noreferrer" className="text-info hover:text-info/80 transition-colors underline decoration-dotted underline-offset-4 font-mono text-sm">
                                            https://github.com/oisis/k-view
                                        </a>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
