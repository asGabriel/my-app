import { useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Typography, Tag, Tabs, Button, App, Empty, Spin, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  EditOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useSession,
  usePlayers,
  useTeams,
  useMatches,
  useUpdateSession,
  useDrawTeams,
  useReportMatchResult,
  schemas,
  type Team,
  type Player,
} from '../../api';
import { MatchFormSheet } from '../components/MatchFormSheet';
import { TeamFormSheet } from '../components/TeamFormSheet';
import { RosterSheet } from '../components/RosterSheet';
import { gameModeLabel, genderLabel, teamStatusLabel, teamStatusColor } from '../shared/labels';

const { waiting: WAITING, disbanded: DISBANDED } = schemas.TeamStatus.enum;

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

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const { data: session, isLoading: isLoadingSession } = useSession(sessionId);
  const { data: players, isLoading: isLoadingPlayers } = usePlayers();
  const { data: teams, isLoading: isLoadingTeams } = useTeams(sessionId);
  const { data: matches, isLoading: isLoadingMatches } = useMatches(sessionId);

  const updateSession = useUpdateSession();
  const drawTeams = useDrawTeams();
  const reportMatchResult = useReportMatchResult();

  const [rosterSheetOpen, setRosterSheetOpen] = useState(false);
  const [rosterSelection, setRosterSelection] = useState<string[]>([]);
  const [matchSheetOpen, setMatchSheetOpen] = useState(false);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);

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

  const teamLabel = (team: Team) =>
    team.playerIds.map((id) => playerNameById.get(id) ?? id).join(' / ');

  const playersPerTeam = session?.settings.playersPerTeam ?? Infinity;
  const isTeamComplete = (team: Team) => team.playerIds.length >= playersPerTeam;

  const busyTeamIds = useMemo(() => {
    const ids = new Set<string>();
    matches?.forEach((match) => {
      if (match.winnerTeamId == null) {
        ids.add(match.teamAId);
        ids.add(match.teamBId);
      }
    });
    return ids;
  }, [matches]);

  const startableTeams = useMemo(
    () =>
      (teams ?? []).filter(
        (team) =>
          team.status !== DISBANDED &&
          team.playerIds.length >= playersPerTeam &&
          !busyTeamIds.has(team.id),
      ),
    [teams, busyTeamIds, playersPerTeam],
  );

  const nextInQueue = useMemo(
    () =>
      (teams ?? [])
        .filter((team) => team.status === WAITING && team.playerIds.length >= playersPerTeam)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [teams, playersPerTeam],
  );

  const incompleteWaiting = useMemo(
    () => (teams ?? []).filter((team) => team.status === WAITING && team.playerIds.length < playersPerTeam),
    [teams, playersPerTeam],
  );

  const activeTeams = useMemo(() => (teams ?? []).filter((team) => team.status !== DISBANDED), [teams]);

  const disbandedTeams = useMemo(
    () =>
      (teams ?? [])
        .filter((team) => team.status === DISBANDED)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [teams],
  );

  const availablePlayersForTeam = useMemo(() => {
    if (!session) return [];
    const assigned = new Set(
      (teams ?? []).filter((team) => team.status !== DISBANDED).flatMap((team) => team.playerIds),
    );
    return session.playerIds
      .filter((id) => !assigned.has(id))
      .map((id) => ({ id, label: playerNameById.get(id) ?? id }));
  }, [session, teams, playerNameById]);

  const inProgressMatches = useMemo(
    () =>
      (matches ?? [])
        .filter((match) => match.winnerTeamId == null)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [matches],
  );

  const matchHistory = useMemo(
    () =>
      (matches ?? [])
        .filter((match) => match.winnerTeamId != null)
        .sort((a, b) => (b.playedAt ?? '').localeCompare(a.playedAt ?? '')),
    [matches],
  );

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

  const handleDrawTeams = async () => {
    if (!sessionId) return;

    try {
      await drawTeams.mutateAsync(sessionId);
      message.success('Times sorteados com sucesso!');
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  const handleReportResult = async (matchId: string, winnerTeamId: string) => {
    try {
      await reportMatchResult.mutateAsync({ matchId, winnerTeamId });
      message.success('Resultado registrado!');
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

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
        <Title level={4} style={{ margin: 0 }}>
          {dayjs(session.date).format('DD/MM/YYYY')}
        </Title>
        <Tag color="purple">{gameModeLabel[session.gameMode]}</Tag>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Tag>{session.availableCourts} quadras</Tag>
        <Tag>{session.settings.playersPerTeam} por time</Tag>
        <Tag>{session.settings.setsToWin} sets p/ vencer</Tag>
        <Tag>{session.settings.pointsPerSet} pts/set</Tag>
      </div>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <AppstoreOutlined /> Visão geral
              </span>
            ),
            children: (
              <>
                <Section
                  title="Times"
                  extra={
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => setTeamSheetOpen(true)}
                      disabled={!availablePlayersForTeam.length}
                    >
                      Nova Dupla
                    </Button>
                  }
                >
                  {isLoadingTeams && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                      <Spin />
                    </div>
                  )}

                  {!isLoadingTeams && !activeTeams.length && (
                    <Text type="secondary">Nenhum time ativo no momento.</Text>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      marginBottom: activeTeams.length ? 12 : 0,
                    }}
                  >
                    {activeTeams.map((team) => {
                      const complete = isTeamComplete(team);
                      return (
                        <div
                          key={team.id}
                          style={{
                            background: '#fafafa',
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}
                        >
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                          >
                            <Text>{teamLabel(team)}</Text>
                            <Tag color={teamStatusColor[team.status]} style={{ marginRight: 0 }}>
                              {teamStatusLabel[team.status]}
                            </Tag>
                          </div>
                          {(!complete || team.consecutiveWins > 0) && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {!complete && 'Aguardando parceiro'}
                              {!complete && team.consecutiveWins > 0 && ' · '}
                              {team.consecutiveWins > 0 &&
                                `${team.consecutiveWins} vitória${team.consecutiveWins > 1 ? 's' : ''} seguida${team.consecutiveWins > 1 ? 's' : ''}`}
                            </Text>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!teams?.length && (
                    <Button
                      block
                      icon={<ThunderboltOutlined />}
                      loading={drawTeams.isPending}
                      onClick={handleDrawTeams}
                      disabled={session.playerIds.length < session.settings.playersPerTeam}
                    >
                      Sortear Times
                    </Button>
                  )}
                </Section>

                <Section title="Próximas duplas">
                  {!nextInQueue.length && !incompleteWaiting.length && (
                    <Text type="secondary">Fila vazia.</Text>
                  )}

                  {!!nextInQueue.length && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {nextInQueue.map((team, index) => (
                        <div
                          key={team.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#fafafa',
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}
                        >
                          <Text strong>{index + 1}º</Text>
                          <Text>{teamLabel(team)}</Text>
                        </div>
                      ))}
                    </div>
                  )}

                  {!!incompleteWaiting.length && (
                    <Text
                      type="secondary"
                      style={{ display: 'block', marginTop: nextInQueue.length ? 8 : 0, fontSize: 12 }}
                    >
                      Aguardando parceiro: {incompleteWaiting.map(teamLabel).join(', ')}
                    </Text>
                  )}
                </Section>

                <Section title="Partidas em andamento">
                  {isLoadingMatches && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                      <Spin />
                    </div>
                  )}

                  {!isLoadingMatches && !inProgressMatches.length && (
                    <Text type="secondary">Nenhuma partida em andamento.</Text>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {inProgressMatches.map((match) => {
                      const teamA = teams?.find((t) => t.id === match.teamAId);
                      const teamB = teams?.find((t) => t.id === match.teamBId);
                      const teamALabel = teamA ? teamLabel(teamA) : match.teamAId;
                      const teamBLabel = teamB ? teamLabel(teamB) : match.teamBId;

                      return (
                        <div key={match.id} style={{ background: '#fafafa', borderRadius: 8, padding: '8px 12px' }}>
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                          >
                            <Text style={{ display: 'block' }}>
                              Quadra {match.court}: {teamALabel} vs {teamBLabel}
                            </Text>
                            <Tag color="processing">Em andamento</Tag>
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            <Popconfirm
                              title="Confirmar vencedor"
                              description={`${teamALabel} venceu essa partida?`}
                              okText="Confirmar"
                              cancelText="Cancelar"
                              onConfirm={() => handleReportResult(match.id, match.teamAId)}
                            >
                              <Button size="small" loading={reportMatchResult.isPending}>
                                {teamALabel} venceu
                              </Button>
                            </Popconfirm>
                            <Popconfirm
                              title="Confirmar vencedor"
                              description={`${teamBLabel} venceu essa partida?`}
                              okText="Confirmar"
                              cancelText="Cancelar"
                              onConfirm={() => handleReportResult(match.id, match.teamBId)}
                            >
                              <Button size="small" loading={reportMatchResult.isPending}>
                                {teamBLabel} venceu
                              </Button>
                            </Popconfirm>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    block
                    icon={<PlayCircleOutlined />}
                    onClick={() => setMatchSheetOpen(true)}
                    disabled={startableTeams.length < 2}
                  >
                    Iniciar Partida
                  </Button>
                </Section>

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
                      const teamA = teams?.find((t) => t.id === match.teamAId);
                      const teamB = teams?.find((t) => t.id === match.teamBId);
                      const teamALabel = teamA ? teamLabel(teamA) : match.teamAId;
                      const teamBLabel = teamB ? teamLabel(teamB) : match.teamBId;
                      const winnerLabel =
                        match.winnerTeamId === match.teamAId ? teamALabel : teamBLabel;

                      return (
                        <div key={match.id} style={{ background: '#fafafa', borderRadius: 8, padding: '8px 12px' }}>
                          <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Quadra {match.court} · {match.playedAt ? dayjs(match.playedAt).format('HH:mm') : ''}
                            </Text>
                          </div>
                          <Text style={{ display: 'block', marginTop: 2 }}>
                            {teamALabel} vs {teamBLabel}
                          </Text>
                          <Text
                            strong
                            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#389e0d', marginTop: 4 }}
                          >
                            <TrophyOutlined /> {winnerLabel}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </>
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
                      <div
                        key={standing.playerId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#fafafa',
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
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
                    <div key={team.id} style={{ background: '#fafafa', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Text>{teamLabel(team)}</Text>
                        <Tag color={teamStatusColor[team.status]} style={{ marginRight: 0 }}>
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
        ]}
      />

      {sessionId && (
        <MatchFormSheet
          open={matchSheetOpen}
          sessionId={sessionId}
          teams={startableTeams}
          teamLabel={teamLabel}
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
