import { useState } from 'react';
import { Typography, Tag, App, Spin, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { usePlayers, type Player } from '../../api';
import { PlayerFormSheet } from '../components/PlayerFormSheet';
import { Fab } from '../components/Fab';

const { Title, Text } = Typography;

const genderLabel: Record<Player['gender'], string> = {
  male: 'Masculino',
  female: 'Feminino',
};

export function Players() {
  const { data: players, isLoading } = usePlayers();
  const { message } = App.useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const openCreate = () => {
    setEditingPlayer(null);
    setSheetOpen(true);
  };

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    setSheetOpen(true);
  };

  return (
    <div>
      <Title level={4} style={{ margin: '0 0 16px' }}>
        Jogadores
      </Title>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spin />
        </div>
      )}

      {!isLoading && !players?.length && <Empty description="Nenhum jogador cadastrado" />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {players?.map((player) => (
          <button
            key={player.id}
            onClick={() => openEdit(player)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              textAlign: 'left',
              cursor: 'pointer',
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
          </button>
        ))}
      </div>

      <Fab onClick={openCreate} label="Novo jogador" />

      <PlayerFormSheet
        open={sheetOpen}
        player={editingPlayer}
        onClose={() => setSheetOpen(false)}
        onError={(error) => message.error(error)}
      />
    </div>
  );
}
