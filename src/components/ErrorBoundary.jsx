import { Component } from 'react';

/**
 * App-level error boundary.
 *
 * Catches render/runtime errors anywhere below it (and failed lazy-route
 * chunk imports) so a crash shows a calm, on-brand fallback instead of the
 * blank white screen React gives an uncaught error in production.
 *
 * Stale-deploy resilience: when a returning visitor on an old tab navigates
 * to a route whose code-split chunk no longer exists (hashes changed in the
 * latest deploy), the dynamic import throws. We reload ONCE — guarded by a
 * sessionStorage flag so it can never loop — to pull the fresh build.
 *
 * The fallback reuses existing classes (.container/.section/.eyebrow/.btn),
 * so it introduces no new design — it matches the 404 page's treatment.
 */
const CHUNK_ERROR =
  /dynamically imported module|Loading chunk|Importing a module script failed|error loading dynamically imported/i;
const RELOAD_FLAG = 'bh-chunk-reloaded';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const message = String((error && error.message) || error || '');
    if (CHUNK_ERROR.test(message)) {
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
        }
      } catch (_e) {
        /* storage blocked — fall through to the fallback UI */
      }
    }
  }

  handleReload() {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch (_e) {
      /* noop */
    }
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="container page-canvas">
        <section
          className="section"
          style={{ textAlign: 'center', minHeight: '60vh' }}
        >
          <span className="eyebrow">Something went wrong</span>
          <h1 style={{ marginTop: 16 }}>This page hit a snag.</h1>
          <p className="muted" style={{ marginTop: 12 }}>
            A quick reload usually sorts it out.
          </p>
          <button
            type="button"
            className="btn btn--dark"
            style={{ marginTop: 28 }}
            onClick={this.handleReload}
          >
            Reload →
          </button>
        </section>
      </div>
    );
  }
}
