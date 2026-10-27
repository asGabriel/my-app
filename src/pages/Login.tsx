import { useState } from 'react';
import { Card, Typography, Space, App, Spin, Alert, Input, Button, Divider } from 'antd';
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

/**
 * Só no dev server (`import.meta.env.DEV`, fica fora do build): entra com um
 * token da API já emitido, sem Google — ex.: `npm run dev:prod` sem
 * `VITE_GOOGLE_CLIENT_ID` (ou sem localhost nas origens do OAuth client).
 * O token sai do `localStorage.auth_token` do app publicado e vale 1h.
 */
function DevTokenLogin({ onLogin }: { onLogin: (token: string) => Promise<void> }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await onLogin(token.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Dev: cole o <Text code>auth_token</Text> do localStorage do app publicado.
      </Text>
      <Input.Password
        value={token}
        onChange={(e) => setToken(e.target.value)}
        onPressEnter={() => token.trim() && submit()}
        placeholder="Token da API (JWT)"
        aria-label="Token da API"
      />
      <Button block onClick={submit} loading={loading} disabled={!token.trim()}>
        Entrar com token
      </Button>
    </Space>
  );
}

export function Login() {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithToken } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const onTokenLogin = async (token: string) => {
    try {
      await loginWithToken(token);
      navigate(from, { replace: true });
    } catch (error) {
      message.error(
        error instanceof ApiError && error.status === 401 ? 'Token inválido ou expirado' : loginErrorMessage(error)
      );
    }
  };

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
            <Alert
              type={import.meta.env.DEV ? 'info' : 'error'}
              showIcon
              message="VITE_GOOGLE_CLIENT_ID não configurado"
            />
          )}

          {import.meta.env.DEV && (
            <>
              {GOOGLE_CLIENT_ID && <Divider plain style={{ margin: 0, fontSize: 12 }}>ou</Divider>}
              <DevTokenLogin onLogin={onTokenLogin} />
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
