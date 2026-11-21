import { createBrowserRouter, Link, Navigate, useRouteError } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Animals from '@/pages/Animals';
import AnimalDetails from '@/pages/AnimalDetails';
import Adoptions from '@/pages/Adoptions';
import AdoptionDetails from '@/pages/AdoptionDetails';
import AdoptionRecords from '@/pages/AdoptionRecords';
import Staff from '@/pages/Staff';
import Health from '@/pages/Health';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import { Button } from '@/components/ui/Button';

function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'An unexpected routing error occurred.';
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="panel max-w-md p-6 text-center">
        <p className="font-display text-2xl font-semibold text-ink">Something went wrong</p>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Button asChild variant="primary" className="mt-5">
          <Link to="/dashboard">Return to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="panel max-w-md p-6 text-center">
        <p className="font-display text-5xl font-bold text-brand">404</p>
        <p className="mt-3 font-display text-lg font-semibold text-ink">Page not found</p>
        <p className="mt-1 text-sm text-muted">
          The page you requested does not exist in this shelter workspace.
        </p>
        <Button asChild variant="primary" className="mt-5">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'animals', element: <Animals /> },
      { path: 'animals/:id', element: <AnimalDetails /> },
      { path: 'adoptions', element: <Adoptions /> },
      { path: 'adoptions/:id', element: <AdoptionDetails /> },
      { path: 'adoption-records', element: <AdoptionRecords /> },
      { path: 'staff', element: <Staff /> },
      { path: 'health', element: <Health /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
