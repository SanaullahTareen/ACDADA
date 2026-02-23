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
                'flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300',
                sidebarCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-gray-800">
                <Shield className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                {!sidebarCollapsed && (
                    <span className="ml-3 text-xl font-bold text-cyan-400">ACDADA</span>
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
                                'flex items-center px-4 py-3 mx-2 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                            )
                        }
                        title={sidebarCollapsed ? label : undefined}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span className="ml-3">{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={toggleSidebar}
                className="flex items-center justify-center h-12 border-t border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </aside>
    );
}
