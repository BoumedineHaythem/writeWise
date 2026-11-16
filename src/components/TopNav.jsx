import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Button from './Button';
import logoIcon from '../assets/logo-icon.svg';
import { useLearning } from '../context/LearningContext';
import styles from './TopNav.module.css';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';

const LEFT = [
  { key: 'dashboard', label: 'Dashboard', page: 'dashboard' },
  { key: 'workspace', label: 'Write', page: 'workspace' },
];

// everything about learning lives under one menu so the bar stays calm
const LEARN = [
  { label: 'Courses', page: 'courses', desc: 'Step-by-step writing lessons' },
  { label: 'Explore', page: 'explore', desc: 'Discover and save new words' },
  { label: 'Flashcards', page: 'flashcards', desc: 'Review the words you saved' },
  { label: 'Practice', page: 'practice', desc: 'Fix the words you misspell' },
];
const LEARN_PAGES = ['courses', 'course', 'explore', 'flashcards', 'practice'];

const RIGHT = [{ key: 'progress', label: 'Progress', page: 'progress' }];

function activeKeyFor(page) {
  if (page === 'dashboard') return 'dashboard';
  if (page === 'workspace') return 'workspace';
  if (LEARN_PAGES.includes(page)) return 'learn';
  if (page === 'progress') return 'progress';
  return null;
}

export default function TopNav({ currentPage, onNavigate, isLoggedIn, onLogout }) {
  const { flashcardIds } = useLearning();
  const cardCount = flashcardIds.length;

  const [menuOpen, setMenuOpen] = useState(false); // mobile panel
  const [learnOpen, setLearnOpen] = useState(false); // desktop dropdown
  const [scrolled, setScrolled] = useState(false);

  const itemRefs = useRef({});
  const indicatorRef = useRef(null);
  const learnBtnRef = useRef(null);
  const menuRef = useRef(null);
  const mobileRef = useRef(null);
  const closeTimer = useRef(0);
  const placedOnce = useRef(false);

  const activeKey = activeKeyFor(currentPage);
  const pageMatches = (page) => currentPage === page || (page === 'courses' && currentPage === 'course');

  const handleNav = (page) => {
    onNavigate(page);
    setMenuOpen(false);
    setLearnOpen(false);
  };

  /* ── header gets a border and shadow once the page scrolls ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── the highlight pill slides to the active item ── */
  useLayoutEffect(() => {
    if (!isLoggedIn) return undefined;
    const place = (animate) => {
      const pill = indicatorRef.current;
      const el = itemRefs.current[activeKey];
      if (!pill) return;
      if (!el) {
        gsap.set(pill, { opacity: 0 });
        return;
      }
      const vars = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1 };
      if (animate && window.matchMedia(MOTION_OK).matches) gsap.to(pill, { ...vars, duration: 0.5, ease: 'power3.out' });
      else gsap.set(pill, vars);
    };
    place(placedOnce.current);
    placedOnce.current = true;

    const onResize = () => place(false);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(() => place(false));
    return () => window.removeEventListener('resize', onResize);
  }, [activeKey, isLoggedIn, cardCount]);

  /* ── learn dropdown: hover (mouse only), click, Esc, outside click, focus leaving ── */
  useEffect(() => {
    if (!learnOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setLearnOpen(false);
        learnBtnRef.current?.focus();
      }
    };
    const onPointerDown = (e) => {
      if (!itemRefs.current.learn?.contains(e.target)) setLearnOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [learnOpen]);

  useLayoutEffect(() => {
    if (!learnOpen || !menuRef.current || !window.matchMedia(MOTION_OK).matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(menuRef.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' });
      gsap.from('[data-menu-item]', { opacity: 0, y: -6, duration: 0.3, stagger: 0.04, delay: 0.05, ease: 'power3.out', clearProps: 'opacity,transform' });
    }, menuRef);
    return () => ctx.revert();
  }, [learnOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  /* ── mobile panel ── */
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen || !mobileRef.current || !window.matchMedia(MOTION_OK).matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(mobileRef.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' });
      gsap.from('[data-mobile-item]', { opacity: 0, x: -20, duration: 0.4, stagger: 0.05, delay: 0.1, ease: 'power3.out', clearProps: 'opacity,transform' });
    }, mobileRef);
    return () => ctx.revert();
  }, [menuOpen]);

  const hoverOpen = (e) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(closeTimer.current);
    setLearnOpen(true);
  };
  const hoverClose = (e) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setLearnOpen(false), 160);
  };
  const onLearnBlur = (e) => {
    if (!itemRefs.current.learn?.contains(e.relatedTarget)) setLearnOpen(false);
  };

  return (
    <header className={[styles.header, scrolled ? styles.scrolled : ''].filter(Boolean).join(' ')} role="banner">
      <div className={[styles.inner, 'container'].join(' ')}>
        {/* Logo */}
        <button
          type="button"
          className={styles.logo}
          onClick={() => handleNav(isLoggedIn ? 'dashboard' : 'landing')}
          aria-label="Writewise, go to home"
        >
          <img src={logoIcon} alt="" className={styles.logoImg} width="32" height="32" />
          <span className={styles.logoText}>Writewise</span>
        </button>

        {/* Desktop nav */}
        {isLoggedIn && (
          <nav aria-label="Main navigation" className={styles.desktopNav}>
            <span className={styles.indicator} ref={indicatorRef} aria-hidden="true" />

            {LEFT.map((link) => (
              <button
                key={link.key}
                type="button"
                ref={(el) => { itemRefs.current[link.key] = el; }}
                onClick={() => handleNav(link.page)}
                className={[styles.navLink, currentPage === link.page ? styles.active : ''].filter(Boolean).join(' ')}
                aria-current={currentPage === link.page ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}

            {/* Learn dropdown */}
            <div
              className={styles.learnWrap}
              ref={(el) => { itemRefs.current.learn = el; }}
              onPointerEnter={hoverOpen}
              onPointerLeave={hoverClose}
              onBlur={onLearnBlur}
            >
              <button
                type="button"
                ref={learnBtnRef}
                className={[styles.navLink, activeKey === 'learn' ? styles.active : ''].filter(Boolean).join(' ')}
                aria-expanded={learnOpen}
                aria-controls="learn-menu"
                onClick={() => setLearnOpen((v) => !v)}
              >
                Learn
                <span className={styles.caret} aria-hidden="true" />
              </button>
              <ul id="learn-menu" className={styles.menu} ref={menuRef} hidden={!learnOpen}>
                {LEARN.map((item) => (
                  <li key={item.page} data-menu-item>
                    <button
                      type="button"
                      className={[styles.menuItem, pageMatches(item.page) ? styles.menuActive : ''].filter(Boolean).join(' ')}
                      aria-current={pageMatches(item.page) ? 'page' : undefined}
                      onClick={() => handleNav(item.page)}
                    >
                      <span className={styles.menuTitle}>
                        {item.label}
                        {item.page === 'flashcards' && cardCount > 0 && (
                          <span className={styles.badge}>
                            {cardCount}
                            <span className={styles.srOnly}> saved</span>
                          </span>
                        )}
                      </span>
                      <span className={styles.menuDesc}>{item.desc}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {RIGHT.map((link) => (
              <button
                key={link.key}
                type="button"
                ref={(el) => { itemRefs.current[link.key] = el; }}
                onClick={() => handleNav(link.page)}
                className={[styles.navLink, currentPage === link.page ? styles.active : ''].filter(Boolean).join(' ')}
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
              <Button variant="ghost" size="sm" onClick={() => handleNav('login')}>
                Log in
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleNav('signup')}>
                Get started
              </Button>
            </>
          )}

          {/* Mobile hamburger (shown when logged in) */}
          {isLoggedIn && (
            <button
              type="button"
              className={styles.hamburger}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              <span className={styles.bar} />
              <span className={styles.bar} />
              <span className={styles.bar} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav panel */}
      {isLoggedIn && (
        <nav id="mobile-nav" className={styles.mobileNav} aria-label="Mobile navigation" hidden={!menuOpen} ref={mobileRef}>
          <div className={['container', styles.mobileInner].join(' ')}>
            {LEFT.map((link) => (
              <button
                key={link.key}
                type="button"
                data-mobile-item
                onClick={() => handleNav(link.page)}
                className={[styles.mobileLink, currentPage === link.page ? styles.mobileActive : ''].filter(Boolean).join(' ')}
                aria-current={currentPage === link.page ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}

            <p className={styles.mobileHeading} data-mobile-item>Learn</p>
            {LEARN.map((item) => (
              <button
                key={item.page}
                type="button"
                data-mobile-item
                onClick={() => handleNav(item.page)}
                className={[styles.mobileLink, styles.mobileSub, pageMatches(item.page) ? styles.mobileActive : ''].filter(Boolean).join(' ')}
                aria-current={pageMatches(item.page) ? 'page' : undefined}
              >
                {item.label}
                {item.page === 'flashcards' && cardCount > 0 && (
                  <span className={styles.badge}>
                    {cardCount}
                    <span className={styles.srOnly}> saved</span>
                  </span>
                )}
              </button>
            ))}

            {RIGHT.map((link) => (
              <button
                key={link.key}
                type="button"
                data-mobile-item
                onClick={() => handleNav(link.page)}
                className={[styles.mobileLink, currentPage === link.page ? styles.mobileActive : ''].filter(Boolean).join(' ')}
                aria-current={currentPage === link.page ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}

            <button
              type="button"
              data-mobile-item
              className={[styles.mobileLink, styles.mobileLogout].join(' ')}
              onClick={() => { onLogout(); setMenuOpen(false); }}
            >
              Log out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}