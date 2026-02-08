import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { Dashboard } from '../pages/Dashboard';
import { Login } from '../pages/Login';
import { FinancialInstruments } from '../pages/FinancialInstruments';
import { DebtList } from '../pages/DebtList';
import { IncomeList } from '../pages/IncomeList';
import { Recurrences } from '../pages/Recurrences';
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
          <Route path="contas-a-pagar" element={<DebtList />} />
          <Route path="receitas" element={<IncomeList />} />
          <Route path="cadastros/instrumentos-financeiros" element={<FinancialInstruments />} />
          <Route path="cadastros/recorrencias" element={<Recurrences />} />
          <Route path="configuracoes" element={<div>Página de Configurações (em construção)</div>} />
        </Route>
        {/* Rota catch-all: redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
