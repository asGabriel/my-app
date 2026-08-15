import { useEffect } from 'react';
import { Alert, Form, Select } from 'antd';
import { useCreateTeam, useCreatePriorityTeam } from '../../api';
import { BottomSheet } from './BottomSheet';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Swaps a raw player UUID in a backend error message for the player's name, when known. */
function humanizeError(message: string, playerNameById: Map<string, string>): string {
  const match = message.match(UUID_PATTERN);
  if (!match) return message;

  const name = playerNameById.get(match[0]);
  return name ? message.replace(match[0], name) : message;
}

interface TeamFormSheetProps {
  open: boolean;
  sessionId: string;
  playersPerTeam: number;
  availablePlayers: { id: string; label: string }[];
  playerNameById: Map<string, string>;
  /** When true, submits via the priority-queue path (jumps this pairing to
   * the front of the line, allowed to pull a player out of another waiting
   * team) instead of a plain manual team. */
  priority?: boolean;
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
  playerNameById,
  priority = false,
  onClose,
  onError,
}: TeamFormSheetProps) {
  const [form] = Form.useForm<TeamFormValues>();
  const createTeam = useCreateTeam();
  const createPriorityTeam = useCreatePriorityTeam();
  const mutation = priority ? createPriorityTeam : createTeam;

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      await mutation.mutateAsync({ sessionId, playerIds: values.playerIds });

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(humanizeError(error.message, playerNameById));
      }
    }
  };

  return (
    <BottomSheet
      title={priority ? 'Próximo Manual' : 'Nova Dupla'}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={priority ? 'Definir' : 'Criar'}
      loading={mutation.isPending}
    >
      {priority ? (
        <Alert
          type="warning"
          showIcon
          message="Pula a fila"
          description="Essa dupla joga assim que uma quadra liberar, na frente de todo mundo — ignora a ordem da fila e as restrições de gênero/duplas inéditas do sorteio. Se escolher alguém que já está em outra dupla esperando, essa dupla é desfeita e quem sobrar volta pra fila normalmente."
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          type="info"
          showIcon
          message="Entrada manual"
          description="Essa dupla entra direto na fila da sessão, ignorando as restrições de gênero e de duplas inéditas do modo de sorteio — use pra corrigir a fila manualmente em caso de imprevisto."
          style={{ marginBottom: 16 }}
        />
      )}
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
