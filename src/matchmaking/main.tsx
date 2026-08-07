import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { MatchmakingApp } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MatchmakingApp />
  </StrictMode>,
);
