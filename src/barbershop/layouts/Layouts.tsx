import { BarChartOutlined, CalendarOutlined, HomeOutlined, StarOutlined, UserOutlined } from '@ant-design/icons';
import type { CSSProperties, ReactNode } from 'react';
import { Outlet } from 'react-router';
import { BottomNav, type BottomNavItem } from '../components/BottomNav';
import { CONTENT_MAX_WIDTH, NAV_HEIGHT, color, font } from '../shared/theme';

/** Fundo e tipografia de todas as telas. */
export function ShellLayout() {
  return (
    <div style={{ minHeight: '100vh', background: color.ground, color: color.ink, fontFamily: font.body }}>
      <Outlet />
    </div>
  );
}

interface ScreenProps {
  children: ReactNode;
  /** Espaço reservado no rodapé para a barra fixa (abas ou ActionBar). */
  bottomSpace?: number;
  gap?: number;
  style?: CSSProperties;
}

/** Coluna de conteúdo de uma tela: largura de celular, centralizada no desktop. */
export function Screen({ children, bottomSpace = 32, gap = 24, style }: ScreenProps) {
  return (
    <main
      style={{
        boxSizing: 'border-box',
        maxWidth: CONTENT_MAX_WIDTH,
        margin: '0 auto',
        padding: `48px 24px calc(${bottomSpace}px + env(safe-area-inset-bottom))`,
        display: 'flex',
        flexDirection: 'column',
        gap,
        ...style,
      }}
    >
      {children}
    </main>
  );
}

/** Espaço para o conteúdo das telas com abas não ficar sob a BottomNav. */
export const TAB_SCREEN_SPACE = NAV_HEIGHT + 32;

const CLIENT_TABS: BottomNavItem[] = [
  { to: '/', label: 'Início', icon: <HomeOutlined />, end: true },
  { to: '/agendar', label: 'Agendar', icon: <CalendarOutlined /> },
  { to: '/clube', label: 'Clube', icon: <StarOutlined /> },
  { to: '/perfil', label: 'Perfil', icon: <UserOutlined /> },
];

const BARBER_TABS: BottomNavItem[] = [
  { to: '/barbeiro', label: 'Agenda', icon: <CalendarOutlined />, end: true },
  { to: '/barbeiro/painel', label: 'Painel', icon: <BarChartOutlined /> },
];

export function ClientLayout() {
  return (
    <>
      <Outlet />
      <BottomNav ariaLabel="Principal" items={CLIENT_TABS} />
    </>
  );
}

export function BarberLayout() {
  return (
    <>
      <Outlet />
      <BottomNav ariaLabel="Barbeiro" items={BARBER_TABS} />
    </>
  );
}
