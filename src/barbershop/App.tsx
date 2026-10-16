import { ConfigProvider, App as AntApp, theme } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ptBR from 'antd/locale/pt_BR';
import { BarbershopRouter } from './routes';
import { color, font } from './shared/theme';

// Client próprio: o módulo só fala com o mock em memória por enquanto, então
// não depende do client compartilhado (src/services) nem da auth do backend.
const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

export function BarbershopApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ptBR}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: color.accent,
            colorText: color.ink,
            colorTextSecondary: color.muted,
            colorBgBase: color.ground,
            colorBgContainer: color.surface,
            colorBgElevated: color.surfaceRaised,
            colorBorder: color.lineStrong,
            fontFamily: font.body,
            borderRadius: 14,
          },
        }}
      >
        <AntApp>
          <BarbershopRouter />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
