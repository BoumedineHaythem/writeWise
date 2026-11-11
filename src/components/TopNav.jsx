import React, { useState } from 'react';
import Button from './Button';
import logoIcon from '../assets/logo-icon.svg';
import styles from './TopNav.module.css';

const NAV_LINKS = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Write', page: 'workspace' },
  { label: 'Practice', page: 'practice' },
  { label: 'Progress', page: 'progress' },
];

export default function TopNav({ currentPage, onNavigate, isLoggedIn, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((v) => !v);
  const handleNav = (page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <header className={styles.header} role="banner">
      <div className={[styles.inner, 'container'].join(' ')}>
        {/* Logo */}
        <button
          className={styles.logo}
          onClick={() => handleNav(isLoggedIn ? 'dashboard' : 'landing')}
          aria-label="Writewise — go to home"
        >
          <img src={logoIcon} alt="" className={styles.logoImg} width="32" height="32" />
          <span className={styles.logoText}>Writewise</span>
        </button>

        {/* Desktop nav */}
        {isLoggedIn && (
          <nav aria-label="Main navigation" className={styles.desktopNav}>
            {NAV_LINKS.map((link) => (
              <button
                key={link.page}
                onClick={() => handleNav(link.page)}
                className={[
                  styles.navLink,
                  currentPage === link.page ? styles.active : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={currentPage === link.page ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {/* Auth actions */}
        <div className={styles.actions}>
          {isLoggedIn ? (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Log out
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNav('login')}
              >
                Log in
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleNav('signup')}
              >
                Get started
              </Button>
            </>
          )}

          {/* Mobile hamburger (shown when logged in) */}
          {isLoggedIn && (
            <button
              className={styles.hamburger}
              onClick={toggleMenu}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <span className={[styles.hBar, menuOpen ? styles.hBarTop : ''].filter(Boolean).join(' ')} />
              <span className={[styles.hBar, menuOpen ? styles.hBarMid : ''].filter(Boolean).join(' ')} />
              <span className={[styles.hBar, menuOpen ? styles.hBarBot : ''].filter(Boolean).join(' ')} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav panel — always rendered, visibility toggled via hidden attribute */}
      {isLoggedIn && (
        <nav
          id="mobile-nav"
          className={styles.mobileNav}
          aria-label="Mobile navigation"
          hidden={!menuOpen}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.page}
              onClick={() => handleNav(link.page)}
              className={[
                styles.mobileLink,
                currentPage === link.page ? styles.mobileActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-current={currentPage === link.page ? 'page' : undefined}
            >
              {link.label}
            </button>
          ))}
          <button
            className={styles.mobileLink}
            onClick={() => { onLogout(); setMenuOpen(false); }}
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}