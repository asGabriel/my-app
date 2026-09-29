import { Empty, Spin } from 'antd';
import { InfoCircleOutlined, LogoutOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import type { Gender } from '../../../api';
import { color, font, iconButton, plural } from '../../shared/theme';

export interface QueueRow {
  id: string;
  playerId: string;
  name: string;
  gender?: Gender;
  gamesPlayed: number;
  pinned: boolean;
}

interface QueueViewProps {
  queue: QueueRow[];
  isLoading: boolean;
  pendingPinPlayerId: string | null;
  pendingCheckOutPlayerId: string | null;
  onTogglePin: (playerId: string, pinned: boolean) => void;
  onCheckOut: (row: QueueRow) => void;
}

export function QueueView({
  queue,
  isLoading,
  pendingPinPlayerId,
  pendingCheckOutPlayerId,
  onTogglePin,
  onCheckOut,
}: QueueViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 12,
          background: color.groundDeep,
          fontSize: 13,
          color: '#44403C',
        }}
      >
        <InfoCircleOutlined style={{ fontSize: 16, flexShrink: 0 }} />
        Fixados primeiro, depois quem jogou menos, depois quem espera há mais tempo.
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}
      {!isLoading && !queue.length && <Empty description="Fila vazia." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {queue.map((entry, index) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minHeight: 64,
              padding: '0 4px 0 14px',
              borderRadius: 14,
              background: color.surface,
              border: `1.5px solid ${entry.pinned ? '#FDBA74' : 'transparent'}`,
            }}
          >
            <span
              style={{
                width: 32,
                flexShrink: 0,
                fontFamily: font.display,
                fontSize: 26,
                fontWeight: 700,
                color: entry.pinned ? color.accent : color.subtle,
              }}
            >
              {index + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{entry.name}</span>
              <span style={{ fontSize: 13, color: color.muted }}>
                {entry.pinned ? 'Fixado · ' : ''}
                {plural(entry.gamesPlayed, 'jogo')}
              </span>
            </div>
            <button
              aria-label={entry.pinned ? `Desafixar ${entry.name}` : `Fixar ${entry.name} no topo`}
              aria-pressed={entry.pinned}
              disabled={pendingPinPlayerId === entry.playerId}
              onClick={() => onTogglePin(entry.playerId, !entry.pinned)}
              style={{
                ...iconButton,
                background: entry.pinned ? color.accentSoft : 'transparent',
                color: entry.pinned ? color.accent : '#57534E',
              }}
            >
              {pendingPinPlayerId === entry.playerId ? <Spin size="small" /> : entry.pinned ? <PushpinFilled /> : <PushpinOutlined />}
            </button>
            <button
              aria-label={`Check-out de ${entry.name}`}
              disabled={pendingCheckOutPlayerId === entry.playerId}
              onClick={() => onCheckOut(entry)}
              style={{ ...iconButton, color: color.danger }}
            >
              {pendingCheckOutPlayerId === entry.playerId ? <Spin size="small" /> : <LogoutOutlined />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
