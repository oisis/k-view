import React, { useState } from 'react';
import DetailSection from './DetailSection';
import { useTheme } from '../../ThemeContext';

export default function SecretDataSection({ data, kind, namespace, name, t, onRefresh }) {
    const { icons } = useTheme();
    const [revealedKeys, setRevealedKeys] = useState({});
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const decodeBase64 = (str) => {
        if (!str) return '';
        try {
            // Support UTF-8 decoding
            return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            try { return atob(str); } catch(e2) { return str; }
        }
    };

    const encodeBase64 = (str) => {
        try {
            // Support UTF-8 encoding
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
            }));
        } catch (e) {
            return btoa(str);
        }
    };

    const toggleReveal = (key) => {
        setRevealedKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const startEdit = (key, value) => {
        setEditingKey(key);
        setEditValue(decodeBase64(value));
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

            const encodedValue = encodeBase64(editValue);

            const lines = currentYaml.split('\n');
            const newLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith(`${editingKey}:`)) {
                    const indent = line.indexOf(editingKey);
                    return ' '.repeat(indent) + `${editingKey}: ${encodedValue}`;
                }
                return line;
            });

            const updateRes = await fetch(`/api/resources/${kind}/${namespace || '-'}/${name}/yaml`, {
                method: 'PUT',
                body: newLines.join('\n')
            });

            if (!updateRes.ok) {
                const errData = await updateRes.json();
                throw new Error(errData.error || 'Failed to update secret');
            }

            setEditingKey(null);
            onRefresh();
        } catch (err) {
            alert('Update failed: ' + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const secretData = data || {};

    return (
        <DetailSection title="Data" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 w-1/4">Key</th>
                            <th className="px-4 py-3 text-center">Value</th>
                            <th className="px-4 py-3 w-32 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                        {Object.keys(secretData).length === 0 ? (
                            <tr><td colSpan="3" className="px-4 py-8 text-center text-text-muted italic">No data found in this secret.</td></tr>
                        ) : (
                            Object.entries(secretData).map(([key, value]) => (
                                <tr key={key} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-4 py-3 font-bold text-primary font-mono align-top">{key}</td>
                                    <td className="px-4 py-3">
                                        {editingKey === key ? (
                                            <div className="space-y-3 text-left">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-full bg-black/40 border border-info/30 rounded p-2 font-mono text-sm text-info focus:outline-none focus:border-info/60 min-h-[200px]"
                                                    placeholder="Enter plain text value..."
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
                                            <div className="flex flex-col items-start min-w-0">
                                                {revealedKeys[key] ? (
                                                    <pre className="font-mono text-sm text-info whitespace-pre-wrap break-all w-full bg-black/20 p-2 rounded border border-info/10 max-h-[400px] overflow-y-auto scrollbar-hide">
                                                        {decodeBase64(value)}
                                                    </pre>
                                                ) : (
                                                    <span className="font-mono text-sm text-text-muted opacity-50 px-2">••••••••••••••••</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center align-top">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => toggleReveal(key)}
                                                className={`p-1.5 rounded transition-all active:scale-90 ${revealedKeys[key] ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-primary hover:bg-white/5'}`}
                                                title={revealedKeys[key] ? "Hide Value" : "Show Value"}
                                            >
                                                {revealedKeys[key] ? <icons.eye_off size={18} /> : <icons.eye size={18} />}
                                            </button>
                                            <button
                                                onClick={() => startEdit(key, value)}
                                                className="p-1.5 text-text-muted hover:text-accent hover:bg-white/5 rounded transition-all active:scale-90"
                                                title="Edit Value"
                                            >
                                                <icons.edit size={18} />
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
