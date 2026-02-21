import React, { useState, useEffect } from 'react';

export default function Login() {
    const [devError, setDevError] = useState(null);
    const [loginError, setLoginError] = useState(null);
    const [providers, setProviders] = useState({ oidc: false, local: false });
    const [loading, setLoading] = useState(true);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Fetch available providers
        fetch('/api/auth/providers')
            .then(r => r.ok ? r.json() : { oidc: true, local: false }) // Fallback if endpoint fails
            .then(data => {
                setProviders(data);
                setLoading(false);
            })
            .catch(() => {
                // If anything fails, assume OIDC only for safety
                setProviders({ oidc: true, local: false });
                setLoading(false);
            });
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/login';
    };

    const handleLocalSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setSubmitting(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const body = await res.json();
                setLoginError(body.error || 'Authentication failed');
                setSubmitting(false);
                return;
            }

            const data = await res.json();
            if (data.token) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                // Redirect will be handled organically by App.jsx mounting or refreshing
                window.location.href = '/';
            }
        } catch (err) {
            setLoginError('Network error during login');
            setSubmitting(false);
        }
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

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-[var(--bg-main)] text-[var(--text-secondary)]">Checking authentication settings...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)]">
            <div className="bg-[var(--bg-card)] p-8 rounded-lg shadow-xl max-w-sm w-full border border-[var(--border-color)]">
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2">K-View</h1>
                    <p className="text-[var(--text-secondary)]">Kubernetes Dashboard</p>
                </div>

                {providers.oidc && (
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors mb-4"
                    >
                        Sign in with Google OIDC
                    </button>
                )}

                {providers.oidc && providers.local && (
                    <div className="relative my-6 opacity-60">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--border-color)]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[var(--bg-card)] text-[var(--text-secondary)]">or</span>
                        </div>
                    </div>
                )}

                {providers.local && (
                    <form onSubmit={handleLocalSubmit} className="space-y-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Username</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                        {loginError && (
                            <p className="text-red-400 text-xs text-center">{loginError}</p>
                        )}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#238636] hover:bg-[#2ea043] focus:outline-none transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {!providers.oidc && !providers.local && (
                    <div className="text-center p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm mb-4">
                        No authentication providers are configured on the server.
                    </div>
                )}

                {/* Dev Login button — always visible, backend returns 403 in production */}
                <div className="border-t border-[var(--border-color)] mt-6 pt-4 relative z-10">
                    <p className="text-[10px] text-[var(--text-muted)] text-center mb-3 uppercase font-bold tracking-wider">Development</p>
                    <button
                        onClick={handleDevLogin}
                        className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-yellow-500 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-800 transition-colors"
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
