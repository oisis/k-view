import React, { useState, useEffect } from 'react';

export default function Login() {
    const [devError, setDevError] = useState(null);
    const [loginError, setLoginError] = useState(null);
    const [providers, setProviders] = useState({ oidc: false, local: false, dev: false });
    const [loading, setLoading] = useState(true);
    const [showLocalLogin, setShowLocalLogin] = useState(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Check for URL errors (e.g. from SSO Callback)
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === 'unauthorized') {
            setLoginError('Your Google account is not authorized to access this dashboard. Please contact your administrator.');
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch available providers
        fetch('/api/auth/providers')
            .then(r => r.ok ? r.json() : { oidc: false, local: false, dev: false })
            .then(data => {
                setProviders(data);
                if (data.local && !data.oidc) {
                    setShowLocalLogin(true);
                }
                setLoading(false);
            })
            .catch(() => {
                setProviders({ oidc: false, local: false, dev: false });
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
                localStorage.setItem('token', data.token);
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
        return <div className="flex justify-center items-center min-h-screen text-muted-foreground">Checking authentication settings...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-card p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-border glass relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <div className="text-center mb-8 relative z-10">
                    <h1 className="text-3xl font-black text-primary mb-2 tracking-tight italic">K-View</h1>
                    <p className="text-muted-foreground font-medium text-sm uppercase tracking-widest opacity-70">Kubernetes Dashboard</p>
                </div>

                {loginError && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3"
                    >
                        <div className="text-destructive mt-0.5 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                        </div>
                        <p className="text-destructive text-xs font-bold leading-relaxed">{loginError}</p>
                    </motion.div>
                )}

                {providers.oidc && (
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all mb-4"
                    >
                        Sign in with Google OIDC
                    </button>
                )}

                {providers.local && (
                    <div className="mt-4 pt-4 text-center">
                        {!showLocalLogin ? (
                            <button
                                onClick={() => setShowLocalLogin(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 mx-auto bg-muted/30 px-4 py-2 rounded-lg border border-border/50 active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                Local user login
                            </button>
                        ) : providers.oidc && (
                            <div className="relative my-6 text-center border-t border-border/50">
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">Local Auth</span>
                            </div>
                        )}
                    </div>
                )}

                {providers.local && showLocalLogin && (
                    <form onSubmit={handleLocalSubmit} className="space-y-4 mb-4 mt-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Username</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border-2 border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border-2 border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-3 px-4 rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {submitting ? '...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {!providers.oidc && !providers.local && !loading && (
                    <div className="text-center p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs font-bold uppercase tracking-widest mb-4">
                        No auth providers configured
                    </div>
                )}

                {providers.dev && (
                    <div className="border-t border-border mt-8 pt-6 relative z-10 text-center">
                        <button
                            onClick={handleDevLogin}
                            className="w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-foreground bg-primary hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">⚡</span> Dev Login
                        </button>
                        {devError && (
                            <p className="text-destructive text-[10px] font-bold uppercase tracking-wider mt-3">{devError}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
