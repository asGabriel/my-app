import { BrowserRouter, Routes, Route } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { Login } from '../pages/Login';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<div>Página de Usuários (em construção)</div>} />
          <Route path="configuracoes" element={<div>Página de Configurações (em construção)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
