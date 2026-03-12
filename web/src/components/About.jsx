import React, { useState, useEffect } from 'react';
import { useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';

export default function About() {
    const { t } = useTranslation();
    const { icons } = useTheme();
    const [version, setVersion] = useState(t('loading'));

    useEffect(() => {
        fetch('/api/version')
            .then(res => res.json())
            .then(data => setVersion(data.version || "unknown"))
            .catch(() => setVersion("unknown"));
    }, []);

    const InfoIcon = icons.about || icons.info;

    return (
        <div className="flex-1 overflow-auto text-foreground">
            <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('about_kview')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('about_desc')}</p>
                </div>

                <div className="bg-card border border-border rounded-xl overflow-hidden glass shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
                                {InfoIcon && <InfoIcon size={32} />}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{t('version_info')}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{t('version_info_desc')}</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <dl className="space-y-6">
                                <div>
                                    <dt className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('image_version')}</dt>
                                    <dd className="mt-1 text-2xl font-mono text-primary font-bold">{version}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('homepage')}</dt>
                                    <dd className="mt-1">
                                        <a href="https://github.com/oisis/k-view" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-colors font-mono text-sm">
                                            https://github.com/oisis/k-view
                                        </a>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('project_description_title')}</dt>
                                    <dd className="mt-1 text-sm text-foreground leading-relaxed">
                                        {t('project_summary')}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-bold tracking-wider uppercase text-muted-foreground">{t('project_author')}</dt>
                                    <dd className="mt-1 text-sm">
                                        <a href="https://github.com/oisis" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline transition-colors">
                                            OiSiS
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
