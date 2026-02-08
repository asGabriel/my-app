import { useState } from 'react';
import { Layout, Menu, Button, Drawer, theme, Dropdown, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { QuickActions } from '../components/QuickActions';
import { DebtFormModal } from '../components/DebtFormModal';
import { IncomeFormModal } from '../components/IncomeFormModal';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/contas-a-pagar',
    icon: <FileTextOutlined />,
    label: 'Contas a Pagar',
  },
  {
    key: '/receitas',
    icon: <RiseOutlined />,
    label: 'Receitas',
  },
  {
    key: '/cadastros',
    icon: <AppstoreOutlined />,
    label: 'Cadastros',
    children: [
      {
        key: '/cadastros/instrumentos-financeiros',
        label: 'Instrumentos Financeiros',
      },
      {
        key: '/cadastros/recorrencias',
        label: 'Contas Recorrentes',
      },
    ],
  },
  {
    key: '/configuracoes',
    icon: <SettingOutlined />,
    label: 'Configurações',
  },
];

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
    setMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user',
      label: user?.name || 'Usuário',
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: handleLogout,
    },
  ];

  const siderContent = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
        className="desktop-sider"
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {collapsed ? 'HM' : 'Home App'}
        </div>
        {siderContent}
      </Sider>

      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0, background: '#001529' } }}
        width={250}
        className="mobile-drawer"
      >
        {siderContent}
      </Drawer>

      <Layout
        style={{
          marginLeft: collapsed ? 0 : 200,
          transition: 'margin-left 0.2s',
        }}
        className="main-layout-content"
      >
        <Header
          style={{
            padding: '0 16px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="desktop-menu-toggle"
            style={{
              fontSize: 16,
              width: 48,
              height: 48,
            }}
          />

          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileDrawerOpen(true)}
            className="mobile-menu-toggle"
            style={{
              fontSize: 16,
              width: 48,
              height: 48,
            }}
          />

          <span style={{ fontWeight: 600, fontSize: 18, flex: 1 }}>Dashboard</span>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
                maxWidth: 'min(180px, 50vw)',
              }}
            >
              <span
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: 'inherit',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name || 'Usuário'}
              </span>
              <Avatar
                size="small"
                style={{ backgroundColor: '#1890ff' }}
                icon={<UserOutlined />}
              />
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 'calc(100vh - 64px - 32px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <QuickActions
        onAddDebt={() => setDebtModalOpen(true)}
        onAddIncome={() => setIncomeModalOpen(true)}
      />

      <DebtFormModal
        open={debtModalOpen}
        onClose={() => setDebtModalOpen(false)}
      />

      <IncomeFormModal
        open={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
      />
    </Layout>
  );
}
