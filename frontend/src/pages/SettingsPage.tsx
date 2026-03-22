import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SystemConfig } from '../types';

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [showNew, setShowNew] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await api.getSettings();
            setSettings(data);
            const values: Record<string, string> = {};
            data.forEach((s) => (values[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value)));
            setEditValues(values);
        } catch (err) { console.error('Failed to load settings', err); }
        finally { setLoading(false); }
    };

    const handleSave = async (key: string) => {
        setSaving(key);
        try {
            let parsedValue: any;
            try { parsedValue = JSON.parse(editValues[key]); } catch { parsedValue = editValues[key]; }
            await api.updateSetting(key, parsedValue);
            setSaved(key);
            setTimeout(() => setSaved(null), 2000);
        } catch (err) { console.error('Failed to save setting', err); }
        finally { setSaving(null); }
    };

    const handleCreate = async () => {
        if (!newKey) return;
        try {
            let parsedValue: any;
            try { parsedValue = JSON.parse(newValue); } catch { parsedValue = newValue; }
            await api.createSetting(newKey, parsedValue, newDesc);
            setShowNew(false); setNewKey(''); setNewValue(''); setNewDesc('');
            await loadSettings();
        } catch (err) { console.error('Failed to create setting', err); }
    };

    const formatLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">System Configuration</h1>
                    <p className="text-slate-400">Configure AskBox assistant behavior and parameters</p>
                </div>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="bg-primary text-background-dark px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">add</span> Add Setting
                </button>
            </div>

            {/* New Setting Form */}
            {showNew && (
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-6 space-y-3">
                    <h3 className="text-sm font-bold">New Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                            className="bg-background-dark border border-primary/20 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Setting key (e.g. max_retries)"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value)}
                        />
                        <input
                            className="bg-background-dark border border-primary/20 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Value"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                        />
                        <input
                            className="bg-background-dark border border-primary/20 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Description"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreate} className="bg-primary text-background-dark px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">save</span> Create
                        </button>
                        <button onClick={() => setShowNew(false)} className="bg-primary/10 px-4 py-2 rounded-lg text-xs font-bold border border-primary/20 text-slate-300">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Settings List */}
            <div className="space-y-3">
                {settings.map((setting) => (
                    <div key={setting.id} className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-symbols-outlined text-primary text-[20px]">settings</span>
                                    <h3 className="text-sm font-bold">{formatLabel(setting.key)}</h3>
                                    <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded">{setting.key}</span>
                                </div>
                                {setting.description && (
                                    <p className="text-xs text-slate-500 mb-3 pl-7">{setting.description}</p>
                                )}
                                {setting.key === 'supported_languages' || setting.key === 'system_prompt' ? (
                                    <textarea
                                        className="w-full bg-background-dark border border-primary/20 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-y"
                                        value={editValues[setting.key] || ''}
                                        onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        className="w-full bg-background-dark border border-primary/20 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-primary"
                                        value={editValues[setting.key] || ''}
                                        onChange={(e) => setEditValues({ ...editValues, [setting.key]: e.target.value })}
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => handleSave(setting.key)}
                                disabled={saving === setting.key}
                                className={`mt-6 size-10 rounded-xl flex items-center justify-center transition-all ${saved === setting.key
                                        ? 'bg-accent-teal/20 text-accent-teal'
                                        : 'bg-primary/10 text-slate-400 hover:text-primary hover:bg-primary/20 border border-primary/20'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-sm ${saving === setting.key ? 'animate-spin' : ''}`}>
                                    {saving === setting.key ? 'progress_activity' : saved === setting.key ? 'check' : 'save'}
                                </span>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2 pl-7">
                            Last updated: {new Date(setting.updatedAt).toLocaleString('en-IN')}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
