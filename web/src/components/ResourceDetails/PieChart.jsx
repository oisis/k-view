import React from 'react';

export default function PieChart({ percent, label, subLabel, color = 'var(--accent)' }) {
    const validPercent = isFinite(percent) ? Math.max(0, Math.min(100, percent)) : 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (validPercent / 100) * circumference;

    return (
        <div className="flex flex-col items-center group">
            <div className="relative w-32 h-32 transition-transform duration-300 group-hover:scale-105">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-slate-700/20"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={isNaN(offset) ? circumference : offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-primary drop-shadow-sm">{validPercent.toFixed(1)}%</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                <div className="text-xs font-black uppercase tracking-wider text-text-muted">{label}</div>
                <div className="text-xs font-mono text-secondary">{subLabel}</div>
            </div>
        </div>
    );
}
