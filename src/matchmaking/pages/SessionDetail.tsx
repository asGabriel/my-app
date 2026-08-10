import { useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Typography, Tag, Select, Button, App, Empty, Spin, Popconfirm } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useSession,
  usePlayers,
  useTeams,
  useMatches,
  useUpdateSession,
  useDrawTeams,
  useReportMatchResult,
  type GameMode,
  type Team,
  type TeamStatus,
} from '../../api';
import { MatchFormSheet } from '../components/MatchFormSheet';
import { TeamFormSheet } from '../components/TeamFormSheet';

const { Title, Text } = Typography;

const gameModeLabel: Record<GameMode, string> = {
  male: 'Masculino',
  female: 'Feminino',
  mixed: 'Misto',
};

const teamStatusLabel: Record<TeamStatus, string> = {
  waiting: 'Na fila',
  holding: 'Segurando quadra',
  disbanded: 'Encerrado',
};

const teamStatusColor: Record<TeamStatus, string> = {
  waiting: 'blue',
  holding: 'gold',
  disbanded: 'default',
};

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

  const [rosterDraft, setRosterDraft] = useState<string[] | null>(null);
  const [matchSheetOpen, setMatchSheetOpen] = useState(false);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);

  const playerNameById = useMemo(() => {
    const map = new Map<string, string>();
    players?.forEach((player) => map.set(player.id, player.name));
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
          team.status !== 'disbanded' &&
          team.playerIds.length >= playersPerTeam &&
          !busyTeamIds.has(team.id),
      ),
    [teams, busyTeamIds, playersPerTeam],
  );

  const nextInQueue = useMemo(
    () =>
      (teams ?? [])
        .filter((team) => team.status === 'waiting' && team.playerIds.length >= playersPerTeam)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [teams, playersPerTeam],
  );

  const incompleteWaiting = useMemo(
    () => (teams ?? []).filter((team) => team.status === 'waiting' && team.playerIds.length < playersPerTeam),
    [teams, playersPerTeam],
  );

  const availablePlayersForTeam = useMemo(() => {
    if (!session) return [];
    const assigned = new Set((teams ?? []).flatMap((team) => team.playerIds));
    return session.playerIds
      .filter((id) => !assigned.has(id))
      .map((id) => ({ id, label: playerNameById.get(id) ?? id }));
  }, [session, teams, playerNameById]);

  const sortedMatches = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort((a, b) => {
      const aInProgress = a.winnerTeamId == null;
      const bInProgress = b.winnerTeamId == null;
      if (aInProgress !== bInProgress) return aInProgress ? -1 : 1;
      if (aInProgress) return b.startedAt.localeCompare(a.startedAt);
      return (b.playedAt ?? '').localeCompare(a.playedAt ?? '');
    });
  }, [matches]);

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

  const roster = rosterDraft ?? session.playerIds;
  const rosterChanged =
    rosterDraft !== null &&
    (rosterDraft.length !== session.playerIds.length ||
      rosterDraft.some((id) => !session.playerIds.includes(id)));

  const handleSaveRoster = async () => {
    if (!sessionId || rosterDraft === null) return;

    try {
      await updateSession.mutateAsync({ sessionId, data: { playerIds: rosterDraft } });
      message.success('Jogadores da sessão atualizados!');
      setRosterDraft(null);
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

      <Section
        title="Jogadores confirmados"
        extra={
          rosterChanged && (
            <Button type="primary" size="small" loading={updateSession.isPending} onClick={handleSaveRoster}>
              Salvar
            </Button>
          )
        }
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          loading={isLoadingPlayers}
          placeholder="Selecione os jogadores confirmados"
          value={roster}
          onChange={(value) => setRosterDraft(value)}
          optionFilterProp="label"
          options={players?.map((player) => ({
            label: `${player.name} (${player.gender === 'male' ? 'M' : 'F'})`,
            value: player.id,
          }))}
        />
      </Section>

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

        {!isLoadingTeams && !teams?.length && (
          <Text type="secondary">Nenhum time formado ainda.</Text>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: teams?.length ? 12 : 0 }}>
          {teams?.map((team) => {
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
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

      <Section title="Partidas">
        {isLoadingMatches && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <Spin />
          </div>
        )}

        {!isLoadingMatches && !matches?.length && (
          <Text type="secondary">Nenhuma partida registrada ainda.</Text>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {sortedMatches.map((match) => {
            const teamA = teams?.find((t) => t.id === match.teamAId);
            const teamB = teams?.find((t) => t.id === match.teamBId);
            const inProgress = match.winnerTeamId == null;
            const winnerLabel = !inProgress
              ? match.winnerTeamId === match.teamAId
                ? teamA && teamLabel(teamA)
                : teamB && teamLabel(teamB)
              : null;
            const teamALabel = teamA ? teamLabel(teamA) : match.teamAId;
            const teamBLabel = teamB ? teamLabel(teamB) : match.teamBId;

            return (
              <div key={match.id} style={{ background: '#fafafa', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Text style={{ display: 'block' }}>
                    Quadra {match.court}: {teamALabel} vs {teamBLabel}
                  </Text>
                  {inProgress && <Tag color="processing">Em andamento</Tag>}
                </div>

                {inProgress ? (
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
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Vencedor: {winnerLabel ?? match.winnerTeamId}
                  </Text>
                )}
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
          onClose={() => setTeamSheetOpen(false)}
          onError={(error) => message.error(error)}
        />
      )}
    </div>
  );
}
