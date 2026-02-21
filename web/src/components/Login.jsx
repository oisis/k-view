import React, { useState } from 'react';

export default function Login() {
    const [devError, setDevError] = useState(null);

    const handleLogin = () => {
        window.location.href = '/api/auth/login';
    };

    const handleDevLogin = async () => {
        setDevError(null);
        try {
            const res = await fetch('/api/auth/dev-login', { method: 'POST' });
            if (!res.ok) {
                const body = await res.json();
                setDevError(body.error || 'Dev login failed');
                return;
            }
            window.location.href = '/';
        } catch (e) {
            setDevError('Dev login failed');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)]">
            <div className="bg-[var(--bg-card)] p-8 rounded-lg shadow-xl max-w-sm w-full border border-[var(--border-color)]">
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2">K-View</h1>
                    <p className="text-[var(--text-secondary)]">Kubernetes Dashboard</p>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors mb-4"
                >
                    Sign in with Google OIDC
                </button>

                {/* Dev Login button — always visible, backend returns 403 in production */}
                <div className="border-t border-[var(--border-color)] pt-4 relative z-10">
                    <p className="text-[10px] text-[var(--text-muted)] text-center mb-3 uppercase font-bold tracking-wider">Development</p>
                    <button
                        onClick={handleDevLogin}
                        className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-800 transition-colors"
                    >
                        ⚡ Dev Login (admin@kview.local)
                    </button>
                    {devError && (
                        <p className="text-red-400 text-xs text-center mt-2">{devError}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
