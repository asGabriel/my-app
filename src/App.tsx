import { ConfigProvider, App as AntApp } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './routes';
import './App.css';
import './layouts/MainLayout.css';

function App() {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <AntApp>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
