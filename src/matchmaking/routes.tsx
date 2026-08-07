import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { MatchmakingLayout } from './layouts/MatchmakingLayout';
import { Sessions } from './pages/Sessions';
import { SessionDetail } from './pages/SessionDetail';
import { Players } from './pages/Players';

export function MatchmakingRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MatchmakingLayout />}>
          <Route index element={<Sessions />} />
          <Route path="sessoes/:sessionId" element={<SessionDetail />} />
          <Route path="jogadores" element={<Players />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
