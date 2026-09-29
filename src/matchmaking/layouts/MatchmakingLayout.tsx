import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { CONTENT_MAX_WIDTH, NAV_HEIGHT, color, font } from '../shared/theme';

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
  // Dentro de uma sessão a tela tem cabeçalho e navegação próprios (abas da
  // sessão no rodapé), então o shell só entrega o fundo.
  const isSessionRoute = location.pathname.startsWith('/sessoes/');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: color.ground,
        color: color.ink,
        fontFamily: font.body,
      }}
    >
      {isSessionRoute ? (
        <Outlet />
      ) : (
        <>
          <main
            style={{
              padding: `0 16px calc(${NAV_HEIGHT + 96}px + env(safe-area-inset-bottom))`,
              maxWidth: CONTENT_MAX_WIDTH,
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            <Outlet />
          </main>
          <BottomNav
            ariaLabel="Principal"
            items={TABS}
            activeKey={activeTabKey(location.pathname)}
            onSelect={(key) => navigate(key)}
          />
        </>
      )}
    </div>
  );
}
