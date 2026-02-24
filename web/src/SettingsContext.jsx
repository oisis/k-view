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
    const [scope, setScope] = useState('anonymous');
    const settingsKey = `kview-settings-${scope}`;

    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(`kview-settings-anonymous`);
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    });

    // Reload settings when scope changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            if (saved) {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } else if (scope !== 'anonymous') {
                // If switching to a user who has no settings, try to inherit from anonymous or use defaults
                const anonSaved = localStorage.getItem('kview-settings-anonymous');
                if (anonSaved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(anonSaved) });
                else setSettings(DEFAULT_SETTINGS);
            }
        } catch (e) {
            setSettings(DEFAULT_SETTINGS);
        }
    }, [settingsKey, scope]);

    useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }, [settings, settingsKey]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, setScope }}>
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
