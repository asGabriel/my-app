import { useEffect, useMemo, useState } from 'react';
import { Input, Checkbox, Empty, Spin, Select, Button, App } from 'antd';
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { useCreatePlayer, type Gender, type Player } from '../../api';
import { BottomSheet } from './BottomSheet';
import { genderLabel, genderOptions } from '../shared/labels';

interface RosterSheetProps {
  open: boolean;
  players: Player[] | undefined;
  loading?: boolean;
  saving?: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RosterSheet({
  open,
  players,
  loading,
  saving,
  selectedIds,
  onChange,
  onClose,
  onSubmit,
}: RosterSheetProps) {
  const { message } = App.useApp();
  const createPlayer = useCreatePlayer();

  const [search, setSearch] = useState('');
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('male');

  useEffect(() => {
    if (open) {
      setSearch('');
      setCreatingOpen(false);
      setNewName('');
      setNewGender('male');
    }
  }, [open]);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players ?? [];
    return (players ?? []).filter((player) => player.name.toLowerCase().includes(term));
  }, [players, search]);

  const selected = new Set(selectedIds);

  const toggle = (playerId: string) => {
    const next = new Set(selected);
    if (next.has(playerId)) {
      next.delete(playerId);
    } else {
      next.add(playerId);
    }
    onChange(Array.from(next));
  };

  const allFilteredSelected =
    filteredPlayers.length > 0 && filteredPlayers.every((player) => selected.has(player.id));
  const someFilteredSelected = filteredPlayers.some((player) => selected.has(player.id));

  const toggleSelectAll = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      filteredPlayers.forEach((player) => next.delete(player.id));
    } else {
      filteredPlayers.forEach((player) => next.add(player.id));
    }
    onChange(Array.from(next));
  };

  const handleCreatePlayer = async () => {
    const name = newName.trim();
    if (!name) return;

    try {
      const player = await createPlayer.mutateAsync({ name, gender: newGender });
      onChange([...selectedIds, player.id]);
      setNewName('');
      setNewGender('male');
      setCreatingOpen(false);
    } catch (error) {
      if (error instanceof Error) message.error(error.message);
    }
  };

  return (
    <BottomSheet
      title={`Jogadores confirmados (${selectedIds.length})`}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText="Salvar"
      loading={saving}
    >
      {!creatingOpen && (
        <Button
          type="dashed"
          block
          icon={<UserAddOutlined />}
          onClick={() => setCreatingOpen(true)}
          style={{ marginBottom: 12 }}
        >
          Novo jogador
        </Button>
      )}

      {creatingOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginBottom: 12,
            background: '#fafafa',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Input
            autoFocus
            placeholder="Nome do jogador"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onPressEnter={handleCreatePlayer}
          />
          <Select value={newGender} onChange={setNewGender} options={genderOptions} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setCreatingOpen(false)}>Cancelar</Button>
            <Button
              type="primary"
              loading={createPlayer.isPending}
              disabled={!newName.trim()}
              onClick={handleCreatePlayer}
            >
              Adicionar à sessão
            </Button>
          </div>
        </div>
      )}

      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Buscar jogador"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ marginBottom: 12 }}
      />

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Spin />
        </div>
      )}

      {!loading && !filteredPlayers.length && <Empty description="Nenhum jogador encontrado" />}

      {!loading && filteredPlayers.length > 0 && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '4px 8px 10px',
            cursor: 'pointer',
          }}
        >
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={!allFilteredSelected && someFilteredSelected}
            onChange={toggleSelectAll}
          />
          <span style={{ flex: 1, fontWeight: 500 }}>
            {allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </span>
        </label>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '50vh', overflowY: 'auto' }}>
        {filteredPlayers.map((player) => (
          <label
            key={player.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 8px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            <Checkbox checked={selected.has(player.id)} onChange={() => toggle(player.id)} />
            <span style={{ flex: 1 }}>{player.name}</span>
            <span style={{ fontSize: 12, color: player.gender === 'male' ? '#1677ff' : '#eb2f96' }}>
              {genderLabel[player.gender]}
            </span>
          </label>
        ))}
      </div>
    </BottomSheet>
  );
}
