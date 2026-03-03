import React from 'react';

/**
 * Global ErrorBoundary Component to prevent WSoD.
 * Catches JavaScript errors anywhere in their child component tree.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Glassmorphism styled fallback UI
            return (
                <div className="p-8">
                    <div className="bg-glass glass border border-red-500/30 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-primary tracking-tight">Component Rendering Error</h2>
                                <p className="text-sm text-text-muted">A critical error occurred while rendering this section.</p>
                            </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-6 overflow-auto max-h-48 font-mono text-xs text-red-400/90 leading-relaxed">
                            {this.state.error?.toString()}
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
