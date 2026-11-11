import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import styles from './Tilt.module.css';

/**
 * Tilt: a smooth 3D tilt that follows the mouse.
 *
 * Props
 *  - max          largest tilt angle in degrees (default 8)
 *  - scale        how much it grows while hovered (default 1.02, use 1 for none)
 *  - perspective  CSS perspective in px (default 900). Lower = more dramatic
 *  - glare        adds a soft white highlight that follows the cursor
 *  - className    applied to the outer wrapper (the grid / flex item)
 *
 * Inside the tilting area two CSS variables are available: --mx and --my
 * (cursor position in px). Children can use them for spotlight effects, and can use
 * transform: translateZ(Npx) to float above the surface.
 *
 * Only runs for a mouse or pen with hover support, and never with reduced motion.
 * Keyboard focus inside the card gives the same gentle "lift" without the tilt.
 */
export default function Tilt({
  children,
  max = 8,
  scale = 1.02,
  perspective = 900,
  glare = false,
  className = '',
}) {
  const outerRef = useRef(null); // never transforms, so measuring it is always accurate
  const innerRef = useRef(null); // this is the part that tilts

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return undefined;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const ease = 'power3.out';
      const rotX = gsap.quickTo(inner, 'rotationX', { duration: 0.6, ease });
      const rotY = gsap.quickTo(inner, 'rotationY', { duration: 0.6, ease });
      const scaleX = gsap.quickTo(inner, 'scaleX', { duration: 0.5, ease });
      const scaleY = gsap.quickTo(inner, 'scaleY', { duration: 0.5, ease });
      const grow = (v) => {
        scaleX(v);
        scaleY(v);
      };

      const onMove = (e) => {
        if (e.pointerType === 'touch') return;
        const r = outer.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width; // 0 … 1
        const py = (e.clientY - r.top) / r.height;
        rotY((px - 0.5) * max * 2);
        rotX(-(py - 0.5) * max * 2);
        inner.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
        inner.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
      };

      const onEnter = (e) => {
        if (e.pointerType === 'touch') return;
        grow(scale);
      };

      const rest = () => {
        rotX(0);
        rotY(0);
        grow(1);
        inner.style.removeProperty('--mx');
        inner.style.removeProperty('--my');
      };

      // keyboard users: lift while something inside has focus
      const onFocusIn = () => grow(scale);
      const onFocusOut = () => grow(1);

      outer.addEventListener('pointerenter', onEnter);
      outer.addEventListener('pointermove', onMove);
      outer.addEventListener('pointerleave', rest);
      outer.addEventListener('focusin', onFocusIn);
      outer.addEventListener('focusout', onFocusOut);

      return () => {
        outer.removeEventListener('pointerenter', onEnter);
        outer.removeEventListener('pointermove', onMove);
        outer.removeEventListener('pointerleave', rest);
        outer.removeEventListener('focusin', onFocusIn);
        outer.removeEventListener('focusout', onFocusOut);
        inner.style.removeProperty('--mx');
        inner.style.removeProperty('--my');
      };
    });

    return () => mm.revert();
  }, [max, scale]);

  return (
    <div
      ref={outerRef}
      className={[styles.outer, className].filter(Boolean).join(' ')}
      style={{ perspective: `${perspective}px` }}
    >
      <div ref={innerRef} className={styles.tilt}>
        {children}
        {glare && <span className={styles.glare} aria-hidden="true" />}
      </div>
    </div>
  );
}