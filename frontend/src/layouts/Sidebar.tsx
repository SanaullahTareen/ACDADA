import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Radio,
    Shield,
    Crosshair,
    Ghost,
    Brain,
    Activity,
    List,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import clsx from 'clsx';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/live', icon: Radio, label: 'Live Simulation' },
    { to: '/detection', icon: Shield, label: 'Detection' },
    { to: '/classification', icon: Crosshair, label: 'Classification' },
    { to: '/deception', icon: Ghost, label: 'Deception' },
    { to: '/intel', icon: Brain, label: 'Intel Memory' },
    { to: '/system', icon: Activity, label: 'System Metrics' },
    { to: '/events', icon: List, label: 'Event Log' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
    const { sidebarCollapsed, toggleSidebar } = useApp();

    return (
        <aside
            className={clsx(
                'flex flex-col bg-slate-900/95 border-r border-slate-700/50 transition-all duration-300 backdrop-blur-sm',
                sidebarCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-slate-700/50">
                <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                {!sidebarCollapsed && (
                    <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">ACDADA</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                            )
                        }
                        title={sidebarCollapsed ? label : undefined}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="ml-3 font-medium">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={toggleSidebar}
                className="flex items-center justify-center h-12 border-t border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200"
            >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </aside>
    );
}
