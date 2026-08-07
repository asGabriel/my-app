import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { VolleyballLayout } from './layouts/VolleyballLayout';
import { Sessions } from './pages/Sessions';
import { SessionDetail } from './pages/SessionDetail';
import { Players } from './pages/Players';

export function VolleyballRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VolleyballLayout />}>
          <Route index element={<Sessions />} />
          <Route path="sessoes/:sessionId" element={<SessionDetail />} />
          <Route path="jogadores" element={<Players />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
