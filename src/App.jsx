import React, { useState } from 'react';
import './styles/global.css';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WritingWorkspacePage from './pages/WritingWorkspacePage';
import ProgressPage from './pages/ProgressPage';
import PracticePage from './pages/PracticePage';


/**
 * Writewise — Prototype frontend.
 * Uses a simple local-state page switcher instead of a router
 * to avoid adding extra dependencies.
 */
export default function App() {
  const [page, setPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const navigate = (target) => {
    // Guard: redirect unauthenticated users away from protected pages
    const protected_ = ['dashboard', 'workspace', 'practice', 'progress'];
    if (protected_.includes(target) && !isLoggedIn) {
      setPage('login');
      return;
    }
    setPage(target);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (name) => {
    setUserName(name);
    setIsLoggedIn(true);
    setPage('dashboard');
    window.scrollTo({ top: 0 });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setPage('landing');
    window.scrollTo({ top: 0 });
  };

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'signup':
        return <SignUpPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />;
      case 'login':
        return <LoginPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} userName={userName} />;
      case 'workspace':
        return <WritingWorkspacePage onNavigate={navigate} />;
      case 'progress':
        return <ProgressPage onNavigate={navigate} />;
      case 'practice':
        return <PracticePage onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <AppShell
      currentPage={page}
      onNavigate={navigate}
      isLoggedIn={isLoggedIn}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppShell>
  );
}