import { useEffect } from 'react';
import { Form, Select } from 'antd';
import { useCreateTeam } from '../../api';
import { BottomSheet } from './BottomSheet';

interface TeamFormSheetProps {
  open: boolean;
  sessionId: string;
  playersPerTeam: number;
  availablePlayers: { id: string; label: string }[];
  onClose: () => void;
  onError: (message: string) => void;
}

interface TeamFormValues {
  playerIds: string[];
}

export function TeamFormSheet({
  open,
  sessionId,
  playersPerTeam,
  availablePlayers,
  onClose,
  onError,
}: TeamFormSheetProps) {
  const [form] = Form.useForm<TeamFormValues>();
  const createTeam = useCreateTeam();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      await createTeam.mutateAsync({ sessionId, playerIds: values.playerIds });

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      }
    }
  };

  return (
    <BottomSheet
      title="Nova Dupla"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Criar"
      loading={createTeam.isPending}
    >
      <Form form={form} layout="vertical" size="large">
        <Form.Item
          name="playerIds"
          label="Jogadores"
          rules={[
            { required: true, message: 'Selecione os jogadores da dupla' },
            {
              validator(_, value?: string[]) {
                if (value && value.length > playersPerTeam) {
                  return Promise.reject(
                    new Error(`Uma dupla tem no máximo ${playersPerTeam} jogador${playersPerTeam === 1 ? '' : 'es'}`),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            mode="multiple"
            maxCount={playersPerTeam}
            placeholder="Selecione até completar a dupla"
            optionFilterProp="label"
            options={availablePlayers.map((player) => ({ label: player.label, value: player.id }))}
          />
        </Form.Item>
      </Form>
    </BottomSheet>
  );
}
