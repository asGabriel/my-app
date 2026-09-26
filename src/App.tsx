import { ConfigProvider, App as AntApp, theme } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import ptBR from 'antd/locale/pt_BR';
import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './routes';
import { queryClient } from './services/queryClient';
import './App.css';
import './styles/nocturne.css';
import './layouts/MainLayout.css';
import './styles/responsive.css';

// Paleta "Nocturne" do protótipo Controle Mensal — ver src/styles/nocturne.css
// para os tokens CSS usados pelas telas custom; aqui alinhamos o tema do AntD
// (usado nas telas de cadastro/config) à mesma paleta.
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={ptBR}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#9184d9',
            colorBgBase: '#161826',
            colorBgContainer: '#232532',
            colorBgElevated: '#2b2e3d',
            colorBorder: '#3f424d',
            colorBorderSecondary: '#3f424d',
            borderRadius: 8,
            fontFamily: "var(--font-body), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          },
        }}
      >
        <AntApp>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
