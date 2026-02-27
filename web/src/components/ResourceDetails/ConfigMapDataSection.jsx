import React, { useState } from 'react';
import DetailSection from './DetailSection';
import { useTheme } from '../../ThemeContext';

export default function ConfigMapDataSection({ data, kind, namespace, name, t, onRefresh }) {
    const { icons } = useTheme();
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const startEdit = (key, value) => {
        setEditingKey(key);
        setEditValue(value);
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const yamlRes = await fetch(`/api/resources/${kind}/${namespace || '-'}/${name}/yaml`);
            if (!yamlRes.ok) throw new Error('Failed to fetch current YAML');
            const currentYaml = await yamlRes.text();

            const lines = currentYaml.split('\n');
            const newLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith(`${editingKey}:`)) {
                    const indent = line.indexOf(editingKey);
                    return ' '.repeat(indent) + `${editingKey}: ${editValue}`;
                }
                return line;
            });

            const updateRes = await fetch(`/api/resources/${kind}/${namespace || '-'}/${name}/yaml`, {
                method: 'PUT',
                body: newLines.join('\n')
            });

            if (!updateRes.ok) {
                const errData = await updateRes.json();
                throw new Error(errData.error || 'Failed to update configmap');
            }

            setEditingKey(null);
            if (onRefresh) onRefresh();
        } catch (err) {
            alert('Update failed: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const cmData = data || {};

    return (
        <DetailSection title={t('data') || "Data"} className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-[var(--font-size-sm)] border-collapse">
                    <thead className="text-[11px] text-[var(--text-table-header)] uppercase tracking-wider bg-[var(--bg-sidebar)]/10 border-b-2 border-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-3 w-1/4">Key</th>
                            <th className="px-4 py-3">Value</th>
                            <th className="px-4 py-3 w-24 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {Object.keys(cmData).length === 0 ? (
                            <tr><td colSpan="3" className="px-4 py-8 text-center text-text-muted italic">No data found.</td></tr>
                        ) : (
                            Object.entries(cmData).map(([key, value]) => (
                                <tr key={key} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3 font-bold text-primary font-mono">{key}</td>
                                    <td className="px-4 py-3">
                                        {editingKey === key ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-full bg-black/40 border border-info/30 rounded p-2 font-mono text-sm text-info focus:outline-none focus:border-info/60 min-h-[120px]"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleUpdate}
                                                        disabled={isUpdating}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-success/20 hover:bg-success/30 text-success rounded text-xs font-bold transition-colors disabled:opacity-50"
                                                    >
                                                        {isUpdating ? <icons.refresh className="animate-spin" size={14} /> : <icons.check size={14} />}
                                                        Update
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        disabled={isUpdating}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-text-muted rounded text-xs font-bold transition-colors"
                                                    >
                                                        <icons.close size={14} />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="font-mono text-sm text-secondary whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
                                                {String(value)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => startEdit(key, value)}
                                            className="p-1.5 text-text-muted hover:text-accent hover:bg-white/5 rounded transition-colors"
                                            title="Edit Value"
                                        >
                                            <icons.edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </DetailSection>
    );
}
