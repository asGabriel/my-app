import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { Login } from '../pages/Login';
import { MesTab } from '../pages/controle-mensal/MesTab';
import { ParcelasTab } from '../pages/controle-mensal/ParcelasTab';
import { PainelTab } from '../pages/controle-mensal/PainelTab';
import { DebtsTab } from '../pages/controle-mensal/DebtsTab';
import { NovoTab } from '../pages/controle-mensal/NovoTab';
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
          {/* Controle Mensal: mesmo estado de mês/privacidade compartilhado
              entre as 4 telas via FinanceMonthProvider (ver MainLayout). */}
          <Route index element={<MesTab />} />
          <Route path="parcelas" element={<ParcelasTab />} />
          <Route path="painel" element={<PainelTab />} />
          <Route path="debitos" element={<DebtsTab />} />
          <Route path="novo" element={<NovoTab />} />

          {/* Receitas, Extrato, Cadastros e Configurações removidos das rotas
              por hora (a pedido do Gabriel) — telas continuam no repo,
              intactas, só não estão mais no menu/roteamento. */}
        </Route>
        {/* Rota catch-all: redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
