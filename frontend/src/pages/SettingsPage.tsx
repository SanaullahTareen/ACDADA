import { useState } from 'react';
import { Save, RotateCcw, Server, Sliders, Bell, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/common';

interface Settings {
    apiUrl: string;
    wsUrl: string;
    threatThreshold: number;
    anomalyThreshold: number;
    simulationRate: number;
    autoReconnect: boolean;
    maxEvents: number;
    darkMode: boolean;
    notifications: boolean;
    soundAlerts: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    apiUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000/ws/events',
    threatThreshold: 0.5,
    anomalyThreshold: 0.7,
    simulationRate: 1000,
    autoReconnect: true,
    maxEvents: 500,
    darkMode: true,
    notifications: true,
    soundAlerts: false,
};

export function SettingsPage() {
    const { settings: appSettings, setSettings: setAppSettings } = useApp();
    const [settings, setSettings] = useState<Settings>(() => ({
        ...DEFAULT_SETTINGS,
        ...appSettings,
    }));
    const [saved, setSaved] = useState(false);

    const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        setAppSettings(settings);
        localStorage.setItem('acdada-settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        setSaved(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
                    <p className="text-slate-400 mt-1">
                        Configure API endpoints, thresholds, and preferences
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>

            {/* API Configuration */}
            <Card title="API Configuration" icon={<Server className="w-5 h-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">API URL</label>
                        <input
                            type="text"
                            value={settings.apiUrl}
                            onChange={(e) => handleChange('apiUrl', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Backend REST API endpoint</p>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">WebSocket URL</label>
                        <input
                            type="text"
                            value={settings.wsUrl}
                            onChange={(e) => handleChange('wsUrl', e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Real-time event stream endpoint</p>
                    </div>
                </div>
            </Card>

            {/* Detection Thresholds */}
            <Card title="Detection Thresholds" icon={<Sliders className="w-5 h-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-slate-400">Threat Detection Threshold</label>
                            <span className="text-blue-400 font-medium">{settings.threatThreshold.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.threatThreshold}
                            onChange={(e) => handleChange('threatThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0 (Sensitive)</span>
                            <span>1 (Strict)</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-slate-400">Anomaly Detection Threshold</label>
                            <span className="text-blue-400 font-medium">{settings.anomalyThreshold.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.anomalyThreshold}
                            onChange={(e) => handleChange('anomalyThreshold', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0 (Sensitive)</span>
                            <span>1 (Strict)</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Simulation Rate (ms)</label>
                        <input
                            type="number"
                            min="100"
                            max="10000"
                            step="100"
                            value={settings.simulationRate}
                            onChange={(e) => handleChange('simulationRate', parseInt(e.target.value))}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Event generation interval</p>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Max Events Buffer</label>
                        <input
                            type="number"
                            min="100"
                            max="10000"
                            step="100"
                            value={settings.maxEvents}
                            onChange={(e) => handleChange('maxEvents', parseInt(e.target.value))}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Maximum events in memory</p>
                    </div>
                </div>
            </Card>

            {/* Notifications */}
            <Card title="Notifications" icon={<Bell className="w-5 h-5" />}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-200">Auto Reconnect</h4>
                            <p className="text-sm text-slate-500">Automatically reconnect WebSocket on disconnect</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.autoReconnect}
                                onChange={(e) => handleChange('autoReconnect', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-200">Browser Notifications</h4>
                            <p className="text-sm text-slate-500">Show desktop notifications for critical events</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.notifications}
                                onChange={(e) => handleChange('notifications', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-200">Sound Alerts</h4>
                            <p className="text-sm text-slate-500">Play audio alerts for critical threats</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.soundAlerts}
                                onChange={(e) => handleChange('soundAlerts', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                    </div>
                </div>
            </Card>

            {/* Appearance */}
            <Card title="Appearance" icon={<Palette className="w-5 h-5" />}>
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-slate-200">Dark Mode</h4>
                        <p className="text-sm text-slate-500">Use dark theme (recommended for SOC environments)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.darkMode}
                            onChange={(e) => handleChange('darkMode', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                </div>
            </Card>

            {/* About */}
            <Card title="About">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                        <h4 className="text-blue-400 font-medium mb-1">ACDADA</h4>
                        <p className="text-sm text-slate-400">v1.0.0</p>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                        <h4 className="text-blue-400 font-medium mb-1">Agents</h4>
                        <p className="text-sm text-slate-400">7 ML Agents</p>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                        <h4 className="text-blue-400 font-medium mb-1">Models</h4>
                        <p className="text-sm text-slate-400">CNN, LSTM, AE, VAE, DQN, XGBoost</p>
                    </div>
                </div>
                <p className="text-sm text-slate-500 mt-4 text-center">
                    Autonomous Cyber Deception & Adaptive Defense Agent
                </p>
            </Card>
        </div>
    );
}
