import { useState } from 'react';
import { Typography, Tag, App, Spin, Empty } from 'antd';
import { TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { useSessions, type Session } from '../../api';
import { SessionFormSheet } from '../components/SessionFormSheet';
import { Fab } from '../components/Fab';
import { gameModeLabel, gameModeColor } from '../shared/labels';

const { Title, Text } = Typography;

function sortByDateDesc(sessions: Session[]) {
  return [...sessions].sort((a, b) => b.date.localeCompare(a.date));
}

export function Sessions() {
  const { data: sessions, isLoading } = useSessions();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const sorted = sessions ? sortByDateDesc(sessions) : [];

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>
        Sessões
      </Title>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      )}

      {!isLoading && !sorted.length && <Empty description="Nenhuma sessão criada ainda" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((session) => (
          <button
            key={session.id}
            onClick={() => navigate(`/sessoes/${session.id}`)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>
                {dayjs(session.date).format('DD/MM/YYYY')}
              </Text>
              <Tag color={gameModeColor[session.gameMode]} style={{ marginRight: 0 }}>
                {gameModeLabel[session.gameMode]}
              </Tag>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <EnvironmentOutlined /> {session.availableCourts} quadra
                {session.availableCourts === 1 ? '' : 's'}
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                <TeamOutlined /> {session.playerIds.length} jogador
                {session.playerIds.length === 1 ? '' : 'es'}
              </Text>
            </div>
          </button>
        ))}
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
