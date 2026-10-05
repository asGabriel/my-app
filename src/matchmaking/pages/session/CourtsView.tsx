import type { CSSProperties, ReactNode } from 'react';
import { Spin } from 'antd';
import {
  CaretRightFilled,
  CloseOutlined,
  EditOutlined,
  RightOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { schemas, type Match, type Team } from '../../../api';
import { Pill } from '../../components/Pill';
import { teamStatusLabel, teamStatusTagColors } from '../../shared/labels';
import {
  card,
  color,
  disabledButton,
  displayTitle,
  iconButton,
  plural,
  primaryButton,
  sectionLabel,
} from '../../shared/theme';

const { draft: DRAFT } = schemas.TeamStatus.enum;

export interface CourtState {
  court: number;
  running: Match | undefined;
  holding: Team | null;
  drafts: Team[];
}

interface CourtsViewProps {
  courtStates: CourtState[];
  looseDrafts: Team[];
  activeTeams: Team[];
  disbandedTeams: Team[];
  matchHistory: Match[];
  /** Próximos times que a fila formaria, na ordem — vem do backend (`/queue/next`). */
  nextUp: string[][];
  playersPerTeam: number;
  isLoading: boolean;
  isStarting: boolean;
  teamLabel: (team: Team) => string;
  teamLabelById: (id: string) => string;
  playerName: (id: string) => string;
  onPickWinner: (match: Match, teamId: string) => void;
  onEditDraft: (team: Team) => void;
  onDiscardDraft: (team: Team) => void;
  onStart: (court: number, teamAId: string, teamBId: string) => void;
  onOpenQueue: () => void;
}

const teamRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 52,
  padding: '0 14px',
  borderRadius: 12,
  background: color.ground,
};

const teamName: CSSProperties = { flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' };

function CourtHeader({ court, live }: { court: number; live: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ ...displayTitle, fontSize: 20 }}>Quadra {court}</span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: live ? color.live : color.muted,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: live ? color.liveDot : color.subtle }} />
        {live ? 'Em jogo' : 'Livre'}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      <h2 style={sectionLabel}>{title}</h2>
      {children}
    </section>
  );
}

function NextUpCard({
  groups,
  playersPerTeam,
  playerName,
  onOpenQueue,
}: {
  groups: string[][];
  playersPerTeam: number;
  playerName: (id: string) => string;
  onOpenQueue: () => void;
}) {
  const noun = playersPerTeam === 2 ? 'dupla' : 'time';
  return (
    <section
      aria-label="Possíveis próximos da fila"
      style={{ borderRadius: 18, background: color.ink, color: '#FFFFFF', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: color.onInkMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Possíveis próximos
        </span>
        <button
          onClick={onOpenQueue}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            minHeight: 36,
            padding: '0 4px',
            border: 'none',
            background: 'none',
            color: color.accentOnInk,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Ver fila <RightOutlined style={{ fontSize: 11 }} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))`, gap: 8 }}>
        {groups.map((group, index) => (
          <div
            key={group.join()}
            style={{ padding: '8px 10px', borderRadius: 12, background: color.inkSoft, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: index === 0 ? color.accentOnInk : color.onInkMuted }}>
              {index + 1}ª {noun}
              {index === 0 ? ' · entra já' : ''}
            </span>
            <span style={{ fontSize: 15, fontWeight: 600, overflowWrap: 'anywhere' }}>
              {group.map(playerName).join(' / ')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DraftRow({
  label,
  team,
  teamLabel,
  onEdit,
  onDiscard,
}: {
  label: string;
  team: Team;
  teamLabel: (team: Team) => string;
  onEdit: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        minHeight: 52,
        padding: '4px 4px 4px 14px',
        borderRadius: 12,
        border: `1.5px dashed ${color.lineStrong}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: color.draftFg }}>{label}</span>
        <span style={teamName}>{teamLabel(team)}</span>
      </div>
      <button aria-label={`Editar ${teamLabel(team)}`} onClick={onEdit} style={{ ...iconButton, color: '#57534E' }}>
        <EditOutlined />
      </button>
      <button aria-label={`Descartar ${teamLabel(team)}`} onClick={onDiscard} style={{ ...iconButton, color: color.danger }}>
        <CloseOutlined />
      </button>
    </div>
  );
}

export function CourtsView({
  courtStates,
  looseDrafts,
  activeTeams,
  disbandedTeams,
  matchHistory,
  nextUp,
  playersPerTeam,
  isLoading,
  isStarting,
  teamLabel,
  teamLabelById,
  playerName,
  onPickWinner,
  onEditDraft,
  onDiscardDraft,
  onStart,
  onOpenQueue,
}: CourtsViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!!nextUp.length && (
        <NextUpCard groups={nextUp} playersPerTeam={playersPerTeam} playerName={playerName} onOpenQueue={onOpenQueue} />
      )}

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <Spin />
        </div>
      )}

      {courtStates.map(({ court, running, holding, drafts }) => {
        if (running) {
          return (
            <div key={court} style={card}>
              <CourtHeader court={court} live />
              {[running.teamAId, running.teamBId].map((teamId) => (
                <button
                  key={teamId}
                  onClick={() => onPickWinner(running, teamId)}
                  style={{ ...teamRow, border: 'none', color: color.ink, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                >
                  <span style={teamName}>{teamLabelById(teamId)}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: color.accent, flexShrink: 0 }}>
                    <TrophyOutlined /> Venceu
                  </span>
                </button>
              ))}
            </div>
          );
        }

        const teamAId = holding?.id ?? drafts[0]?.id;
        const teamBId = holding ? drafts[0]?.id : drafts[1]?.id;
        const canStart = !!teamAId && !!teamBId;

        return (
          <div key={court} style={card}>
            <CourtHeader court={court} live={false} />

            {holding && (
              <div style={{ ...teamRow, background: color.holdingBg }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: color.holdingFg }}>
                    Segurando a quadra
                    {holding.consecutiveWins > 0 && ` · ${plural(holding.consecutiveWins, 'vitória')}`}
                  </span>
                  <span style={teamName}>{teamLabel(holding)}</span>
                </div>
              </div>
            )}

            {drafts.map((draft, index) => (
              <DraftRow
                key={draft.id}
                label={holding || index > 0 ? 'Desafiante sugerido' : 'Time sugerido'}
                team={draft}
                teamLabel={teamLabel}
                onEdit={() => onEditDraft(draft)}
                onDiscard={() => onDiscardDraft(draft)}
              />
            ))}

            {!drafts.length && (
              <span style={{ fontSize: 13, color: color.muted }}>
                Sem desafiante sugerido. Use “Preencher” ou “Abrir quadra”.
              </span>
            )}

            <button
              disabled={!canStart || isStarting}
              onClick={() => canStart && onStart(court, teamAId!, teamBId!)}
              style={{ ...primaryButton, ...(!canStart || isStarting ? disabledButton : {}) }}
            >
              {isStarting ? <Spin size="small" /> : <CaretRightFilled />}
              Iniciar partida
            </button>
          </div>
        );
      })}

      {!!looseDrafts.length && (
        <Section title="Rascunhos sem quadra">
          <div style={{ ...card, gap: 8 }}>
            {looseDrafts.map((draft) => (
              <DraftRow
                key={draft.id}
                label="Rascunho"
                team={draft}
                teamLabel={teamLabel}
                onEdit={() => onEditDraft(draft)}
                onDiscard={() => onDiscardDraft(draft)}
              />
            ))}
            <span style={{ fontSize: 13, color: color.muted }}>Use “Abrir quadra” pra colocar em jogo.</span>
          </div>
        </Section>
      )}

      {!!activeTeams.length && (
        <Section title={`Times ativos (${activeTeams.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden' }}>
            {activeTeams.map((team) => {
              const tag = teamStatusTagColors[team.status];
              const incomplete = team.playerIds.length !== playersPerTeam;
              const details = [
                team.court != null && `Quadra ${team.court}`,
                incomplete && 'Roster incompleto',
                team.consecutiveWins > 0 && `${plural(team.consecutiveWins, 'vitória')} seguida${team.consecutiveWins > 1 ? 's' : ''}`,
              ].filter(Boolean);
              return (
                <div
                  key={team.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 60, padding: '6px 4px 6px 14px', borderBottom: `1px solid ${color.lineSoft}` }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, overflowWrap: 'anywhere' }}>{teamLabel(team)}</span>
                    {!!details.length && <span style={{ fontSize: 12, color: color.muted }}>{details.join(' · ')}</span>}
                  </div>
                  <Pill bg={tag.bg} fg={tag.fg}>
                    {teamStatusLabel[team.status]}
                  </Pill>
                  {team.status === DRAFT ? (
                    <button aria-label={`Editar ${teamLabel(team)}`} onClick={() => onEditDraft(team)} style={{ ...iconButton, color: '#57534E' }}>
                      <EditOutlined />
                    </button>
                  ) : (
                    <span style={{ width: 10 }} />
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {!!matchHistory.length && (
        <Section title="Histórico de partidas">
          <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden' }}>
            {matchHistory.map((match) => {
              const loserId = match.winnerTeamId === match.teamAId ? match.teamBId : match.teamAId;
              return (
                <div
                  key={match.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 14px', borderBottom: `1px solid ${color.lineSoft}` }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: color.live, overflowWrap: 'anywhere' }}>
                      <TrophyOutlined /> {teamLabelById(match.winnerTeamId!)}
                    </span>
                    <span style={{ fontSize: 13, color: color.muted, overflowWrap: 'anywhere' }}>
                      venceu {teamLabelById(loserId)}
                    </span>
                  </div>
                  <span style={{ flexShrink: 0, textAlign: 'right', fontSize: 12, color: color.muted }}>
                    Q{match.court}
                    <br />
                    {match.playedAt ? dayjs(match.playedAt).format('HH:mm') : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {!!disbandedTeams.length && (
        <Section title={`Times encerrados (${disbandedTeams.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden', opacity: 0.75 }}>
            {disbandedTeams.map((team) => (
              <div
                key={team.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 52, padding: '6px 14px', borderBottom: `1px solid ${color.lineSoft}` }}
              >
                <span style={{ flex: 1, minWidth: 0, fontSize: 15, overflowWrap: 'anywhere' }}>{teamLabel(team)}</span>
                {team.consecutiveWins > 0 && (
                  <span style={{ fontSize: 12, color: color.muted }}>{plural(team.consecutiveWins, 'vitória')}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
