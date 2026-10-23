import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last; only the top one handles Tab (the trailer can
// open on top of the info modal)
const stack: HTMLElement[] = [];

// Modal focus handling: focus the first control on open, keep Tab inside the
// dialog, and give focus back to whatever opened it on close.
export function useDialogFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    stack.push(node);
    // Start on a real control rather than an embedded player
    (focusables().find((el) => el.tagName !== "IFRAME") ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || stack[stack.length - 1] !== node) return;
      const list = focusables();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      // Focus on the panel itself (after clicking plain content) or outside it
      // (the focused control unmounted) counts as "before the first control"
      const outside = active === node || !node.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    // On document, so Tab still reaches us when focus has fallen back to <body>
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(node), 1);
      previous?.focus?.();
    };
  }, []);

  return ref;
}
