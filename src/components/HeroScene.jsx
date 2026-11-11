import React, { useRef, useEffect } from 'react';
import styles from './HeroScene.module.css';

const SHEETS = 5;
const BASE_RX = -12; // resting tilt (degrees)
const BASE_RY = -26;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * A stack of 3D pages. It follows the mouse, drifts gently on its own,
 * and the pages pull apart as the visitor scrolls down.
 * Decorative only (aria-hidden). Respects prefers-reduced-motion.
 */
export default function HeroScene() {
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let spreadTarget = 0;
    let spread = 0;
    let raf = 0;

    const onPointer = (e) => {
      if (e.pointerType === 'touch') return;
      const r = scene.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const ny = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      targetY = clamp(nx, -0.5, 0.5) * 36;
      targetX = -clamp(ny, -0.5, 0.5) * 28;
    };

    const onScroll = () => {
      spreadTarget = clamp(window.scrollY / 500, 0, 1);
    };

    const loop = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      spread += (spreadTarget - spread) * 0.1;
      scene.style.setProperty('--rx', `${(BASE_RX + x).toFixed(2)}deg`);
      scene.style.setProperty('--ry', `${(BASE_RY + y).toFixed(2)}deg`);
      scene.style.setProperty('--spread', spread.toFixed(3));
      raf = requestAnimationFrame(loop);
    };

    // Only animate while the scene is on screen
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(scene);

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className={styles.scene} ref={sceneRef} aria-hidden="true">
      <div className={styles.float}>
        {/* Explicit size: a percentage width collapses inside the shrink-wrapped parent */}
        <div className={styles.stage} style={{ width: 'clamp(12rem, 15vw, 15rem)' }}>
          {Array.from({ length: SHEETS }, (_, i) => {
            const isTop = i === SHEETS - 1;
            return (
              <div
                key={i}
                className={[styles.sheet, isTop ? styles.sheetTop : ''].join(' ')}
                style={{ '--i': i }}
              >
                {isTop && (
                  <div className={styles.page}>
                    <p className={styles.pageTitle}>A place that feels peaceful</p>
                    <p className={styles.pageText}>
                      The lake is quiet in the morning. I{' '}
                      <span className={styles.flag}>definately</span> want to go back, because the
                      air feels clean and slow.
                    </p>
                    <span className={styles.bar} style={{ width: '92%' }} />
                    <span className={styles.bar} style={{ width: '78%' }} />
                    <span className={styles.bar} style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Floating correction, sitting in front of the top page */}
          <div className={styles.chip}>
            <s>definately</s> <strong>definitely</strong>
          </div>
        </div>
      </div>
      <div className={styles.shadow} />
    </div>
  );
}