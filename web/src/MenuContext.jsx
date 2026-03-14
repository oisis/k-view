import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const MenuContext = createContext();

export function MenuProvider({ children }) {
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [activeMenuRect, setActiveMenuRect] = useState(null);

    const openMenu = useCallback((id, rect) => {
        setActiveMenuId(id);
        setActiveMenuRect(rect);
    }, []);

    const closeMenu = useCallback(() => {
        setActiveMenuId(null);
        setActiveMenuRect(null);
    }, []);

    const toggleMenu = useCallback((id, rect) => {
        if (activeMenuId === id) {
            closeMenu();
        } else {
            openMenu(id, rect);
        }
    }, [activeMenuId, openMenu, closeMenu]);

    // Close menu on scroll or resize to prevent positioning issues
    useEffect(() => {
        if (!activeMenuId) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') closeMenu();
        };

        window.addEventListener('keydown', handleEscape);
        window.addEventListener('resize', closeMenu);
        
        return () => {
            window.removeEventListener('keydown', handleEscape);
            window.removeEventListener('resize', closeMenu);
        };
    }, [activeMenuId, closeMenu]);

    return (
        <MenuContext.Provider value={{ activeMenuId, activeMenuRect, openMenu, closeMenu, toggleMenu }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
}
