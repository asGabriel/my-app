import { useEffect } from 'react';
import { Alert, Form, InputNumber, Select } from 'antd';
import { useCreateMatch, useCreateTeam } from '../../api';
import { BottomSheet } from './BottomSheet';

interface MatchFormSheetProps {
  open: boolean;
  sessionId: string;
  playersPerTeam: number;
  availablePlayers: { id: string; label: string }[];
  defaultCourt?: number;
  onClose: () => void;
  onError: (message: string) => void;
}

interface MatchFormValues {
  court: number;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
}

/**
 * Opens a court by hand: pick the court and the two rosters. Creates both
 * teams (`createTeam`, which pulls the players off the session queue and
 * ignores the game mode's gender rules) then starts the match. This is how
 * a session gets its first matches going.
 */
export function MatchFormSheet({
  open,
  sessionId,
  playersPerTeam,
  availablePlayers,
  defaultCourt,
  onClose,
  onError,
}: MatchFormSheetProps) {
  const [form] = Form.useForm<MatchFormValues>();
  const createTeam = useCreateTeam();
  const createMatch = useCreateMatch();
  const teamAPlayerIds: string[] = Form.useWatch('teamAPlayerIds', form) ?? [];

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ court: defaultCourt ?? 1, teamAPlayerIds: [], teamBPlayerIds: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form]);

  const rosterRules = [
    { required: true, message: 'Selecione os jogadores' },
    {
      validator(_: unknown, value?: string[]) {
        if (value && value.length !== playersPerTeam) {
          return Promise.reject(new Error(`O time precisa de exatamente ${playersPerTeam} jogadores`));
        }
        return Promise.resolve();
      },
    },
  ];

  const options = (exclude: string[]) =>
    availablePlayers
      .filter((player) => !exclude.includes(player.id))
      .map((player) => ({ label: player.label, value: player.id }));

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const teamA = await createTeam.mutateAsync({ sessionId, playerIds: values.teamAPlayerIds });
      const teamB = await createTeam.mutateAsync({ sessionId, playerIds: values.teamBPlayerIds });
      await createMatch.mutateAsync({
        sessionId,
        court: values.court,
        teamAId: teamA.id,
        teamBId: teamB.id,
      });

      onClose();
    } catch (error) {
      if (error instanceof Error) onError(error.message);
    }
  };

  return (
    <BottomSheet
      title="Abrir quadra"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Abrir"
      loading={createTeam.isPending || createMatch.isPending}
    >
      <Alert
        type="info"
        showIcon
        message="Monta os dois times na mão"
        description="Os jogadores escolhidos saem da fila. Não valida gênero — o operador decide as duplas."
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" size="large">
        <Form.Item name="court" label="Quadra" rules={[{ required: true, message: 'Informe a quadra' }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="teamAPlayerIds" label="Time A" rules={rosterRules}>
          <Select
            mode="multiple"
            maxCount={playersPerTeam}
            optionFilterProp="label"
            placeholder="Jogadores do time A"
            options={options([])}
          />
        </Form.Item>

        <Form.Item name="teamBPlayerIds" label="Time B" dependencies={['teamAPlayerIds']} rules={rosterRules}>
          <Select
            mode="multiple"
            maxCount={playersPerTeam}
            optionFilterProp="label"
            placeholder="Jogadores do time B"
            options={options(teamAPlayerIds)}
          />
        </Form.Item>
      </Form>
    </BottomSheet>
  );
}
