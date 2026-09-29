import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { App, Empty, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  BorderInnerOutlined,
  EditOutlined,
  OrderedListOutlined,
  PlusOutlined,
  ReloadOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useSession,
  usePlayers,
  useTeams,
  useMatches,
  useSessionQueue,
  useUpdateSession,
  useCheckInPlayer,
  useCheckOutPlayer,
  useFillCourts,
  usePinQueuePlayer,
  useDiscardDraft,
  useCreateMatch,
  useReportMatchResult,
  schemas,
  type Team,
  type Player,
  type Match,
} from '../../api';
import { MatchFormSheet } from '../components/MatchFormSheet';
import { TeamFormSheet } from '../components/TeamFormSheet';
import { RosterSheet } from '../components/RosterSheet';
import { WinnerSheet } from '../components/WinnerSheet';
import { CheckInSheet } from '../components/CheckInSheet';
import { BottomNav } from '../components/BottomNav';
import { CourtsView } from './session/CourtsView';
import { QueueView, type QueueRow } from './session/QueueView';
import { AttendanceView } from './session/AttendanceView';
import { RankingView } from './session/RankingView';
import { gameModeLabel } from '../shared/labels';
import {
  CONTENT_MAX_WIDTH,
  NAV_HEIGHT,
  color,
  disabledButton,
  displayTitle,
  fixedBar,
  iconButton,
  plural,
  secondaryButton,
} from '../shared/theme';

const { draft: DRAFT, disbanded: DISBANDED, holding: HOLDING } = schemas.TeamStatus.enum;

type SessionTab = 'quadras' | 'fila' | 'presenca' | 'ranking';
const SESSION_TABS: SessionTab[] = ['quadras', 'fila', 'presenca', 'ranking'];

/** Altura da barra de ações fixa da aba Quadras (Preencher / Abrir quadra). */
const ACTION_BAR_HEIGHT = 73;

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  // A aba fica na URL: voltar do navegador e recarregar mantêm a tela.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('aba') as SessionTab | null;
  const activeTab: SessionTab = tabParam && SESSION_TABS.includes(tabParam) ? tabParam : 'quadras';
  const setActiveTab = (tab: SessionTab) => {
    setSearchParams(tab === 'quadras' ? {} : { aba: tab }, { replace: true });
    window.scrollTo({ top: 0 });
  };

  const { data: session, isLoading: isLoadingSession } = useSession(sessionId);
  const { data: players, isLoading: isLoadingPlayers } = usePlayers();
  const { data: teams, isLoading: isLoadingTeams } = useTeams(sessionId);
  const { data: matches, isLoading: isLoadingMatches } = useMatches(sessionId);
  const { data: queue, isLoading: isLoadingQueue } = useSessionQueue(sessionId);

  const updateSession = useUpdateSession();
  const checkInPlayer = useCheckInPlayer();
  const checkOutPlayer = useCheckOutPlayer();
  const fillCourts = useFillCourts();
  const pinPlayer = usePinQueuePlayer();
  const discardDraft = useDiscardDraft();
  const createMatch = useCreateMatch();
  const reportMatchResult = useReportMatchResult();

  const [rosterSheetOpen, setRosterSheetOpen] = useState(false);
  const [rosterSelection, setRosterSelection] = useState<string[]>([]);
  const [matchSheetOpen, setMatchSheetOpen] = useState(false);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);
  const [checkInSheetOpen, setCheckInSheetOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [winnerPick, setWinnerPick] = useState<{ match: Match; teamId: string } | null>(null);

  const playerNameById = useMemo(() => {
    const map = new Map<string, string>();
    players?.forEach((player) => map.set(player.id, player.name));
    return map;
  }, [players]);

  const playerById = useMemo(() => {
    const map = new Map<string, Player>();
    players?.forEach((player) => map.set(player.id, player));
    return map;
  }, [players]);

  const teamById = useMemo(() => {
    const map = new Map<string, Team>();
    teams?.forEach((team) => map.set(team.id, team));
    return map;
  }, [teams]);

  const teamLabel = (team: Team) =>
    team.playerIds.map((id) => playerNameById.get(id) ?? id).join(' / ');
  const teamLabelById = (id: string) => {
    const team = teamById.get(id);
    return team ? teamLabel(team) : id;
  };

  const activeTeams = useMemo(
    () => (teams ?? []).filter((team) => team.status !== DISBANDED),
    [teams],
  );

  const draftTeams = useMemo(
    () =>
      (teams ?? [])
        .filter((team) => team.status === DRAFT)
        .sort((a, b) => (a.court ?? 99) - (b.court ?? 99) || a.createdAt.localeCompare(b.createdAt)),
    [teams],
  );

  const disbandedTeams = useMemo(
    () =>
      (teams ?? [])
        .filter((team) => team.status === DISBANDED)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [teams],
  );

  const availablePlayersForTeam = useMemo(() => {
    if (!session) return [];
    const assigned = new Set(activeTeams.flatMap((team) => team.playerIds));
    return session.playerIds
      .filter((id) => !assigned.has(id))
      .map((id) => ({ id, label: playerNameById.get(id) ?? id }));
  }, [session, activeTeams, playerNameById]);

  const inProgressByCourt = useMemo(() => {
    const map = new Map<number, Match>();
    (matches ?? [])
      .filter((match) => match.winnerTeamId == null)
      .forEach((match) => map.set(match.court, match));
    return map;
  }, [matches]);

  const latestFinishedByCourt = useMemo(() => {
    const map = new Map<number, Match>();
    (matches ?? [])
      .filter((match) => match.winnerTeamId != null)
      .sort((a, b) => (a.playedAt ?? '').localeCompare(b.playedAt ?? ''))
      .forEach((match) => map.set(match.court, match));
    return map;
  }, [matches]);

  // Per configured court: the running match, or the holding team + pending
  // drafts waiting for the operator to start the next one.
  const courtStates = useMemo(() => {
    const courts = session?.availableCourts ?? 0;
    const draftsByCourt = new Map<number, Team[]>();
    draftTeams.forEach((team) => {
      if (team.court == null) return;
      draftsByCourt.set(team.court, [...(draftsByCourt.get(team.court) ?? []), team]);
    });

    return Array.from({ length: courts }, (_, i) => i + 1).map((court) => {
      const running = inProgressByCourt.get(court);
      if (running) return { court, running, holding: null, drafts: [] as Team[] };

      const lastWinnerId = latestFinishedByCourt.get(court)?.winnerTeamId ?? undefined;
      const holding =
        lastWinnerId && teamById.get(lastWinnerId)?.status === HOLDING
          ? teamById.get(lastWinnerId)!
          : null;
      return { court, running: undefined, holding, drafts: draftsByCourt.get(court) ?? [] };
    });
  }, [session, draftTeams, inProgressByCourt, latestFinishedByCourt, teamById]);

  const looseDrafts = useMemo(
    () => draftTeams.filter((team) => team.court == null),
    [draftTeams],
  );

  const matchHistory = useMemo(
    () =>
      (matches ?? [])
        .filter((match) => match.winnerTeamId != null)
        .sort((a, b) => (b.playedAt ?? '').localeCompare(a.playedAt ?? '')),
    [matches],
  );

  const orderedQueue = useMemo(() => {
    // Backend already returns it ordered; keep it stable if names help scanning.
    return (queue ?? []).map((entry) => ({
      ...entry,
      name: playerNameById.get(entry.playerId) ?? entry.playerId,
      gender: playerById.get(entry.playerId)?.gender,
    }));
  }, [queue, playerNameById, playerById]);

  const playerStandings = useMemo(() => {
    const record = new Map<string, { wins: number; losses: number }>();
    session?.playerIds.forEach((playerId) => record.set(playerId, { wins: 0, losses: 0 }));

    const teamPlayerIds = new Map<string, string[]>();
    teams?.forEach((team) => teamPlayerIds.set(team.id, team.playerIds));

    matches?.forEach((match) => {
      if (match.winnerTeamId == null) return;
      const loserTeamId = match.winnerTeamId === match.teamAId ? match.teamBId : match.teamAId;
      teamPlayerIds.get(match.winnerTeamId)?.forEach((playerId) => {
        const entry = record.get(playerId) ?? { wins: 0, losses: 0 };
        entry.wins += 1;
        record.set(playerId, entry);
      });
      teamPlayerIds.get(loserTeamId)?.forEach((playerId) => {
        const entry = record.get(playerId) ?? { wins: 0, losses: 0 };
        entry.losses += 1;
        record.set(playerId, entry);
      });
    });

    return Array.from(record, ([playerId, stats]) => ({
      playerId,
      ...stats,
      games: stats.wins + stats.losses,
    })).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return (playerNameById.get(a.playerId) ?? '').localeCompare(playerNameById.get(b.playerId) ?? '');
    });
  }, [session, teams, matches, playerNameById]);

  // Prévia dos próximos a entrar: os primeiros da fila, em grupos do tamanho
  // de um time. É uma projeção — quem monta os times de fato é o backend
  // (fill-courts / sugestão pós-resultado), que pode reordenar por gênero.
  const nextUp = useMemo(() => {
    const size = session?.settings.playersPerTeam ?? 0;
    if (!size) return [];
    const ids = orderedQueue.map((entry) => entry.playerId);
    const groups: string[][] = [];
    for (let i = 0; i + size <= ids.length && groups.length < 2; i += size) {
      groups.push(ids.slice(i, i + size));
    }
    return groups;
  }, [orderedQueue, session]);

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: 32 }}>
        <Empty description="Sessão não encontrada" />
      </div>
    );
  }

  const playerName = (id: string) => playerNameById.get(id) ?? id;
  const checkedInIds = new Set(session.playerIds);

  // O roster da sessão (quem foi convocado pro dia). O check-in liga/desliga
  // dentro dessa lista; quem não está no roster entra via RosterSheet.
  const rosterPlayers = session.rosterPlayerIds
    .map((id) => playerById.get(id))
    .filter((player): player is Player => player != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const rosteredNotCheckedIn = rosterPlayers.filter((player) => !checkedInIds.has(player.id));

  const idleCourtCount = courtStates.filter((c) => !c.running).length;
  const canOpenCourt = availablePlayersForTeam.length >= session.settings.playersPerTeam * 2;

  const runMutation = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      message.success(ok);
      return true;
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
      return false;
    }
  };

  const openRosterSheet = () => {
    setRosterSelection(session.rosterPlayerIds);
    setRosterSheetOpen(true);
  };

  const handleSaveRoster = async () => {
    if (!sessionId) return;
    const ok = await runMutation(
      () => updateSession.mutateAsync({ sessionId, data: { rosterPlayerIds: rosterSelection } }),
      'Roster da sessão atualizado!',
    );
    if (ok) setRosterSheetOpen(false);
  };

  const handleFill = () =>
    runMutation(() => fillCourts.mutateAsync(session.id), 'Quadras livres revisadas.');

  const handleReportResult = async (matchId: string, winnerTeamId: string) => {
    const ok = await runMutation(
      () => reportMatchResult.mutateAsync({ matchId, winnerTeamId }),
      'Resultado registrado — confira as sugestões por quadra.',
    );
    if (ok) setWinnerPick(null);
  };

  const confirmDiscard = (team: Team) =>
    modal.confirm({
      title: 'Descartar rascunho?',
      content: `${teamLabel(team)} volta pra fila.`,
      okText: 'Descartar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      centered: true,
      onOk: () =>
        runMutation(
          () => discardDraft.mutateAsync({ teamId: team.id, sessionId: session.id }),
          'Rascunho descartado; jogadores voltaram pra fila.',
        ),
    });

  const handlePin = (playerId: string, pinned: boolean) =>
    runMutation(
      () => pinPlayer.mutateAsync({ sessionId: session.id, playerId, pinned }),
      pinned ? 'Jogador fixado no topo da fila.' : 'Jogador desafixado.',
    );

  // Check-in / check-out de um jogador do roster: alguém desiste no meio da
  // sessão ou um atrasado chega. Os endpoints individuais sincronizam a fila
  // — check-out sai da lista; check-in entra com gamesPlayed derivado das
  // partidas, então um re-check-in mantém a ordem justa em vez de furar a fila.
  // Só quem já está no roster pode fazer check-in (backend devolve 409).
  const handleLeaveSession = (playerId: string) =>
    runMutation(
      () => checkOutPlayer.mutateAsync({ sessionId: session.id, playerId }),
      'Check-out feito; jogador saiu da fila.',
    );

  const handleJoinSession = (playerId: string) =>
    runMutation(
      () => checkInPlayer.mutateAsync({ sessionId: session.id, playerId }),
      'Check-in feito; jogador entrou na fila.',
    );

  const confirmCheckOut = (row: QueueRow) =>
    modal.confirm({
      title: `Check-out de ${row.name}?`,
      content: 'Sai da fila, mas continua no roster da sessão.',
      okText: 'Check-out',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      centered: true,
      onOk: () => handleLeaveSession(row.playerId),
    });

  const startCourt = (court: number, teamAId: string, teamBId: string) =>
    runMutation(
      () => createMatch.mutateAsync({ sessionId: session.id, court, teamAId, teamBId }),
      `Partida iniciada na quadra ${court}!`,
    );

  const pendingPlayerId = <T extends { playerId: string }>(mutation: { isPending: boolean; variables?: T }) =>
    mutation.isPending ? (mutation.variables?.playerId ?? null) : null;
  const pendingAttendanceId = pendingPlayerId(checkInPlayer) ?? pendingPlayerId(checkOutPlayer);

  const { playersPerTeam: teamSize, setsToWin, pointsPerSet } = session.settings;
  const headerAction =
    activeTab === 'fila' ? (
      <button
        onClick={() => setCheckInSheetOpen(true)}
        style={{
          ...iconButton,
          width: 'auto',
          gap: 6,
          padding: '0 14px',
          background: color.ink,
          color: '#FFFFFF',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <UserAddOutlined /> Check-in
      </button>
    ) : activeTab === 'presenca' ? (
      <button
        onClick={openRosterSheet}
        disabled={isLoadingPlayers}
        style={{
          ...iconButton,
          width: 'auto',
          gap: 6,
          padding: '0 14px',
          border: `1.5px solid ${color.lineStrong}`,
          background: color.surface,
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <EditOutlined /> Roster
      </button>
    ) : activeTab === 'quadras' ? (
      <button
        aria-label="Nova dupla manual"
        onClick={() => setTeamSheetOpen(true)}
        disabled={!availablePlayersForTeam.length}
        style={{ ...iconButton, ...(!availablePlayersForTeam.length ? disabledButton : {}) }}
      >
        <PlusOutlined />
      </button>
    ) : null;

  const bottomPadding = NAV_HEIGHT + (activeTab === 'quadras' ? ACTION_BAR_HEIGHT : 0) + 24;

  return (
    <div style={{ maxWidth: CONTENT_MAX_WIDTH, margin: '0 auto' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '12px 8px 8px',
          background: color.ground,
        }}
      >
        <button aria-label="Voltar para sessões" onClick={() => navigate('/')} style={iconButton}>
          <ArrowLeftOutlined />
        </button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ ...displayTitle, fontSize: 24, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.description || dayjs(session.date).format('DD/MM/YYYY')}
          </h1>
          <span style={{ fontSize: 13, color: color.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dayjs(session.date).format('DD/MM')} · {gameModeLabel[session.gameMode]} · {teamSize} por time ·{' '}
            {plural(setsToWin, 'set')} de {pointsPerSet}
          </span>
        </div>
        {headerAction}
      </header>

      <main style={{ padding: `4px 16px calc(${bottomPadding}px + env(safe-area-inset-bottom))` }}>
        {activeTab === 'quadras' && (
          <CourtsView
            courtStates={courtStates}
            looseDrafts={looseDrafts}
            activeTeams={activeTeams}
            disbandedTeams={disbandedTeams}
            matchHistory={matchHistory}
            nextUp={nextUp}
            playersPerTeam={teamSize}
            isLoading={isLoadingMatches || isLoadingTeams}
            isStarting={createMatch.isPending}
            teamLabel={teamLabel}
            teamLabelById={teamLabelById}
            playerName={playerName}
            onPickWinner={(match, teamId) => setWinnerPick({ match, teamId })}
            onEditDraft={setEditingTeam}
            onDiscardDraft={confirmDiscard}
            onStart={startCourt}
            onOpenQueue={() => setActiveTab('fila')}
          />
        )}

        {activeTab === 'fila' && (
          <QueueView
            queue={orderedQueue}
            isLoading={isLoadingQueue}
            pendingPinPlayerId={pendingPlayerId(pinPlayer)}
            pendingCheckOutPlayerId={pendingPlayerId(checkOutPlayer)}
            onTogglePin={handlePin}
            onCheckOut={confirmCheckOut}
          />
        )}

        {activeTab === 'presenca' && (
          <AttendanceView
            rosterPlayers={rosterPlayers}
            checkedInIds={checkedInIds}
            isLoading={isLoadingPlayers}
            pendingPlayerId={pendingAttendanceId}
            onToggle={(playerId, checkIn) => (checkIn ? handleJoinSession(playerId) : handleLeaveSession(playerId))}
          />
        )}

        {activeTab === 'ranking' && <RankingView standings={playerStandings} playerName={playerName} />}
      </main>

      {activeTab === 'quadras' && (
        <div
          style={{
            ...fixedBar,
            bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            padding: '12px 16px',
            background: color.ground,
            borderTop: `1px solid ${color.line}`,
          }}
        >
          <button
            onClick={handleFill}
            disabled={!idleCourtCount || fillCourts.isPending}
            style={{ ...secondaryButton, ...(!idleCourtCount || fillCourts.isPending ? disabledButton : {}) }}
          >
            {fillCourts.isPending ? <Spin size="small" /> : <ReloadOutlined />}
            Preencher
          </button>
          <button
            onClick={() => setMatchSheetOpen(true)}
            disabled={!canOpenCourt}
            style={{ ...secondaryButton, ...(!canOpenCourt ? disabledButton : {}) }}
          >
            <PlusOutlined /> Abrir quadra
          </button>
        </div>
      )}

      <BottomNav
        ariaLabel="Sessão"
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key as SessionTab)}
        items={[
          { key: 'quadras', label: 'Quadras', icon: <BorderInnerOutlined /> },
          { key: 'fila', label: 'Fila', icon: <OrderedListOutlined />, badge: orderedQueue.length },
          { key: 'presenca', label: 'Presença', icon: <UserAddOutlined /> },
          { key: 'ranking', label: 'Ranking', icon: <TrophyOutlined /> },
        ]}
      />

      <WinnerSheet
        match={winnerPick?.match ?? null}
        initialWinnerId={winnerPick?.teamId ?? null}
        teamLabelById={teamLabelById}
        loading={reportMatchResult.isPending}
        onClose={() => setWinnerPick(null)}
        onConfirm={handleReportResult}
      />

      <CheckInSheet
        open={checkInSheetOpen}
        players={rosteredNotCheckedIn}
        pendingPlayerId={pendingPlayerId(checkInPlayer)}
        onCheckIn={handleJoinSession}
        onClose={() => setCheckInSheetOpen(false)}
      />

      {sessionId && (
        <MatchFormSheet
          open={matchSheetOpen}
          sessionId={sessionId}
          playersPerTeam={teamSize}
          availablePlayers={availablePlayersForTeam}
          defaultCourt={courtStates.find((c) => !c.running)?.court ?? 1}
          onClose={() => setMatchSheetOpen(false)}
          onError={(error) => message.error(error)}
        />
      )}

      {sessionId && (
        <TeamFormSheet
          open={teamSheetOpen}
          sessionId={sessionId}
          playersPerTeam={teamSize}
          availablePlayers={availablePlayersForTeam}
          playerNameById={playerNameById}
          onClose={() => setTeamSheetOpen(false)}
          onError={(error) => message.error(error)}
        />
      )}

      {sessionId && editingTeam && (
        <TeamFormSheet
          open={!!editingTeam}
          sessionId={sessionId}
          playersPerTeam={teamSize}
          availablePlayers={[
            ...availablePlayersForTeam,
            ...editingTeam.playerIds.map((id) => ({ id, label: playerName(id) })),
          ]}
          playerNameById={playerNameById}
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onError={(error) => message.error(error)}
        />
      )}

      <RosterSheet
        open={rosterSheetOpen}
        players={players}
        loading={isLoadingPlayers}
        saving={updateSession.isPending}
        selectedIds={rosterSelection}
        onChange={setRosterSelection}
        onClose={() => setRosterSheetOpen(false)}
        onSubmit={handleSaveRoster}
      />
    </div>
  );
}
