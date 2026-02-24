import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [templates, setTemplates] = useState({});
    const [activeTemplateId, setActiveTemplateId] = useState(localStorage.getItem('kview-template') || 'k-view');
    const [activeTheme, setActiveTheme] = useState(localStorage.getItem('kview-theme') || 'dark');
    const [loading, setLoading] = useState(true);

    // Dynamic loading of templates using Vite's import.meta.glob
    useEffect(() => {
        const loadTemplates = async () => {
            const modules = import.meta.glob('/src/templates/*.js');
            const loadedTemplates = {};

            for (const path in modules) {
                const module = await modules[path]();
                const template = module.default;
                if (template && template.id) {
                    loadedTemplates[template.id] = template;
                }
            }

            setTemplates(loadedTemplates);
            // Default to first template if current one doesn't exist
            if (!loadedTemplates[activeTemplateId]) {
                const firstId = Object.keys(loadedTemplates)[0];
                if (firstId) setActiveTemplateId(firstId);
            }
            setLoading(false);
        };

        loadTemplates();
    }, []);

    const template = templates[activeTemplateId] || templates['standard'];
    const themeConfig = template?.themes[activeTheme] || template?.themes[Object.keys(template?.themes || {})[0]];

    useEffect(() => {
        if (!themeConfig) return;

        const root = document.documentElement;
        // Reset classes
        root.className = '';
        root.classList.add(`template-${activeTemplateId}`);
        root.classList.add(`theme-${activeTheme}`);

        // Inject CSS variables
        Object.entries(themeConfig.variables || {}).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        localStorage.setItem('kview-template', activeTemplateId);
        localStorage.setItem('kview-theme', activeTheme);
    }, [activeTemplateId, activeTheme, themeConfig]);

    const value = {
        templates: Object.values(templates),
        activeTemplate: template,
        activeTheme,
        setTheme: setActiveTheme,
        setTemplate: setActiveTemplateId,
        icons: template?.icons || {},
        loading
    };

    return (
        <ThemeContext.Provider value={value}>
            {!loading && children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
