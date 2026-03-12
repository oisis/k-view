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
            const newLines = (lines || []).map(line => {
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
            <div className="w-full">
                <table className="w-full text-sm border-collapse table-fixed">
                    <thead>
                        <tr className="bg-white/5 border-b border-border/30 uppercase text-[10px] tracking-widest font-black text-text-muted">
                            <th className="px-4 py-3 text-left w-1/4">Key</th>
                            <th className="px-4 py-3 text-left w-auto">Value</th>
                            <th className="px-4 py-3 text-center w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {Object.keys(cmData).length === 0 ? (
                            <tr><td colSpan="3" className="px-4 py-8 text-center text-text-muted italic">No data found.</td></tr>
                        ) : (
                            Object.entries(cmData || {}).map(([key, value]) => (
                                <tr key={key} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3 font-bold text-foreground font-mono truncate" title={key}>{key}</td>
                                    <td className="px-4 py-3 min-w-0">
                                        {editingKey === key ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    wrap="off"
                                                    className="w-full bg-transparent border-2 border-error/50 rounded-xl p-4 font-mono text-sm text-info focus:outline-none focus:border-error min-h-[160px] overflow-x-auto whitespace-pre transition-all shadow-inner"
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
                                            <div className="font-mono text-sm text-foreground whitespace-pre-wrap break-all max-h-80 overflow-y-auto">
                                                {String(value)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => startEdit(key, value)}
                                                className="p-1.5 text-text-muted hover:text-accent hover:bg-white/5 rounded transition-colors"
                                                title="Edit Value"
                                            >
                                                <icons.edit size={16} />
                                            </button>
                                        </div>
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
