import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch {
      message.error('Email ou senha inválidos');
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 16,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              Home App
            </Title>
            <Text type="secondary">Faça login para continuar</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Digite seu email' },
                { type: 'email', message: 'Email inválido' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Email" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Digite sua senha' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Entrar
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
