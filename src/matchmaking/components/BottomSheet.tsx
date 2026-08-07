import { ReactNode } from 'react';
import { Drawer, Button, Space } from 'antd';

interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitText: string;
  loading?: boolean;
  children: ReactNode;
}

export function BottomSheet({
  open,
  title,
  onClose,
  onSubmit,
  submitText,
  loading,
  children,
}: BottomSheetProps) {
  return (
    <Drawer
      title={title}
      placement="bottom"
      open={open}
      onClose={onClose}
      height="min(86vh, 640px)"
      destroyOnClose
      styles={{
        content: { borderRadius: '20px 20px 0 0' },
        body: { paddingBottom: 8 },
      }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="primary" loading={loading} onClick={onSubmit}>
            {submitText}
          </Button>
        </Space>
      }
    >
      {children}
    </Drawer>
  );
}
