import { Empty } from 'antd';
import { Pill } from '../../components/Pill';
import { color, font, plural } from '../../shared/theme';

export interface Standing {
  playerId: string;
  wins: number;
  losses: number;
  games: number;
}

interface RankingViewProps {
  standings: Standing[];
  playerName: (id: string) => string;
}

export function RankingView({ standings, playerName }: RankingViewProps) {
  if (!standings.length) return <Empty description="Nenhum jogador confirmado ainda." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden' }}>
      {standings.map((standing, index) => (
        <div
          key={standing.playerId}
          style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '0 14px', borderBottom: `1px solid ${color.lineSoft}` }}
        >
          <span
            style={{
              width: 32,
              flexShrink: 0,
              fontFamily: font.display,
              fontSize: 24,
              fontWeight: 700,
              color: index < 3 ? color.accent : color.subtle,
            }}
          >
            {index + 1}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{playerName(standing.playerId)}</span>
            <span style={{ fontSize: 13, color: color.muted }}>{plural(standing.games, 'jogo')}</span>
          </div>
          <Pill bg="#DCFCE7" fg="#166534">
            {standing.wins}V
          </Pill>
          <Pill bg="#FEE2E2" fg="#991B1B">
            {standing.losses}D
          </Pill>
        </div>
      ))}
    </div>
  );
}
