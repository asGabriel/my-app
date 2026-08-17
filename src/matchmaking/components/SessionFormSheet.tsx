import { useEffect } from 'react';
import { Form, DatePicker, Input, InputNumber, Select, Divider } from 'antd';
import dayjs from 'dayjs';
import { useCreateSession, type GameMode, type ShuffleType } from '../../api';
import { BottomSheet } from './BottomSheet';

const shuffleTypeForGameMode = (gameMode: GameMode): ShuffleType =>
  gameMode === 'open' ? 'roundRobin' : 'kingAndQueen';

interface SessionFormSheetProps {
  open: boolean;
  onClose: () => void;
  onError: (message: string) => void;
}

interface SessionFormValues {
  date: dayjs.Dayjs;
  description?: string;
  availableCourts: number;
  gameMode: GameMode;
  playersPerTeam: number;
}

// setsToWin/pointsPerSet aren't surfaced in the form: `Match` has no score
// fields today, so the backend just stores whatever is sent without using
// it anywhere. Sent as fixed defaults until that's implemented.
const DEFAULT_SETTINGS = {
  playersPerTeam: 2,
  setsToWin: 2,
  pointsPerSet: 21,
};

export function SessionFormSheet({ open, onClose, onError }: SessionFormSheetProps) {
  const [form] = Form.useForm<SessionFormValues>();
  const createSession = useCreateSession();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        availableCourts: 1,
        gameMode: 'mixed',
        playersPerTeam: DEFAULT_SETTINGS.playersPerTeam,
      });
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      await createSession.mutateAsync({
        date: values.date.format('YYYY-MM-DD'),
        description: values.description?.trim() || undefined,
        availableCourts: values.availableCourts,
        gameMode: values.gameMode,
        shuffleType: shuffleTypeForGameMode(values.gameMode),
        settings: {
          playersPerTeam: values.playersPerTeam,
          setsToWin: DEFAULT_SETTINGS.setsToWin,
          pointsPerSet: DEFAULT_SETTINGS.pointsPerSet,
        },
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
      title="Nova Sessão"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Criar"
      loading={createSession.isPending}
    >
      <Form form={form} layout="vertical" size="large">
        <Form.Item
          name="date"
          label="Data"
          rules={[{ required: true, message: 'Informe a data da sessão' }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="description" label="Descrição" extra="Opcional, só para identificar a sessão">
          <Input placeholder="Ex: Torneio de sexta" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="availableCourts"
          label="Quadras disponíveis"
          rules={[{ required: true, message: 'Informe o número de quadras' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="gameMode"
          label="Modo de jogo"
          rules={[{ required: true, message: 'Selecione o modo de jogo' }]}
          extra="No modo aberto, a fila prioriza formar duplas inéditas conforme os jogos terminam, sem considerar gênero"
        >
          <Select
            options={[
              { label: 'Masculino', value: 'male' },
              { label: 'Feminino', value: 'female' },
              { label: 'Misto', value: 'mixed' },
              { label: 'Aberto (sem gênero, todos com todos)', value: 'open' },
            ]}
          />
        </Form.Item>

        <Divider style={{ margin: '8px 0 16px' }}>Configurações da partida</Divider>

        <Form.Item
          name="playersPerTeam"
          label="Jogadores por time"
          dependencies={['gameMode']}
          rules={[
            { required: true, message: 'Informe os jogadores por time' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('gameMode') === 'mixed' && value % 2 !== 0) {
                  return Promise.reject(
                    new Error('No modo misto, os jogadores por time devem ser um número par'),
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </BottomSheet>
  );
}
