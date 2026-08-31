import { useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Typography, Tag, Tabs, Button, App, Empty, Spin, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ApartmentOutlined,
  PushpinOutlined,
  PushpinFilled,
  ReloadOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useSession,
  usePlayers,
  useTeams,
  useMatches,
  useSessionQueue,
  useUpdateSession,
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
import { gameModeLabel, genderLabel, teamStatusLabel, teamStatusColor } from '../shared/labels';

const { draft: DRAFT, disbanded: DISBANDED, holding: HOLDING } = schemas.TeamStatus.enum;

const { Title, Text } = Typography;

function Section({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text strong>{title}</Text>
        {extra}
      </div>
      {children}
    </section>
  );
}

const card: React.CSSProperties = { background: '#fafafa', borderRadius: 10, padding: 12 };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
// A player/team name in a flex row: takes the leftover space, is allowed to
// shrink to nothing and wrap so it never pushes the trailing buttons/tags
// off a narrow phone screen.
const nameText: React.CSSProperties = { flex: 1, minWidth: 0, overflowWrap: 'anywhere' };
// Trailing action cluster (tags + icon buttons): never shrinks.
const actions: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 };

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const { data: session, isLoading: isLoadingSession } = useSession(sessionId);
  const { data: players, isLoading: isLoadingPlayers } = usePlayers();
  const { data: teams, isLoading: isLoadingTeams } = useTeams(sessionId);
  const { data: matches, isLoading: isLoadingMatches } = useMatches(sessionId);
  const { data: queue, isLoading: isLoadingQueue } = useSessionQueue(sessionId);

  const updateSession = useUpdateSession();
  const fillCourts = useFillCourts();
  const pinPlayer = usePinQueuePlayer();
  const discardDraft = useDiscardDraft();
  const createMatch = useCreateMatch();
  const reportMatchResult = useReportMatchResult();

  const [activeTab, setActiveTab] = useState('overview');
  const [rosterSheetOpen, setRosterSheetOpen] = useState(false);
  const [rosterSelection, setRosterSelection] = useState<string[]>([]);
  const [matchSheetOpen, setMatchSheetOpen] = useState(false);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

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

  const playersPerTeam = session?.settings.playersPerTeam ?? Infinity;

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

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <Empty description="Sessão não encontrada" />;
  }

  const confirmedPlayers = session.playerIds
    .map((id) => playerById.get(id))
    .filter((player): player is NonNullable<typeof player> => player != null)
    .sort((a, b) => a.name.localeCompare(b.name));

  const hasMatches = !!matches?.length;
  const idleCourtCount = courtStates.filter((c) => !c.running).length;

  const openRosterSheet = () => {
    setRosterSelection(session.playerIds);
    setRosterSheetOpen(true);
  };

  const handleSaveRoster = async () => {
    if (!sessionId) return;
    try {
      await updateSession.mutateAsync({ sessionId, data: { playerIds: rosterSelection } });
      message.success('Jogadores da sessão atualizados!');
      setRosterSheetOpen(false);
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  const runMutation = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      message.success(ok);
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  const handleFill = () =>
    runMutation(() => fillCourts.mutateAsync(session.id), 'Quadras ociosas revisadas.');

  const handleReportResult = (matchId: string, winnerTeamId: string) =>
    runMutation(
      () => reportMatchResult.mutateAsync({ matchId, winnerTeamId }),
      'Resultado registrado — confira as sugestões por quadra.',
    );

  const handleDiscard = (teamId: string) =>
    runMutation(
      () => discardDraft.mutateAsync({ teamId, sessionId: session.id }),
      'Rascunho descartado; jogadores voltaram pra fila.',
    );

  const handlePin = (playerId: string, pinned: boolean) =>
    runMutation(
      () => pinPlayer.mutateAsync({ sessionId: session.id, playerId, pinned }),
      pinned ? 'Jogador fixado no topo da fila.' : 'Jogador desafixado.',
    );

  const startCourt = (court: number, teamAId: string, teamBId: string) =>
    runMutation(
      () => createMatch.mutateAsync({ sessionId: session.id, court, teamAId, teamBId }),
      `Partida iniciada na quadra ${court}!`,
    );

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          border: 'none',
          background: 'none',
          color: '#fa8c16',
          fontWeight: 600,
          padding: 0,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        <ArrowLeftOutlined /> Sessões
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {session.description || dayjs(session.date).format('DD/MM/YYYY')}
          </Title>
          {session.description && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {dayjs(session.date).format('DD/MM/YYYY')}
            </Text>
          )}
        </div>
        <Tag color="purple">{gameModeLabel[session.gameMode]}</Tag>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Tag>{session.availableCourts} quadras</Tag>
        <Tag>{session.settings.playersPerTeam} por time</Tag>
        <Tag>{session.settings.setsToWin} sets p/ vencer</Tag>
        <Tag>{session.settings.pointsPerSet} pts/set</Tag>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        tabBarGutter={12}
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <AppstoreOutlined /> Quadras
              </span>
            ),
            children: (
              <>
                <Section
                  title="Quadras"
                  extra={
                    idleCourtCount > 0 && (
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        loading={fillCourts.isPending}
                        onClick={handleFill}
                      >
                        Preencher
                      </Button>
                    )
                  }
                >
                  {(isLoadingMatches || isLoadingTeams) && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                      <Spin />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {courtStates.map(({ court, running, holding, drafts }) => {
                      if (running) {
                        return (
                          <div key={court} style={card}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                              }}
                            >
                              <Text strong style={{ fontSize: 13 }}>
                                Quadra {court}
                              </Text>
                              <Tag color="processing" style={{ marginRight: 0 }}>
                                Em andamento
                              </Tag>
                            </div>
                            {[running.teamAId, running.teamBId].map((teamId, idx) => (
                              <div key={teamId}>
                                {idx === 1 && (
                                  <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 12, margin: '6px 0' }}>
                                    vs
                                  </div>
                                )}
                                <div style={row}>
                                  <Text strong style={nameText}>
                                    {teamLabelById(teamId)}
                                  </Text>
                                  <Popconfirm
                                    title="Confirmar vencedor"
                                    description={`${teamLabelById(teamId)} venceu?`}
                                    okText="Confirmar"
                                    cancelText="Cancelar"
                                    onConfirm={() => handleReportResult(running.id, teamId)}
                                  >
                                    <Button size="small" style={{ flexShrink: 0 }} loading={reportMatchResult.isPending}>
                                      Venceu
                                    </Button>
                                  </Popconfirm>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      const teamAId = holding?.id ?? drafts[0]?.id;
                      const teamBId = holding ? drafts[0]?.id : drafts[1]?.id;
                      const canStart = !!teamAId && !!teamBId;

                      return (
                        <div key={court} style={card}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8,
                            }}
                          >
                            <Text strong style={{ fontSize: 13 }}>
                              Quadra {court}
                            </Text>
                            <Tag style={{ marginRight: 0 }}>Ociosa</Tag>
                          </div>

                          {holding && (
                            <div style={{ ...row, marginBottom: 6 }}>
                              <Tag color="gold" style={{ marginRight: 0, flexShrink: 0 }}>
                                Segurando
                              </Tag>
                              <Text style={nameText}>{teamLabel(holding)}</Text>
                            </div>
                          )}

                          {!drafts.length && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Sem desafiante sugerido. Use “Preencher” ou “Abrir quadra”.
                            </Text>
                          )}

                          {drafts.map((d) => (
                            <div
                              key={d.id}
                              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}
                            >
                              <Tag color="blue" style={{ marginRight: 0, flexShrink: 0 }}>
                                Rascunho
                              </Tag>
                              <Text style={{ ...nameText, minWidth: 120 }}>{teamLabel(d)}</Text>
                              <div style={actions}>
                                <Button size="small" icon={<EditOutlined />} onClick={() => setEditingTeam(d)} />
                                <Popconfirm
                                  title="Descartar rascunho?"
                                  okText="Descartar"
                                  cancelText="Cancelar"
                                  onConfirm={() => handleDiscard(d.id)}
                                >
                                  <Button size="small" danger icon={<DeleteOutlined />} loading={discardDraft.isPending} />
                                </Popconfirm>
                              </div>
                            </div>
                          ))}

                          <Button
                            block
                            size="small"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            disabled={!canStart}
                            loading={createMatch.isPending}
                            onClick={() => canStart && startCourt(court, teamAId!, teamBId!)}
                            style={{ marginTop: 4 }}
                          >
                            Iniciar partida
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    block
                    type={hasMatches ? 'default' : 'primary'}
                    icon={<PlayCircleOutlined />}
                    onClick={() => setMatchSheetOpen(true)}
                    disabled={availablePlayersForTeam.length < session.settings.playersPerTeam * 2}
                    style={{ marginTop: 12 }}
                  >
                    Abrir quadra
                  </Button>
                </Section>

                {!!looseDrafts.length && (
                  <Section title="Rascunhos sem quadra">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {looseDrafts.map((d) => (
                        <div
                          key={d.id}
                          style={{ ...card, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
                        >
                          <Text style={{ ...nameText, minWidth: 120 }}>{teamLabel(d)}</Text>
                          <div style={actions}>
                            <Button size="small" icon={<EditOutlined />} onClick={() => setEditingTeam(d)} />
                            <Popconfirm
                              title="Descartar rascunho?"
                              okText="Descartar"
                              cancelText="Cancelar"
                              onConfirm={() => handleDiscard(d.id)}
                            >
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                      Use “Abrir quadra manualmente” pra colocar em jogo.
                    </Text>
                  </Section>
                )}

                <Section title="Histórico de partidas">
                  {isLoadingMatches && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                      <Spin />
                    </div>
                  )}
                  {!isLoadingMatches && !matchHistory.length && (
                    <Text type="secondary">Nenhuma partida finalizada ainda.</Text>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {matchHistory.map((match) => {
                      const teamAWon = match.winnerTeamId === match.teamAId;
                      return (
                        <div key={match.id} style={card}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 10,
                            }}
                          >
                            <Text strong style={{ fontSize: 13 }}>
                              Quadra {match.court}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {match.playedAt ? dayjs(match.playedAt).format('HH:mm') : ''}
                            </Text>
                          </div>
                          {[
                            { id: match.teamAId, won: teamAWon },
                            { id: match.teamBId, won: !teamAWon },
                          ].map(({ id, won }, idx) => (
                            <div key={id}>
                              {idx === 1 && (
                                <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 12, margin: '4px 0' }}>
                                  vs
                                </div>
                              )}
                              <div style={{ ...row, gap: 6 }}>
                                <span
                                  style={{ width: 16, flexShrink: 0, display: 'flex', justifyContent: 'center', color: '#389e0d' }}
                                >
                                  {won && <TrophyOutlined />}
                                </span>
                                <Text strong={won} style={{ ...nameText, color: won ? '#389e0d' : '#8c8c8c' }}>
                                  {teamLabelById(id)}
                                </Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </>
            ),
          },
          {
            key: 'fila',
            label: (
              <span>
                <OrderedListOutlined /> Fila ({orderedQueue.length})
              </span>
            ),
            children: (
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                  Ordem de quem entra primeiro: fixados, depois quem jogou menos, depois quem espera há mais tempo.
                </Text>

                {isLoadingQueue && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    <Spin />
                  </div>
                )}
                {!isLoadingQueue && !orderedQueue.length && <Empty description="Fila vazia." />}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {orderedQueue.map((entry, index) => (
                    <div key={entry.id} style={{ ...card, ...row }}>
                      <Text strong style={{ width: 24, flexShrink: 0 }}>
                        {index + 1}º
                      </Text>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ display: 'block', overflowWrap: 'anywhere' }}>{entry.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {entry.gamesPlayed} jogo{entry.gamesPlayed === 1 ? '' : 's'}
                        </Text>
                      </div>
                      <Button
                        size="small"
                        type={entry.pinned ? 'primary' : 'default'}
                        icon={entry.pinned ? <PushpinFilled /> : <PushpinOutlined />}
                        loading={pinPlayer.isPending}
                        onClick={() => handlePin(entry.playerId, !entry.pinned)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            key: 'ranking',
            label: (
              <span>
                <TrophyOutlined /> Ranking
              </span>
            ),
            children: (
              <div>
                {!playerStandings.length && <Empty description="Nenhum jogador confirmado ainda." />}
                {!!playerStandings.length && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {playerStandings.map((standing, index) => (
                      <div key={standing.playerId} style={{ ...card, ...row }}>
                        <Text strong style={{ width: 28 }}>
                          {index + 1}º
                        </Text>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ display: 'block' }}>
                            {playerNameById.get(standing.playerId) ?? standing.playerId}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {standing.games} jogo{standing.games !== 1 ? 's' : ''}
                          </Text>
                        </div>
                        <Tag color="green" style={{ marginRight: 0 }}>
                          {standing.wins}V
                        </Tag>
                        <Tag color="red" style={{ marginRight: 0 }}>
                          {standing.losses}D
                        </Tag>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'players',
            label: (
              <span>
                <TeamOutlined /> Jogadores ({confirmedPlayers.length})
              </span>
            ),
            children: (
              <div>
                <Button
                  block
                  icon={<EditOutlined />}
                  loading={isLoadingPlayers}
                  onClick={openRosterSheet}
                  style={{ marginBottom: 16 }}
                >
                  Editar jogadores confirmados
                </Button>
                {!confirmedPlayers.length && <Empty description="Nenhum jogador confirmado ainda." />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {confirmedPlayers.map((player) => (
                    <div
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: '#fff',
                        borderRadius: 12,
                        padding: '14px 16px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: player.gender === 'male' ? '#e6f4ff' : '#fff0f6',
                          color: player.gender === 'male' ? '#1677ff' : '#eb2f96',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        <UserOutlined />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ display: 'block' }}>
                          {player.name}
                        </Text>
                      </div>
                      <Tag color={player.gender === 'male' ? 'blue' : 'magenta'} style={{ marginRight: 0 }}>
                        {genderLabel[player.gender]}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            key: 'times',
            label: (
              <span>
                <ApartmentOutlined /> Times ({activeTeams.length})
              </span>
            ),
            children: (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <Button
                    block
                    icon={<PlusOutlined />}
                    onClick={() => setTeamSheetOpen(true)}
                    disabled={!availablePlayersForTeam.length}
                  >
                    Nova dupla (manual)
                  </Button>
                </div>

                {isLoadingTeams && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    <Spin />
                  </div>
                )}
                {!isLoadingTeams && !activeTeams.length && (
                  <Empty description="Nenhum time ativo. Abra uma quadra (aba Quadras) ou reporte um resultado." />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeTeams.map((team) => (
                    <div key={team.id} style={{ ...card }}>
                      <div style={{ ...row, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Text style={{ ...nameText, minWidth: 120 }}>{teamLabel(team)}</Text>
                        <div style={actions}>
                          {team.court != null && <Tag style={{ marginRight: 0 }}>Q{team.court}</Tag>}
                          <Tag color={teamStatusColor[team.status]} style={{ marginRight: 0 }}>
                            {teamStatusLabel[team.status]}
                          </Tag>
                          {team.status === DRAFT && (
                            <Button size="small" icon={<EditOutlined />} onClick={() => setEditingTeam(team)} />
                          )}
                        </div>
                      </div>
                      {(team.playerIds.length !== playersPerTeam || team.consecutiveWins > 0) && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {team.playerIds.length !== playersPerTeam && 'Roster incompleto'}
                          {team.playerIds.length !== playersPerTeam && team.consecutiveWins > 0 && ' · '}
                          {team.consecutiveWins > 0 &&
                            `${team.consecutiveWins} vitória${team.consecutiveWins > 1 ? 's' : ''} seguida${team.consecutiveWins > 1 ? 's' : ''}`}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            key: 'disbanded-teams',
            label: (
              <span>
                <HistoryOutlined /> Encerrados ({disbandedTeams.length})
              </span>
            ),
            children: (
              <div>
                {!disbandedTeams.length && <Empty description="Nenhum time encerrado ainda." />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {disbandedTeams.map((team) => (
                    <div key={team.id} style={{ ...card }}>
                      <div style={{ ...row, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Text style={{ ...nameText, minWidth: 120 }}>{teamLabel(team)}</Text>
                        <Tag color={teamStatusColor[team.status]} style={{ marginRight: 0, flexShrink: 0 }}>
                          {teamStatusLabel[team.status]}
                        </Tag>
                      </div>
                      {team.consecutiveWins > 0 && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {team.consecutiveWins} vitória{team.consecutiveWins > 1 ? 's' : ''} seguida
                          {team.consecutiveWins > 1 ? 's' : ''}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
        ]}
      />

      {sessionId && (
        <MatchFormSheet
          open={matchSheetOpen}
          sessionId={sessionId}
          playersPerTeam={session.settings.playersPerTeam}
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
          playersPerTeam={session.settings.playersPerTeam}
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
          playersPerTeam={session.settings.playersPerTeam}
          availablePlayers={[
            ...availablePlayersForTeam,
            ...editingTeam.playerIds.map((id) => ({ id, label: playerNameById.get(id) ?? id })),
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
