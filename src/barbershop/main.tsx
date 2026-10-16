import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { BarbershopApp } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BarbershopApp />
  </StrictMode>,
);
