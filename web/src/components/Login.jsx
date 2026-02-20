import React from 'react';

export default function Login() {
    const handleLogin = () => {
        window.location.href = '/api/auth/login';
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
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors"
                >
                    Sign in with Google OIDC
                </button>
            </div>
        </div>
    );
}
