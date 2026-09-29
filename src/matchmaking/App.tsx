import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import ptBR from 'antd/locale/pt_BR';
import { queryClient } from '../services/queryClient';
import { MatchmakingRouter } from './routes';
import { color, font } from './shared/theme';

export function MatchmakingApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ptBR}
        theme={{
          token: {
            colorPrimary: color.accent,
            colorText: color.ink,
            colorTextSecondary: color.muted,
            colorBgLayout: color.ground,
            fontFamily: font.body,
            borderRadius: 10,
            controlHeight: 40,
            controlHeightLG: 48,
          },
        }}
      >
        <AntApp>
          <MatchmakingRouter />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
