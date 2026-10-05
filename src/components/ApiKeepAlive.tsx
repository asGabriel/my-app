import { useQuery } from '@tanstack/react-query';
import { statusRequest } from '../services/api';

// O Render (plano free) hiberna o rust-api após ~15 min sem requisições, e a
// primeira chamada depois disso leva dezenas de segundos. Com o app aberto
// mas parado — ex.: durante uma partida longa — esse ping o mantém acordado.
const KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Pinga `/api/status` ao abrir o app e a cada 5 min enquanto ele estiver
 * aberto. Ao voltar pra aba/desbloquear o celular (o navegador congela os
 * timers em segundo plano), pinga de novo na hora. Não renderiza nada.
 */
export function ApiKeepAlive() {
  useQuery({
    queryKey: ['api', 'status'],
    queryFn: statusRequest,
    refetchInterval: KEEP_ALIVE_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    retry: false,
  });

  return null;
}
