/**
 * The house easing curve — one motion vocabulary shared by the page
 * transition (_app), Reveal, FAQ and ScreenSwitcher. Change it here and it
 * changes everywhere.
 *
 * (Typed as a mutable tuple because framer-motion's BezierDefinition
 * rejects readonly tuples.)
 */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
