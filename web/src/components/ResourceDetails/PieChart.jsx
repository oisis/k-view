import React from 'react';

export default function PieChart({ percent, label, subLabel, color = 'var(--accent)' }) {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-700/30"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{percent.toFixed(1)}%</span>
                </div>
            </div>
            <div className="mt-2 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
                <div className="text-xs font-mono text-[var(--text-secondary)]">{subLabel}</div>
            </div>
        </div>
    );
}
