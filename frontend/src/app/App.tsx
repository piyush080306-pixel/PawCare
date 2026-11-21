import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';
import { Toaster } from '@/components/ui/Toaster';
import { useUiStore } from '@/store/ui';

export default function App() {
  const setSearchOpen = useUiStore(state => state.setSearchOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSearchOpen]);

  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster />
    </Providers>
  );
}
