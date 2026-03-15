import React from 'react';
import { motion } from 'framer-motion';

export default function RadialChart({ value, color = "#3b82f6", size = 80, strokeWidth = 8, label }) {
    const displayValue = Math.max(value || 0, 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (displayValue / 100) * circumference;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex items-center justify-center" 
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-sm">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted/10"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg font-black tracking-tighter"
                >
                    {Math.round(displayValue)}%
                </motion.span>
                {label && <span className="text-[8px] uppercase font-black text-muted-foreground/60">{label}</span>}
            </div>
        </motion.div>
    );
}
