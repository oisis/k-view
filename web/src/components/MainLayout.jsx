import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import CreateResourceModal from './CreateResourceModal';
import background from '../assets/background.png';

export default function MainLayout({ 
    user, 
    onLogout, 
    isCollapsed, 
    setIsCollapsed, 
    isCreateModalOpen, 
    setIsCreateModalOpen, 
    namespaces 
}) {
    // If no user, redirect to login (Guard)
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen text-foreground relative overflow-hidden transition-colors duration-200 font-sans selection:bg-primary/30">
            {/* Shared Background Layer */}
            <div
                className="absolute inset-0 pointer-events-none z-0 transition-all duration-500"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 'var(--wallpaper-opacity, 0.6)',
                    filter: `grayscale(var(--wallpaper-grayscale, 0%)) brightness(var(--wallpaper-brightness, 0.6))`,
                }}
            />
            <div className="absolute inset-0 pointer-events-none z-0 bg-background/25 backdrop-blur-[1px]" />
            
            {/* Persistent Sidebar */}
            <div className="relative z-10 flex h-full">
                <Sidebar
                    user={user}
                    onLogout={onLogout}
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    onCreateResource={() => setIsCreateModalOpen(true)}
                />
            </div>

            {/* Global Modals maintained in Layout state */}
            <CreateResourceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                namespaces={namespaces}
            />

            {/* Variable Content Area */}
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
}
