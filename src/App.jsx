import React, { useState, useEffect } from 'react';
import { api, getToken } from './api/client';
import './styles/global.css';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WritingWorkspacePage from './pages/WritingWorkspacePage';
import ProgressPage from './pages/ProgressPage';
import PracticePage from './pages/PracticePage';
import CoursesPage from './pages/CoursesPage';
import CoursePage from './pages/CoursePage';
import ExplorePage from './pages/ExplorePage';
import FlashcardsPage from './pages/FlashcardsPage';
import { LearningProvider } from './context/LearningContext';


/**
 * Writewise frontend.
 * Uses a simple local-state page switcher instead of a router
 * to avoid adding extra dependencies. Accounts and data live in the backend (server/).
 */
export default function App() {
  const [page, setPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [courseId, setCourseId] = useState(null);
  // true while a saved login token is being checked, so we don't flash the logged-out view
  const [restoring, setRestoring] = useState(() => Boolean(getToken()));

  // Restore a saved login on page load
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((user) => {
        setUserName(user.name);
        setIsLoggedIn(true);
        setPage('dashboard');
      })
      .catch(() => {})
      .finally(() => setRestoring(false));
  }, []);

  // navigate('course', 'writing-emails') opens one course; other pages need no second argument
  const navigate = (target, param) => {
    // Guard: redirect unauthenticated users away from protected pages
    const protected_ = ['dashboard', 'workspace', 'courses', 'course', 'explore', 'flashcards', 'practice', 'progress'];
    if (protected_.includes(target) && !isLoggedIn) {
      setPage('login');
      return;
    }
    if (target === 'course') setCourseId(param || null);
    setPage(target);
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (user) => {
    setUserName(user.name);
    setIsLoggedIn(true);
    setPage('dashboard');
    window.scrollTo({ top: 0 });
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    setIsLoggedIn(false);
    setUserName('');
    setPage('landing');
    window.scrollTo({ top: 0 });
  };

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />;
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
      case 'courses':
        return <CoursesPage onNavigate={navigate} />;
      case 'course':
        // key makes a fresh page (and fresh milestone selection) for each course
        return <CoursePage key={courseId} courseId={courseId} onNavigate={navigate} />;
      case 'explore':
        return <ExplorePage onNavigate={navigate} />;
      case 'flashcards':
        return <FlashcardsPage onNavigate={navigate} />;
      default:
        return <LandingPage onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />;
    }
  };

  return (
    <LearningProvider isLoggedIn={isLoggedIn}>
      <AppShell
        currentPage={page}
        onNavigate={navigate}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      >
        {restoring ? null : renderPage()}
      </AppShell>
    </LearningProvider>
  );
}