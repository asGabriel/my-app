import { useState } from 'react';
import { App, Spin, Empty } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { useMatches, useSessionQueue, useSessions, type Session } from '../../api';
import { SessionFormSheet } from '../components/SessionFormSheet';
import { Fab } from '../components/Fab';
import { PageHeader } from '../components/PageHeader';
import { gameModeLabel, gameModeTagColors } from '../shared/labels';
import { color, displayTitle, font, plural, sectionLabel } from '../shared/theme';

function sortByDateDesc(sessions: Session[]) {
  return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
}

function sessionTitle(session: Session) {
  return session.description || dayjs(session.date).format('DD/MM/YYYY');
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 12,
        background: color.inkSoft,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, color: color.onInkMuted }}>{label}</span>
    </div>
  );
}

/** Destaque da sessão do dia: resumo ao vivo e atalho pro painel. */
function TodayCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const { data: matches } = useMatches(session.id);
  const { data: queue } = useSessionQueue(session.id);
  const courtsInPlay = (matches ?? []).filter((match) => match.winnerTeamId == null).length;
  const { setsToWin, pointsPerSet, playersPerTeam } = session.settings;

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 18,
        border: 'none',
        borderRadius: 20,
        background: color.ink,
        color: '#FFFFFF',
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 999,
            background: '#14532D',
            color: '#BBF7D0',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80' }} />
          Hoje
        </span>
        <span style={{ fontSize: 13, color: color.onInkMuted }}>
          {gameModeLabel[session.gameMode]} · {playersPerTeam} por time
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...displayTitle, fontSize: 30, overflowWrap: 'anywhere' }}>{sessionTitle(session)}</span>
        <span style={{ fontSize: 14, color: color.onInkMuted }}>
          {dayjs(session.date).format('DD/MM')} · {plural(setsToWin, 'set')} de {pointsPerSet} pts
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        <Stat value={`${courtsInPlay}/${session.availableCourts}`} label="quadras em jogo" />
        <Stat value={session.playerIds.length} label="presentes" />
        <Stat value={queue?.length ?? '–'} label="na fila" />
      </div>

      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 48,
          borderRadius: 14,
          background: color.accent,
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Abrir painel da sessão <RightOutlined />
      </span>
    </button>
  );
}

function SessionRow({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const date = dayjs(session.date);
  const tag = gameModeTagColors[session.gameMode];

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 72,
        padding: '10px 14px',
        border: 'none',
        borderBottom: `1px solid ${color.lineSoft}`,
        background: color.surface,
        color: color.ink,
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: 12,
          background: color.ground,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: font.display, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
          {date.format('DD')}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: color.muted, textTransform: 'uppercase' }}>
          {date.format('MMM')}
        </span>
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 16, fontWeight: 600, overflowWrap: 'anywhere' }}>{sessionTitle(session)}</span>
        <span style={{ fontSize: 13, color: color.muted }}>
          {plural(session.availableCourts, 'quadra')} · {plural(session.playerIds.length, 'jogador', 'jogadores')}
        </span>
      </span>
      <span
        style={{
          flexShrink: 0,
          padding: '3px 8px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: tag.bg,
          color: tag.fg,
        }}
      >
        {gameModeLabel[session.gameMode]}
      </span>
      <RightOutlined style={{ color: color.subtle, flexShrink: 0 }} />
    </button>
  );
}

export function Sessions() {
  const { data: sessions, isLoading } = useSessions();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const sorted = sessions ? sortByDateDesc(sessions) : [];
  const today = dayjs();
  const todaySessions = sorted.filter((session) => dayjs(session.date).isSame(today, 'day'));
  const otherSessions = sorted.filter((session) => !dayjs(session.date).isSame(today, 'day'));
  const open = (session: Session) => navigate(`/sessoes/${session.id}`);

  return (
    <div>
      <PageHeader title="Sessões" />

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      )}

      {!isLoading && !sorted.length && <Empty description="Nenhuma sessão criada ainda" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {todaySessions.map((session) => (
          <TodayCard key={session.id} session={session} onOpen={() => open(session)} />
        ))}

        {!!otherSessions.length && (
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={sectionLabel}>{todaySessions.length ? 'Outras sessões' : 'Sessões'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', background: color.surface, borderRadius: 16, overflow: 'hidden' }}>
              {otherSessions.map((session) => (
                <SessionRow key={session.id} session={session} onOpen={() => open(session)} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Fab onClick={() => setSheetOpen(true)} label="Nova sessão" />

      <SessionFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onError={(error) => message.error(error)}
      />
    </div>
  );
}
