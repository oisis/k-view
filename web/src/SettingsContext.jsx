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
                const anonSaved = localStorage.getItem('kview-settings-anonymous');
                if (anonSaved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(anonSaved) });
                else setSettings(DEFAULT_SETTINGS);
            }
        } catch (e) {
            setSettings(DEFAULT_SETTINGS);
        }
    }, [settingsKey, scope]);

    // Sync settings across tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === settingsKey && e.newValue) {
                try {
                    const newSettings = JSON.parse(e.newValue);
                    setSettings(prev => ({ ...prev, ...newSettings }));
                } catch (err) { }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [settingsKey]);

    useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }, [settings, settingsKey]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, setScope }}>
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
