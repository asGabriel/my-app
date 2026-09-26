import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { FinanceMonthProvider } from '../finance/FinanceMonthContext';
import { PaySheet } from '../components/PaySheet';
import { DetailSheet } from '../components/DetailSheet';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const PRIMARY_NAV: NavItem[] = [
  { path: '/', label: 'Mês', icon: 'ph ph-calendar-dots' },
  { path: '/parcelas', label: 'Parcelas', icon: 'ph ph-chart-donut' },
  { path: '/painel', label: 'Painel', icon: 'ph ph-chart-bar' },
  { path: '/debitos', label: 'Débitos', icon: 'ph ph-list-bullets' },
  { path: '/novo', label: 'Novo', icon: 'ph ph-plus-circle' },
];

// Receitas, Extrato, Cadastros e Configurações removidos do menu por hora
// (a pedido do Gabriel) — as telas continuam no repo, só não estão roteadas
// (ver routes/index.tsx). Para trazer de volta, restaurar os itens aqui e
// as rotas correspondentes.
const SECONDARY_NAV: NavItem[] = [];

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 9, border: 0, cursor: 'pointer', textAlign: 'left',
        borderRadius: 'var(--radius-md)', padding: '8px 9px', fontSize: 13, fontFamily: 'var(--font-body)',
        background: active ? 'var(--color-accent-900)' : 'transparent',
        color: active ? 'var(--color-accent-200)' : 'var(--color-neutral-400)',
      }}
    >
      <i className={item.icon} style={{ fontSize: 16 }} />
      <span>{item.label}</span>
    </button>
  );
}

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const go = (path: string) => {
    navigate(path);
  };

  return (
    <FinanceMonthProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <aside
          className="controle-sider"
          style={{
            width: 200, flex: '0 0 auto', borderRight: '1px solid var(--color-divider)',
            padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4,
            position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: 14, padding: '0 8px 16px' }}>
            Controle
          </div>
          {PRIMARY_NAV.map((item) => (
            <NavButton key={item.path} item={item} active={location.pathname === item.path} onClick={() => go(item.path)} />
          ))}
          <div className="hr" />
          {SECONDARY_NAV.map((item) => (
            <NavButton key={item.path} item={item} active={location.pathname === item.path} onClick={() => go(item.path)} />
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--color-divider)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-neutral-400)', padding: '0 8px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Usuário'}
            </div>
            <NavButton item={{ path: '__logout', label: 'Sair', icon: 'ph ph-sign-out' }} active={false} onClick={handleLogout} />
          </div>
        </aside>

        {/* Sem topbar própria no mobile: o protótipo não tem uma barra de app
            acima do conteúdo — a saudação + toggle de privacidade (dentro de
            MesTab) já cumprem esse papel visualmente. */}
        <main style={{ flex: '1 1 auto', minWidth: 0, padding: '22px 26px 30px' }} className="controle-main">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>

        <nav className="controle-bottom-tabs">
          {PRIMARY_NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none',
                  border: 0, cursor: 'pointer', padding: '6px 0', fontFamily: 'var(--font-body)',
                  color: active ? 'var(--color-accent-300)' : 'var(--color-neutral-500)',
                }}
              >
                <i className={item.icon} style={{ fontSize: 20 }} />
                <span style={{ fontSize: 10.5 }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <PaySheet />
      <DetailSheet />
    </FinanceMonthProvider>
  );
}
