import { useEffect } from 'react';
import { Alert, Form, Select } from 'antd';
import { useCreateTeam, useUpdateTeam, type Team } from '../../api';
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
  /** When set, edits this existing `Draft`'s roster instead of creating a
   * new one — pulling in a player already in another draft breaks that
   * draft up, and whoever this edit dropped goes back to the queue. */
  team?: Team;
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
  team,
  onClose,
  onError,
}: TeamFormSheetProps) {
  const [form] = Form.useForm<TeamFormValues>();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const mutation = team ? updateTeam : createTeam;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ playerIds: team?.playerIds ?? [] });
    }
  }, [open, team, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (team) {
        await updateTeam.mutateAsync({ teamId: team.id, sessionId, playerIds: values.playerIds });
      } else {
        await createTeam.mutateAsync({ sessionId, playerIds: values.playerIds });
      }

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        onError(humanizeError(error.message, playerNameById));
      }
    }
  };

  return (
    <BottomSheet
      title={team ? 'Editar rascunho' : 'Nova dupla'}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={team ? 'Salvar' : 'Criar'}
      loading={mutation.isPending}
    >
      <Alert
        type="info"
        showIcon
        message="Montagem manual"
        description="Ignora as restrições de gênero do modo da sessão — use pra corrigir a fila manualmente. Quem entra sai da fila; quem sai volta pra ela."
        style={{ marginBottom: 16 }}
      />
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
