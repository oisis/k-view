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
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/25 blur-[120px] animate-mesh" />
                <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-info/25 blur-[120px] animate-mesh [animation-delay:2s]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-accent/25 blur-[100px] animate-mesh [animation-delay:4s]" />
            </div>

            {/* Persistent Sidebar */}
            <div className="relative z-20 flex h-full">
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
