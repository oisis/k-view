import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const SettingsContext = createContext();

const GLOBAL_CLUSTER_NAME_KEY = 'kview-global-cluster-name';

const DEFAULT_SETTINGS = {
    clusterName: localStorage.getItem(GLOBAL_CLUSTER_NAME_KEY) || '',
    defaultNamespace: '',
    itemsPerPage: 10,
    labelsLimit: 5,
    logsRefreshInterval: 5,
    resourceRefreshInterval: 5,
    tableDensity: 'comfortable',
    locale: 'en'
};

export function SettingsProvider({ children }) {
    const [scope, setScope] = useState('anonymous');
    const settingsKey = `kview-settings-${scope}`;

    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(`kview-settings-anonymous`);
            const base = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
            // Always enforce global cluster name on init
            base.clusterName = localStorage.getItem(GLOBAL_CLUSTER_NAME_KEY) || base.clusterName || '';
            return base;
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    });

    // Reload settings when scope changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            const globalName = localStorage.getItem(GLOBAL_CLUSTER_NAME_KEY) || '';
            
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed, clusterName: globalName || parsed.clusterName || '' });
            } else if (scope !== 'anonymous') {
                const anonSaved = localStorage.getItem('kview-settings-anonymous');
                if (anonSaved) {
                    const parsedAnon = JSON.parse(anonSaved);
                    setSettings({ ...DEFAULT_SETTINGS, ...parsedAnon, clusterName: globalName || parsedAnon.clusterName || '' });
                }
                else setSettings({ ...DEFAULT_SETTINGS, clusterName: globalName });
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
            if (e.key === GLOBAL_CLUSTER_NAME_KEY) {
                setSettings(prev => ({ ...prev, clusterName: e.newValue || '' }));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [settingsKey]);

    useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        if (settings.clusterName !== undefined) {
            localStorage.setItem(GLOBAL_CLUSTER_NAME_KEY, settings.clusterName);
        }
    }, [settings, settingsKey]);

    const updateSettings = (newSettings) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            if (newSettings.clusterName !== undefined) {
                localStorage.setItem(GLOBAL_CLUSTER_NAME_KEY, newSettings.clusterName);
            }
            return updated;
        });
    };

    const resetSettings = () => {
        const reset = { ...DEFAULT_SETTINGS, clusterName: '' };
        localStorage.removeItem(GLOBAL_CLUSTER_NAME_KEY);
        setSettings(reset);
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
