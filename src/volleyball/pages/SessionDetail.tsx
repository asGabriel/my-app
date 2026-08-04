import { useMemo, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Typography, Tag, Select, Button, App, Empty, Spin } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useSession,
  usePlayers,
  useTeams,
  useMatches,
  useUpdateSession,
  useDrawTeams,
  type GameMode,
  type Team,
} from '../../api';
import { MatchFormSheet } from '../components/MatchFormSheet';

const { Title, Text } = Typography;

const gameModeLabel: Record<GameMode, string> = {
  male: 'Masculino',
  female: 'Feminino',
  mixed: 'Misto',
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

  const [rosterDraft, setRosterDraft] = useState<string[] | null>(null);
  const [matchSheetOpen, setMatchSheetOpen] = useState(false);

  const playerNameById = useMemo(() => {
    const map = new Map<string, string>();
    players?.forEach((player) => map.set(player.id, player.name));
    return map;
  }, [players]);

  const teamLabel = (team: Team) =>
    team.playerIds.map((id) => playerNameById.get(id) ?? id).join(' / ');

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

      <Section title="Times">
        {isLoadingTeams && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <Spin />
          </div>
        )}

        {!isLoadingTeams && !teams?.length && (
          <Text type="secondary">Nenhum time sorteado ainda.</Text>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: teams?.length ? 12 : 0 }}>
          {teams?.map((team) => (
            <div
              key={team.id}
              style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              <Text>{teamLabel(team)}</Text>
            </div>
          ))}
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
          {matches?.map((match) => {
            const teamA = teams?.find((t) => t.id === match.teamAId);
            const teamB = teams?.find((t) => t.id === match.teamBId);
            const winnerLabel =
              match.winnerTeamId === match.teamAId
                ? teamA && teamLabel(teamA)
                : teamB && teamLabel(teamB);

            return (
              <div key={match.id} style={{ background: '#fafafa', borderRadius: 8, padding: '8px 12px' }}>
                <Text style={{ display: 'block' }}>
                  Quadra {match.court}: {teamA ? teamLabel(teamA) : match.teamAId} vs{' '}
                  {teamB ? teamLabel(teamB) : match.teamBId}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Vencedor: {winnerLabel ?? match.winnerTeamId}
                </Text>
              </div>
            );
          })}
        </div>

        <Button
          block
          icon={<PlusOutlined />}
          onClick={() => setMatchSheetOpen(true)}
          disabled={!teams || teams.length < 2}
        >
          Registrar Partida
        </Button>
      </Section>

      {sessionId && teams && (
        <MatchFormSheet
          open={matchSheetOpen}
          sessionId={sessionId}
          teams={teams}
          teamLabel={teamLabel}
          onClose={() => setMatchSheetOpen(false)}
          onError={(error) => message.error(error)}
        />
      )}
    </div>
  );
}
