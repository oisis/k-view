import React from 'react';
import { useTheme } from '../../ThemeContext';

export default function ConditionBadge({ label, status }) {
    const { icons } = useTheme();
    const isTrue = status === 'True';
    return (
        <div className="flex items-center gap-1.5 py-1">
            {isTrue ? (
                <icons.check_circle_alt size={12} className="text-success" />
            ) : (
                <icons.alert size={12} className="text-warning" />
            )}
            <span className="text-xs text-secondary">{label}</span>
        </div>
    );
}
