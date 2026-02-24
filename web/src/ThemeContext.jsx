import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [themes, setThemes] = useState({});
    const [activeTheme, setActiveTheme] = useState(localStorage.getItem('kview-theme') || 'dark');
    const [icons, setIcons] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadThemes = async () => {
            const modules = import.meta.glob('/src/templates/*.js');
            const allThemes = {};
            let globalIcons = {};

            for (const path in modules) {
                const module = await modules[path]();
                const template = module.default;
                if (template && template.themes) {
                    Object.assign(allThemes, template.themes);
                }
                // Use icons from the main k-view template as the global icon set
                if (template && template.id === 'k-view' && template.icons) {
                    globalIcons = template.icons;
                }
            }

            setThemes(allThemes);
            setIcons(globalIcons);

            // Default to 'dark' theme if current one doesn't exist
            if (!allThemes[activeTheme]) {
                setActiveTheme('dark');
            }
            setLoading(false);
        };

        loadThemes();
    }, []);

    const themeConfig = themes[activeTheme];

    useEffect(() => {
        if (!themeConfig) return;

        const root = document.documentElement;
        root.className = ''; // Reset classes
        root.classList.add(`theme-${activeTheme}`);

        // Inject CSS variables
        Object.entries(themeConfig.variables || {}).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        localStorage.setItem('kview-theme', activeTheme);
    }, [activeTheme, themeConfig]);

    const value = {
        themes,
        activeTheme,
        setTheme: setActiveTheme,
        icons,
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
