import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';
import { cn } from '../../lib/utils';

export default function CopyButton({ value, className }) {
    const { icons } = useTheme();
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const Icon = copied ? icons.check : icons.clipboard;

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1 rounded-md transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary",
                copied && "text-emerald-500 hover:text-emerald-600 bg-emerald-500/10",
                className
            )}
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            <Icon size={14} />
        </button>
    );
}
