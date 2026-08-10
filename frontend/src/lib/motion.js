import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Durations in SECONDS (GSAP's unit), mirroring the `--duration-*` custom
 * properties in index.css. If you change one, change the other — the CSS ones
 * drive hover/colour transitions, these drive GSAP timelines, and a mismatch
 * reads as two different animation systems fighting.
 *
 * These are deliberately faster than the pre-rebuild values (0.15/0.25/0.4).
 * In a records tool the user is navigating to answer a question, and a 400ms
 * transition on the way to that answer reads as lag rather than polish.
 */
export const DURATION = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
};

/** Eases mirroring the `--ease-*` @theme tokens in index.css. */
export const EASE = {
  outExpo: "expo.out",
  outSoft: "power2.out",
  inOutSoft: "power2.inOut",
};

/** Stagger step for list/grid entrances. Small enough that a 25-row table
 * finishes well under a second rather than trickling in.
 */
export const STAGGER = 0.025;

/** Single source of truth for "should this animate at all".
 *
 * Every animation entry point checks this FIRST and returns without touching
 * the element, rather than running a shortened animation. The CSS
 * `prefers-reduced-motion` block in index.css cannot cover GSAP: GSAP writes
 * inline styles, which override stylesheet declarations, so a CSS rule cannot
 * neutralize a running tween.
 *
 * Read live (not cached at module load) so a user toggling the OS setting
 * mid-session is respected without a reload.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The app is RTL. Anything that travels horizontally has to travel the other
 * way, or a "slide in from the leading edge" animation slides in from the
 * trailing one. Read from the document rather than hardcoded, so a future LTR
 * locale needs no changes here.
 */
export function directionSign() {
  if (typeof document === "undefined") return 1;
  return document.documentElement.dir === "rtl" ? -1 : 1;
}

/** Fade/slide a container's children in, staggered.
 *
 * Returns the GSAP tween (or null when motion is reduced / there's nothing to
 * animate) so callers can add it to a timeline or kill it early.
 *
 * `gsap.from()` is deliberate: it animates FROM the offset TO the element's
 * natural resting state, so if the tween is interrupted or never runs, the
 * element is already in its correct final position. A `gsap.to()` would leave
 * content stuck invisible if it were killed mid-flight.
 */
export function staggerIn(targets, { y = 10, duration = DURATION.base, stagger = STAGGER, delay = 0 } = {}) {
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

/** Stagger a list in ONCE, on first successful paint — not on every refetch.
 *
 * This is the hook list views should use. TanStack Query refetches on window
 * focus and after every mutation; running the entrance animation on each of
 * those makes a table appear to flicker and re-assemble every time the user
 * tabs back to the window, which is worse than no animation at all.
 *
 * `ready` should be the "we have real data now" condition (typically
 * `!isLoading`). `resetKey` re-arms the animation when the list genuinely
 * becomes a different list — a new page, a changed filter — and should be
 * left undefined when it shouldn't re-arm at all.
 */
export function useStaggerOnce(ready, resetKey, options) {
  const ref = useRef(null);
  const playedFor = useRef(null);

  useEffect(() => {
    if (!ready) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    if (playedFor.current === resetKey) return undefined;
    playedFor.current = resetKey;

    const tween = staggerIn(el.children, options);
    return () => {
      if (tween) tween.kill();
    };
    // `options` is intentionally not a dependency: callers pass an object
    // literal, which would be a new reference every render and re-fire this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, resetKey]);

  return ref;
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

/** Slide an element in from the leading edge — sheets, drawers, side panels.
 * Direction-aware, so it enters from the correct side under RTL.
 */
export function slideInFromEdge(target, { distance = 24, duration = DURATION.base } = {}) {
  if (prefersReducedMotion()) return null;
  if (!target) return null;
  return gsap.from(target, {
    opacity: 0,
    x: distance * directionSign(),
    duration,
    ease: EASE.outExpo,
    clearProps: "opacity,transform",
  });
}

/** Animates a number from 0 to `value`, calling `onUpdate` with each
 * intermediate integer — used for the dashboard KPI counters.
 *
 * Intentionally does NOT format the number: callers pass the value through
 * `lib/format.js` themselves, because this app must render Latin numerals via
 * Intl("ar-LY-u-nu-latn") everywhere and a raw String(n) here would quietly
 * bypass that rule.
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

/** Moves a single indicator element to sit behind the active nav item, rather
 * than each item drawing and discarding its own. Used by the sidebar rail.
 *
 * Falls back to an instant `gsap.set` under reduced motion so the indicator is
 * still in the right place — hiding it entirely would remove the only visual
 * marker of which page you are on.
 */
export function moveIndicator(indicator, activeItem, { duration = DURATION.base } = {}) {
  if (!indicator || !activeItem) return null;
  const parent = indicator.offsetParent ?? activeItem.parentElement;
  if (!parent) return null;

  const top = activeItem.offsetTop - (parent.offsetTop ?? 0);
  const height = activeItem.offsetHeight;
  const to = { y: top, height, opacity: 1 };

  if (prefersReducedMotion()) {
    gsap.set(indicator, to);
    return null;
  }
  return gsap.to(indicator, { ...to, duration, ease: EASE.outExpo });
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
      y: 6,
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
