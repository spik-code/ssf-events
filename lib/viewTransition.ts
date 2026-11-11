import { flushSync } from "react-dom";

/**
 * Runs a state update inside a view transition where the browser has them;
 * elsewhere, and under reduced motion, the update simply happens. `cls` sits
 * on <html> for the duration so globals.css can style one kind of transition.
 */
export function withViewTransition(update: () => void, cls?: string) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<unknown> };
  };
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return;
  }
  const root = document.documentElement;
  if (cls) root.classList.add(cls);
  const done = () => {
    if (cls) root.classList.remove(cls);
  };
  doc.startViewTransition(() => flushSync(update)).finished.then(done, done);
}
