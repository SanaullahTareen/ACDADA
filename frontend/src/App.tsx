import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './layouts';
import {
    DashboardPage,
    LiveSimulationPage,
    DetectionPage,
    ClassificationPage,
    DeceptionPage,
    IntelMemoryPage,
    SystemMetricsPage,
    EventsPage,
    SettingsPage,
} from './pages';

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="live" element={<LiveSimulationPage />} />
                        <Route path="detection" element={<DetectionPage />} />
                        <Route path="classification" element={<ClassificationPage />} />
                        <Route path="deception" element={<DeceptionPage />} />
                        <Route path="intel" element={<IntelMemoryPage />} />
                        <Route path="system" element={<SystemMetricsPage />} />
                        <Route path="events" element={<EventsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppProvider>
    );
}
