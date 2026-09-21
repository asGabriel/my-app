/**
 * Liga o mock do Controle Mensal (dados em memória + sessão fake, sem backend).
 * Ligado por padrão enquanto as rotas de finance do backend v2 não existem;
 * para desligar: `VITE_FINANCE_MOCK=false` no .env.local.
 */
export const FINANCE_MOCK = import.meta.env.VITE_FINANCE_MOCK !== 'false';

export const MOCK_TOKEN = 'mock-token';

export const MOCK_USER = {
  id: '00000000-0000-4000-8000-0000000000aa',
  clientId: '00000000-0000-4000-8000-000000000001',
  username: 'gabriel',
  name: 'Gabriel',
  email: 'gabriel@example.com',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: null,
};
