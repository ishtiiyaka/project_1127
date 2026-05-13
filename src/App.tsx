import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';

import ContractScreen from './components/onboarding/ContractScreen';
import DashboardPage from './components/dashboard/DashboardPage';
import GoalHistory from './components/entry/GoalHistory';
import WeeklyReviewPage from './components/weekly/WeeklyReviewPage';
import MilestoneWall from './components/milestones/MilestoneWall';
import ArchivePage from './components/archive/ArchivePage';
import GhostModePage from './components/ghost/GhostModePage';
import SettingsPage from './components/settings/SettingsPage';
import ExportPage from './components/export/ExportPage';
import MilestoneCelebration from './components/milestones/MilestoneCelebration';
import FocusTimerPage from './components/focus/FocusTimerPage';
import CalendarPage from './components/calendar/CalendarPage';
import ReportCardPage from './components/report/ReportCardPage';

function AppRoutes() {
  const { settings, initialized } = useAppStore();

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-display text-accent text-sm tracking-widest">
          INITIALIZING<span className="blink">_</span>
        </span>
      </div>
    );
  }

  if (!settings?.startDate) {
    return (
      <Routes>
        <Route path="/onboard" element={<ContractScreen />} />
        <Route path="*" element={<Navigate to="/onboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/entry/:goalId" element={<GoalHistory />} />
      <Route path="/weekly-review" element={<WeeklyReviewPage />} />
      <Route path="/milestones" element={<MilestoneWall />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/ghost" element={<GhostModePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/export" element={<ExportPage />} />
      <Route path="/focus" element={<FocusTimerPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/report" element={<ReportCardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { initialize, showCelebration, celebrationDay, dismissCelebration, settings } = useAppStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Apply theme to document
  useEffect(() => {
    const theme = settings?.theme ?? 'dark-terminal';
    document.documentElement.setAttribute('data-theme', theme);
  }, [settings?.theme]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black">
        <AppRoutes />
        {showCelebration && celebrationDay && (
          <MilestoneCelebration day={celebrationDay} onDismiss={dismissCelebration} />
        )}
      </div>
    </BrowserRouter>
  );
}
