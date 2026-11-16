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
import CoursesPage from './pages/CoursesPage';
import CoursePage from './pages/CoursePage';
import ExplorePage from './pages/ExplorePage';
import FlashcardsPage from './pages/FlashcardsPage';
import { LearningProvider } from './context/LearningContext';


/**
 * Writewise — Prototype frontend.
 * Uses a simple local-state page switcher instead of a router
 * to avoid adding extra dependencies.
 */
export default function App() {
  const [page, setPage] = useState('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [courseId, setCourseId] = useState(null);

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
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <LearningProvider>
      <AppShell
        currentPage={page}
        onNavigate={navigate}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppShell>
    </LearningProvider>
  );
}