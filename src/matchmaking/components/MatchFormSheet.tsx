import { useEffect } from 'react';
import { Form, InputNumber, Select } from 'antd';
import { useCreateMatch, type Team } from '../../api';
import { BottomSheet } from './BottomSheet';

interface MatchFormSheetProps {
  open: boolean;
  sessionId: string;
  teams: Team[];
  teamLabel: (team: Team) => string;
  defaultCourt?: number;
  defaultTeamAId?: string;
  defaultTeamBId?: string;
  onClose: () => void;
  onError: (message: string) => void;
}

interface MatchFormValues {
  court: number;
  teamAId: string;
  teamBId: string;
}

export function MatchFormSheet({
  open,
  sessionId,
  teams,
  teamLabel,
  defaultCourt,
  defaultTeamAId,
  defaultTeamBId,
  onClose,
  onError,
}: MatchFormSheetProps) {
  const [form] = Form.useForm<MatchFormValues>();
  const createMatch = useCreateMatch();
  const teamAId = Form.useWatch('teamAId', form);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        court: defaultCourt ?? 1,
        teamAId: defaultTeamAId,
        teamBId: defaultTeamBId,
      });
    }
    // Defaults are captured only at the moment the sheet opens; re-running
    // this on every defaultCourt/defaultTeamAId/defaultTeamBId change would
    // reset fields the user is actively editing as the queue shifts underneath.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form]);

  const teamOptions = teams.map((team) => ({ label: teamLabel(team), value: team.id }));

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      await createMatch.mutateAsync({
        sessionId,
        court: values.court,
        teamAId: values.teamAId,
        teamBId: values.teamBId,
      });

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(error.message);
      }
    }
  };

  return (
    <BottomSheet
      title="Abrir Quadra"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Abrir"
      loading={createMatch.isPending}
    >
      <Form form={form} layout="vertical" size="large">
        <Form.Item
          name="court"
          label="Quadra"
          rules={[{ required: true, message: 'Informe a quadra' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="teamAId"
          label="Time A"
          rules={[{ required: true, message: 'Selecione o time A' }]}
        >
          <Select options={teamOptions} placeholder="Selecione o time A" />
        </Form.Item>

        <Form.Item
          name="teamBId"
          label="Time B"
          dependencies={['teamAId']}
          rules={[
            { required: true, message: 'Selecione o time B' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (value && value === getFieldValue('teamAId')) {
                  return Promise.reject(new Error('Time B deve ser diferente do Time A'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Select
            options={teamOptions.filter((option) => option.value !== teamAId)}
            placeholder="Selecione o time B"
          />
        </Form.Item>
      </Form>
    </BottomSheet>
  );
}
