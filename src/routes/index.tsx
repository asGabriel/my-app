import { createBrowserRouter, RouterProvider } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../pages/Dashboard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'usuarios',
        element: <div>Página de Usuários (em construção)</div>,
      },
      {
        path: 'configuracoes',
        element: <div>Página de Configurações (em construção)</div>,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
