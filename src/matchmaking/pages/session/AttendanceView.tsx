import { useState } from 'react';
import { Empty, Input, Segmented, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Player } from '../../../api';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { color } from '../../shared/theme';

type Filter = 'all' | 'present' | 'absent';

const FILTER_OPTIONS: { label: string; value: Filter }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Presentes', value: 'present' },
  { label: 'Ausentes', value: 'absent' },
];

interface AttendanceViewProps {
  rosterPlayers: Player[];
  checkedInIds: Set<string>;
  isLoading: boolean;
  pendingPlayerId: string | null;
  onToggle: (playerId: string, checkIn: boolean) => void;
}

/** Presença do dia: a linha inteira é o interruptor de check-in/check-out. */
export function AttendanceView({ rosterPlayers, checkedInIds, isLoading, pendingPlayerId, onToggle }: AttendanceViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const term = search.trim().toLowerCase();
  const visible = rosterPlayers.filter((player) => {
    if (term && !player.name.toLowerCase().includes(term)) return false;
    const present = checkedInIds.has(player.id);
    if (filter === 'present') return present;
    if (filter === 'absent') return !present;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input
        size="large"
        allowClear
        prefix={<SearchOutlined style={{ color: color.muted }} />}
        placeholder="Buscar no roster"
        aria-label="Buscar no roster"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Segmented<Filter> block size="large" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}
      {!isLoading && !rosterPlayers.length && <Empty description="Nenhum jogador no roster ainda." />}
      {!isLoading && !!rosterPlayers.length && !visible.length && <Empty description="Ninguém nesse filtro." />}

      {!!visible.length && (
        <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden' }}>
          {visible.map((player) => {
            const present = checkedInIds.has(player.id);
            const pending = pendingPlayerId === player.id;
            return (
              <button
                key={player.id}
                role="switch"
                aria-checked={present}
                disabled={pending}
                onClick={() => onToggle(player.id, !present)}
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
                <span style={{ opacity: present ? 1 : 0.6, display: 'flex' }}>
                  <PlayerAvatar name={player.name} gender={player.gender} />
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, opacity: present ? 1 : 0.6 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{player.name}</span>
                  <span style={{ fontSize: 13, color: color.muted }}>{present ? 'Presente · na fila' : 'Ausente'}</span>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 52,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: 999,
                    padding: 3,
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: present ? 'flex-end' : 'flex-start',
                    alignItems: 'center',
                    background: present ? color.live : color.lineStrong,
                    opacity: pending ? 0.5 : 1,
                    transition: 'background 150ms',
                  }}
                >
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)' }} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
