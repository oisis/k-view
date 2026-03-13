import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import CreateResourceModal from './CreateResourceModal';

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
        <div className="flex h-screen w-full relative overflow-hidden">
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
