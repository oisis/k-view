import React from 'react';
import DetailSection from './DetailSection';
import CodeEditor from './CodeEditor';

export default function PolicyRulesTable({ title, rules, t }) {
    if (!rules || rules.length === 0) {
        return (
            <DetailSection title={title} className="mt-4">
                <div className="p-4 bg-[var(--bg-sidebar)]/5 text-[var(--text-muted)] italic text-sm">
                    No rules defined.
                </div>
            </DetailSection>
        );
    }

    // Simple recursive function to convert object to YAML string
    const toYaml = (obj, indent = 0) => {
        const spaces = '  '.repeat(indent);
        if (Array.isArray(obj)) {
            return obj.map(item => {
                if (typeof item === 'object' && item !== null) {
                    const yamlItem = toYaml(item, indent + 1).trimStart();
                    return `${spaces}- ${yamlItem}`;
                }
                return `${spaces}- ${item}`;
            }).join('\n');
        } else if (typeof obj === 'object' && obj !== null) {
            return Object.entries(obj).map(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
                }
                return `${spaces}${key}: ${value}`;
            }).join('\n');
        }
        return `${spaces}${obj}`;
    };

    const yamlContent = toYaml(rules);

    return (
        <DetailSection title={title} className="mt-4">
            <div className="border border-slate-600 rounded-lg overflow-hidden">
                <CodeEditor
                    value={yamlContent}
                    readOnly={true}
                    fontSize={13}
                    height="auto"
                    minHeight="100px"
                    maxHeight="400px"
                />
            </div>
        </DetailSection>
    );
}
