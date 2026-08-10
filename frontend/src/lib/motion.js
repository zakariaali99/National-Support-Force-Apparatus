import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Durations in SECONDS (GSAP's unit), mirroring the `--duration-*` custom
 * properties in index.css. If you change one, change the other — the CSS
 * ones drive hover/colour transitions, these drive GSAP timelines, and a
 * mismatch reads as two different animation systems fighting.
 */
export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
};

/** Eases mirroring the `--ease-*` @theme tokens in index.css. */
export const EASE = {
  outExpo: "expo.out",
  outSoft: "power2.out",
  inOutSoft: "power2.inOut",
};

/** Stagger step for list/grid entrances. Small enough that a 25-row table
 * finishes in well under a second rather than trickling in.
 */
export const STAGGER = 0.03;

/** Single source of truth for "should this animate at all".
 *
 * Every animation entry point in the app checks this FIRST and returns
 * without touching the element, rather than running a shortened animation.
 * The CSS `prefers-reduced-motion` block in index.css can't cover GSAP:
 * GSAP writes inline styles, which override stylesheet declarations, so a
 * CSS rule cannot neutralize a running tween.
 *
 * Read live (not cached at module load) so a user toggling the OS setting
 * mid-session is respected without a reload.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fade/slide a container's children in, staggered.
 *
 * Returns the GSAP tween (or null when motion is reduced / there's nothing
 * to animate) so callers can add it to a timeline or kill it early.
 *
 * `gsap.from()` is deliberate: it animates FROM the offset TO the element's
 * natural resting state, so if the tween is interrupted or never runs, the
 * element is already in its correct final position. A `gsap.to()` would
 * leave content stuck invisible if it were killed mid-flight.
 */
export function staggerIn(targets, { y = 12, duration = DURATION.base, stagger = STAGGER, delay = 0 } = {}) {
  if (prefersReducedMotion()) return null;
  const elements = gsap.utils.toArray(targets);
  if (!elements.length) return null;

  return gsap.from(elements, {
    opacity: 0,
    y,
    duration,
    stagger,
    delay,
    ease: EASE.outExpo,
    // Clear the inline styles GSAP leaves behind, so hover/focus styles and
    // the RTL layout aren't competing with a leftover transform.
    clearProps: "opacity,transform",
  });
}

/** Fade a single element in (no vertical travel). */
export function fadeIn(target, { duration = DURATION.base, delay = 0 } = {}) {
  if (prefersReducedMotion()) return null;
  if (!target) return null;
  return gsap.from(target, {
    opacity: 0,
    duration,
    delay,
    ease: EASE.outSoft,
    clearProps: "opacity",
  });
}

/** Animates a number from 0 to `value`, calling `onUpdate` with each
 * intermediate integer — used for the dashboard KPI counters.
 *
 * Intentionally does NOT format the number: callers pass the value through
 * `lib/format.js` themselves, because this app must render Latin numerals
 * via Intl("ar-LY-u-nu-latn") everywhere and a raw String(n) here would
 * quietly bypass that rule.
 */
export function countUp(value, onUpdate, { duration = DURATION.slow } = {}) {
  const target = Number(value) || 0;
  if (prefersReducedMotion() || target === 0) {
    onUpdate(target);
    return null;
  }
  const counter = { n: 0 };
  return gsap.to(counter, {
    n: target,
    duration,
    ease: EASE.outExpo,
    onUpdate: () => onUpdate(Math.round(counter.n)),
    onComplete: () => onUpdate(target),
  });
}

/** Page/route transition: fades the routed content in on each navigation.
 *
 * Pass the changing route key (usually `location.pathname`) so the effect
 * re-runs per navigation. Returns a ref to attach to the wrapper element.
 */
export function usePageTransition(routeKey) {
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const tween = gsap.from(el, {
      opacity: 0,
      y: 8,
      duration: DURATION.base,
      ease: EASE.outExpo,
      clearProps: "opacity,transform",
    });
    // Kill on unmount/route change so an in-flight tween can't write styles
    // onto the next page's element.
    return () => tween.kill();
  }, [routeKey]);

  return ref;
}
