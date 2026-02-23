import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
    clusterName: '',
    defaultNamespace: '',
    itemsPerPage: 10,
    labelsLimit: 5,
    logsRefreshInterval: 5,
    resourceRefreshInterval: 5,
    locale: 'en'
};

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('kview-settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch (e) {
            console.error('Failed to load settings:', e);
            return DEFAULT_SETTINGS;
        }
    });

    useEffect(() => {
        localStorage.setItem('kview-settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

export function useTranslation() {
    const { settings } = useSettings();
    const locale = settings.locale || 'en';

    const t = (key, params = {}) => {
        const langDict = translations[locale] || translations.en;
        let val = langDict[key] || translations.en[key] || key;

        if (params) {
            Object.keys(params).forEach(p => {
                val = val.replace(`{${p}}`, params[p]);
            });
        }

        return val;
    };

    return { t, locale };
}
