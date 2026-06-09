import Link from 'next/link';
import { motion } from 'framer-motion';
import Seo from '../components/Seo';

// motion(Link) once at module scope — creating it inside the component
// would remount the link on every render and confuse Router.
const MotionLink = motion.create(Link);

export default function NotFound() {
  return (
    <div className="container page-canvas">
      <Seo path="/404" />
      <section
        className="section"
        style={{ textAlign: 'center', minHeight: '60vh' }}
      >
        <span className="eyebrow">404</span>
        <h1 style={{ marginTop: 16 }}>This page wandered off.</h1>
        <p className="muted" style={{ marginTop: 12 }}>
          Let’s get you back somewhere useful.
        </p>
        <MotionLink
          href="/"
          className="btn btn--dark"
          style={{ marginTop: 28 }}
          whileHover={{
            y: -1,
            transition: { type: 'spring', stiffness: 380, damping: 24 },
          }}
          whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
        >
          Back to home →
        </MotionLink>
      </section>
    </div>
  );
}
