import { useEffect, useState } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import type { Match } from '../../api';
import { BottomSheet } from './BottomSheet';
import { color } from '../shared/theme';

interface WinnerSheetProps {
  match: Match | null;
  /** Time tocado no card da quadra: já vem pré-selecionado. */
  initialWinnerId: string | null;
  teamLabelById: (id: string) => string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (matchId: string, winnerTeamId: string) => void;
}

/** Confirma o vencedor de uma partida: os dois times como opções grandes e
 * um botão que repete o nome do escolhido, pra não registrar o time errado. */
export function WinnerSheet({ match, initialWinnerId, teamLabelById, loading, onClose, onConfirm }: WinnerSheetProps) {
  const [winnerId, setWinnerId] = useState<string | null>(initialWinnerId);

  useEffect(() => {
    setWinnerId(initialWinnerId);
  }, [initialWinnerId, match?.id]);

  const teamIds = match ? [match.teamAId, match.teamBId] : [];

  return (
    <BottomSheet
      open={!!match}
      title={match ? `Quem venceu na Quadra ${match.court}?` : ''}
      height="auto"
      onClose={onClose}
      onSubmit={() => match && winnerId && onConfirm(match.id, winnerId)}
      submitText={winnerId ? `Confirmar vitória de ${teamLabelById(winnerId)}` : 'Escolha o vencedor'}
      submitDisabled={!winnerId}
      loading={loading}
    >
      <div role="radiogroup" aria-label="Time vencedor" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teamIds.map((teamId) => {
          const selected = teamId === winnerId;
          return (
            <button
              key={teamId}
              role="radio"
              aria-checked={selected}
              onClick={() => setWinnerId(teamId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                minHeight: 64,
                padding: '12px 16px',
                borderRadius: 16,
                border: `2px solid ${selected ? color.accent : color.line}`,
                background: selected ? color.accentTint : color.surface,
                color: color.ink,
                fontFamily: 'inherit',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selected ? color.accent : color.surface,
                  border: selected ? 'none' : `2px solid ${color.lineStrong}`,
                  color: '#FFFFFF',
                  fontSize: 14,
                }}
              >
                {selected && <CheckOutlined />}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, overflowWrap: 'anywhere' }}>{teamLabelById(teamId)}</span>
            </button>
          );
        })}
      </div>
      <p style={{ margin: '14px 0 0', fontSize: 14, lineHeight: 1.45, color: color.muted }}>
        Quem vence segura a quadra; o app sugere o próximo desafiante a partir da fila.
      </p>
    </BottomSheet>
  );
}
