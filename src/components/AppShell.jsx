import React, { useEffect, useRef } from 'react';
import TopNav from './TopNav';
import styles from './AppShell.module.css';

export default function AppShell({ currentPage, onNavigate, isLoggedIn, onLogout, children }) {
  const mainRef = useRef(null);

  // Move keyboard focus to main content after every page navigation
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [currentPage]);

  return (
    <div className={styles.shell}>
      {/* Skip-to-content link — must be the very first focusable element */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <TopNav
        currentPage={currentPage}
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
      />
      <main
        className={styles.main}
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        aria-label="Main content"
      >
        {children}
      </main>
      <footer className={styles.footer}>
        <div className="container">
          <p>
            <span aria-hidden="true">✍️ </span>
            <strong>Writewise</strong> — an English writing-learning platform.
            Feedback is generated automatically and is meant as guidance, not a grade.
          </p>
        </div>
      </footer>
    </div>
  );
}
