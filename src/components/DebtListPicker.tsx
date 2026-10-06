import { useState } from 'react';
import { useCreateFinanceList, type DebtList } from '../api';

interface DebtListPickerProps {
  lists: DebtList[];
  /** `null` = sem lista. */
  value: string | null;
  onChange: (listId: string | null) => void;
  /** Erros ao criar uma lista nova sobem para quem renderiza o picker. */
  onError: (message: string | null) => void;
  disabled?: boolean;
}

function pillClass(active: boolean) {
  return active ? 'pill pill-active' : 'pill';
}

/** Escolhe a lista de um débito, ou cria uma nova e já a seleciona. */
export function DebtListPicker({ lists, value, onChange, onError, disabled }: DebtListPickerProps) {
  const createList = useCreateFinanceList();
  const [newName, setNewName] = useState('');

  const handleCreateList = () => {
    const name = newName.trim();
    if (!name) return;
    onError(null);
    createList
      .mutateAsync({ name })
      .then((list) => {
        onChange(list.id);
        setNewName('');
      })
      .catch((e) => onError(e instanceof Error ? e.message : 'Erro ao criar a lista.'));
  };

  return (
    <div>
      <div className="field-kicker" style={{ paddingBottom: 8 }}>Lista</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button className={pillClass(value === null)} onClick={() => onChange(null)}>
          Sem lista
        </button>
        {lists.map((l) => (
          <button key={l.id} className={pillClass(value === l.id)} onClick={() => onChange(l.id)}>
            {l.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input
          className="input"
          type="text"
          placeholder="Nova lista"
          aria-label="Nome da nova lista"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
          style={{ flex: '1 1 auto', minWidth: 0 }}
        />
        <button
          className="btn btn-secondary"
          disabled={disabled || createList.isPending || !newName.trim()}
          onClick={handleCreateList}
          style={{ flex: '0 0 auto' }}
        >
          Criar
        </button>
      </div>
    </div>
  );
}
