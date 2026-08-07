import { useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { useCreatePlayer, useUpdatePlayer, type Player, type Gender } from '../../api';
import { BottomSheet } from './BottomSheet';

interface PlayerFormSheetProps {
  open: boolean;
  player: Player | null;
  onClose: () => void;
  onError: (message: string) => void;
}

interface PlayerFormValues {
  name: string;
  gender: Gender;
}

export function PlayerFormSheet({ open, player, onClose, onError }: PlayerFormSheetProps) {
  const [form] = Form.useForm<PlayerFormValues>();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const isEditing = !!player;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: player?.name ?? '',
        gender: player?.gender ?? 'male',
      });
    }
  }, [open, player, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEditing) {
        await updatePlayer.mutateAsync({
          playerId: player.id,
          data: { name: values.name, gender: values.gender },
        });
      } else {
        await createPlayer.mutateAsync({ name: values.name, gender: values.gender });
      }

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      }
    }
  };

  return (
    <BottomSheet
      title={isEditing ? 'Editar Jogador' : 'Novo Jogador'}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={isEditing ? 'Salvar' : 'Criar'}
      loading={createPlayer.isPending || updatePlayer.isPending}
    >
      <Form form={form} layout="vertical" size="large">
        <Form.Item
          name="name"
          label="Nome"
          rules={[{ required: true, message: 'Informe o nome do jogador' }]}
        >
          <Input placeholder="Nome do jogador" />
        </Form.Item>

        <Form.Item
          name="gender"
          label="Gênero"
          rules={[{ required: true, message: 'Selecione o gênero' }]}
        >
          <Select
            options={[
              { label: 'Masculino', value: 'male' },
              { label: 'Feminino', value: 'female' },
            ]}
          />
        </Form.Item>
      </Form>
    </BottomSheet>
  );
}
