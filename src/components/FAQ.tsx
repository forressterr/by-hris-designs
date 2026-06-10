import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps, Variants } from 'framer-motion';
import { EASE } from '../lib/motion';

const Chevron = () => (
  <svg
    className="faq__chevron"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Stagger orchestration — parent <ul> cascades each <li> in turn as
// the list scrolls into view. Tuned for ~50 ms per item so a 12-item
// list still finishes in under a second.

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = (reduce: boolean): Variants => ({
  hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: reduce ? 0 : 0.45, ease: EASE },
  },
});

export default function FAQ({
  items,
  initialOpen = 0,
}: {
  items: { question: string; answer: ReactNode }[];
  initialOpen?: number;
}) {
  const [open, setOpen] = useState(initialOpen);
  const prefersReducedMotion = useReducedMotion();

  // Small horizontal nudge on hover — only on closed items so an open
  // panel doesn't appear to drift sideways when the cursor returns to
  // the trigger.
  const triggerMotion: MotionProps = prefersReducedMotion
    ? {}
    : {
        whileHover: {
          x: 2,
          transition: { type: 'spring', stiffness: 400, damping: 24 },
        },
        whileTap: { scale: 0.995, transition: { duration: 0.1 } },
      };

  const itemMotion = itemVariants(!!prefersReducedMotion);

  return (
    <motion.ul
      className="faq__list"
      role="list"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={listVariants}
    >
      {items.map((item, index) => {
        const isOpen = open === index;
        const panelId = `faq-panel-${index}`;
        const triggerId = `faq-trigger-${index}`;
        return (
          <motion.li
            className="faq__item"
            key={item.question}
            variants={itemMotion}
          >
            <motion.button
              type="button"
              className="faq__trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              id={triggerId}
              onClick={() => setOpen(isOpen ? -1 : index)}
              {...(isOpen ? {} : triggerMotion)}
            >
              <span>{item.question}</span>
              <Chevron />
            </motion.button>
            {/* Panel is always in the DOM (just visually collapsed when
                closed) so its open/close can be animated via CSS. The
                wrapper toggles between grid-template-rows: 0fr and 1fr
                — animating between fr units gives a smooth height
                transition from 0 to the panel's natural content height
                without having to measure it in JS. aria-hidden carries
                the closed state for assistive tech. */}
            <div
              className={`faq__panel-wrapper${isOpen ? ' is-open' : ''}`}
              aria-hidden={!isOpen}
            >
              <div
                className="faq__panel"
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
              >
                {item.answer}
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
