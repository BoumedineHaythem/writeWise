import { useLayoutEffect } from 'react';
import gsap from 'gsap';

/**
 * Shared page intro: masked headline words, fade-ins, then rising blocks.
 * Mark elements with data-anim="word" | "fade" | "rise". Skipped with reduced motion.
 */
export default function useEntrance(rootRef, deps = []) {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-anim="word"]', { yPercent: 115, duration: 0.9, stagger: 0.08 })
        .from('[data-anim="fade"]', { opacity: 0, y: 20, duration: 0.7, stagger: 0.1 }, 0.3)
        .from('[data-anim="rise"]', { opacity: 0, y: 36, duration: 0.8, stagger: 0.08, clearProps: 'opacity,transform' }, 0.4);
    }, rootRef);
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}