import { useState } from 'react';
import { App, Spin, Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { usePlayers, type Player } from '../../api';
import { PlayerFormSheet } from '../components/PlayerFormSheet';
import { Fab } from '../components/Fab';
import { PageHeader } from '../components/PageHeader';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { genderLabel } from '../shared/labels';
import { color } from '../shared/theme';

export function Players() {
  const { data: players, isLoading } = usePlayers();
  const { message } = App.useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const sorted = players ? [...players].sort((a, b) => a.name.localeCompare(b.name)) : [];

  const openCreate = () => {
    setEditingPlayer(null);
    setSheetOpen(true);
  };

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    setSheetOpen(true);
  };

  return (
    <div>
      <PageHeader title="Jogadores" />

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      )}

      {!isLoading && !sorted.length && <Empty description="Nenhum jogador cadastrado" />}

      {!!sorted.length && (
        <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden' }}>
          {sorted.map((player) => (
            <button
              key={player.id}
              onClick={() => openEdit(player)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 64,
                padding: '0 14px',
                border: 'none',
                borderBottom: `1px solid ${color.lineSoft}`,
                background: color.surface,
                color: color.ink,
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <PlayerAvatar name={player.name} gender={player.gender} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{player.name}</span>
                <span style={{ fontSize: 13, color: color.muted }}>{genderLabel[player.gender]}</span>
              </span>
              <RightOutlined style={{ color: color.subtle }} />
            </button>
          ))}
        </div>
      )}

      <Fab onClick={openCreate} label="Novo jogador" />

      <PlayerFormSheet
        open={sheetOpen}
        player={editingPlayer}
        onClose={() => setSheetOpen(false)}
        onError={(error) => message.error(error)}
      />
    </div>
  );
}
