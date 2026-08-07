import { ConfigProvider, App as AntApp } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import ptBR from 'antd/locale/pt_BR';
import { queryClient } from '../services/queryClient';
import { VolleyballRouter } from './routes';

export function VolleyballApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ptBR}
        theme={{
          token: {
            colorPrimary: '#fa8c16',
            borderRadius: 8,
          },
        }}
      >
        <AntApp>
          <VolleyballRouter />
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
