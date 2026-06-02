import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';

const Home = lazy(() => import('./pages/Home.jsx'));
const Works = lazy(() => import('./pages/Works.jsx'));
const Project = lazy(() => import('./pages/Project.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Labs = lazy(() => import('./pages/Labs.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const PageFallback = () => <div className="route-fallback" aria-hidden="true" />;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageFallback />}>
              <Home />
            </Suspense>
          }
        />
        <Route
          path="works"
          element={
            <Suspense fallback={<PageFallback />}>
              <Works />
            </Suspense>
          }
        />
        <Route
          path="projects/:slug"
          element={
            <Suspense fallback={<PageFallback />}>
              <Project />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<PageFallback />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="labs"
          element={
            <Suspense fallback={<PageFallback />}>
              <Labs />
            </Suspense>
          }
        />
        <Route
          path="contact"
          element={
            <Suspense fallback={<PageFallback />}>
              <Contact />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
