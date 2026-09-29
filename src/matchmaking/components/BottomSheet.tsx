import { ReactNode } from 'react';
import { Drawer, Button } from 'antd';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitText: string;
  loading?: boolean;
  submitDisabled?: boolean;
  /** Altura do painel; o padrão cabe um formulário inteiro. */
  height?: string | number;
  children: ReactNode;
}

export function BottomSheet({
  open,
  title,
  onClose,
  onSubmit,
  submitText,
  loading,
  submitDisabled,
  height = 'min(86vh, 640px)',
  children,
}: BottomSheetProps) {
  return (
    <Drawer
      title={title}
      placement="bottom"
      open={open}
      onClose={onClose}
      height={height}
      destroyOnClose
      styles={{
        content: { borderRadius: '20px 20px 0 0' },
        body: { paddingBottom: 8 },
        footer: { padding: '12px 16px calc(12px + env(safe-area-inset-bottom))' },
      }}
      footer={
        // Botões largos, lado a lado: alvo de toque confortável no celular.
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <Button size="large" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="large" type="primary" loading={loading} disabled={submitDisabled} onClick={onSubmit}>
            {submitText}
          </Button>
        </div>
      }
    >
      {children}
    </Drawer>
  );
}
