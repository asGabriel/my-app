import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
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
      <AppRouter />
    </ConfigProvider>
  );
}

export default App;
