import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router';

const TABS = [
  { key: '/', label: 'Sessões', icon: <CalendarOutlined /> },
  { key: '/jogadores', label: 'Jogadores', icon: <TeamOutlined /> },
];

function activeTabKey(pathname: string) {
  if (pathname.startsWith('/jogadores')) return '/jogadores';
  return '/';
}

export function MatchmakingLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = activeTabKey(location.pathname);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f5f5f5',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#fa8c16',
          color: '#fff',
          padding: '14px 20px',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 0.3,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        }}
      >
        🏐 Vôlei
      </header>

      <main
        style={{
          flex: 1,
          padding: '16px 16px calc(84px + env(safe-area-inset-bottom))',
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                padding: '10px 0 8px',
                border: 'none',
                background: 'none',
                color: isActive ? '#fa8c16' : '#8c8c8c',
                fontSize: 20,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.icon}
              <span style={{ fontSize: 12 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
