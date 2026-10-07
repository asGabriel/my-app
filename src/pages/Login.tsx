import { useState } from 'react';
import { Card, Typography, Space, App, Spin, Alert } from 'antd';
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';

const { Title, Text } = Typography;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return 'Seu e-mail não tem acesso a este app';
  }
  return 'Não foi possível entrar com o Google';
}

export function Login() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const onSuccess = async ({ credential }: CredentialResponse) => {
    if (!credential) {
      message.error(loginErrorMessage(null));
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(credential);
      navigate(from, { replace: true });
    } catch (error) {
      message.error(loginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(120% 60% at 50% -5%, #1d2033 0%, var(--color-bg) 55%)',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              Home App
            </Title>
            <Text type="secondary">Faça login para continuar</Text>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <Spin spinning={loading}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={onSuccess}
                    onError={() => message.error(loginErrorMessage(null))}
                    // Quem já entrou antes é logado de novo sem clicar (One Tap),
                    // o que cobre a expiração de 1h do token da API.
                    useOneTap
                    auto_select
                    theme="filled_black"
                    shape="pill"
                    text="signin_with"
                  />
                </GoogleOAuthProvider>
              </div>
            </Spin>
          ) : (
            <Alert type="error" showIcon message="VITE_GOOGLE_CLIENT_ID não configurado" />
          )}
        </Space>
      </Card>
    </div>
  );
}
