import { useState } from 'react';
import { Drawer, Empty, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { Player } from '../../api';
import { PlayerAvatar } from './PlayerAvatar';
import { color } from '../shared/theme';

interface CheckInSheetProps {
  open: boolean;
  /** Jogadores do roster que ainda não fizeram check-in. */
  players: Player[];
  pendingPlayerId: string | null;
  onCheckIn: (playerId: string) => void;
  onClose: () => void;
}

/** Check-in rápido na fila: toque no nome e o jogador entra. Fica aberto pra
 * marcar vários de uma vez. */
export function CheckInSheet({ open, players, pendingPlayerId, onCheckIn, onClose }: CheckInSheetProps) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const filtered = players.filter((player) => player.name.toLowerCase().includes(term));

  return (
    <Drawer
      title="Check-in na fila"
      placement="bottom"
      open={open}
      onClose={onClose}
      afterOpenChange={(isOpen) => !isOpen && setSearch('')}
      height="min(80vh, 600px)"
      styles={{ content: { borderRadius: '20px 20px 0 0' }, body: { padding: '12px 16px' } }}
    >
      <Input
        size="large"
        allowClear
        prefix={<SearchOutlined style={{ color: color.muted }} />}
        placeholder="Buscar no roster"
        aria-label="Buscar no roster"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      {!filtered.length && (
        <Empty
          description={players.length ? 'Ninguém com esse nome.' : 'Todo o roster já fez check-in.'}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {filtered.map((player) => (
          <button
            key={player.id}
            onClick={() => onCheckIn(player.id)}
            disabled={pendingPlayerId === player.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 60,
              padding: '0 4px',
              border: 'none',
              borderBottom: `1px solid ${color.lineSoft}`,
              background: 'none',
              color: color.ink,
              fontFamily: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
              opacity: pendingPlayerId === player.id ? 0.5 : 1,
            }}
          >
            <PlayerAvatar name={player.name} gender={player.gender} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>
              {player.name}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: color.accent, fontWeight: 600, fontSize: 14 }}>
              <PlusOutlined /> Entrar
            </span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}
