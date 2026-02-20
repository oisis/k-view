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
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2">K-View</h1>
                    <p className="text-gray-400">Kubernetes Dashboard</p>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors mb-4"
                >
                    Sign in with Google OIDC
                </button>

                {/* Dev Login button — always visible, backend returns 403 in production */}
                <div className="border-t border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 text-center mb-3">Development</p>
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
