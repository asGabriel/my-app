import { useState } from 'react';
import { FloatButton, Drawer, Button, Space } from 'antd';
import {
    PlusOutlined,
    RiseOutlined,
    CreditCardOutlined,
    WalletOutlined,
} from '@ant-design/icons';

interface QuickActionsProps {
    onAddDebt?: () => void;
    onAddPayment?: () => void;
    onAddIncome?: () => void;
}

const ACTIONS = [
    {
        key: 'debt' as const,
        label: 'Novo Débito',
        icon: <CreditCardOutlined />,
        color: '#faad14',
    },
    {
        key: 'payment' as const,
        label: 'Novo Pagamento',
        icon: <WalletOutlined />,
        color: '#ff4d4f',
    },
    {
        key: 'income' as const,
        label: 'Nova Receita',
        icon: <RiseOutlined />,
        color: '#52c41a',
    },
];

export function QuickActions({ onAddDebt, onAddPayment, onAddIncome }: QuickActionsProps) {
    const [open, setOpen] = useState(false);

    const handleAction = (key: 'debt' | 'payment' | 'income') => {
        setOpen(false);
        if (key === 'debt') onAddDebt?.();
        else if (key === 'payment') onAddPayment?.();
        else onAddIncome?.();
    };

    return (
        <>
            <FloatButton
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setOpen(true)}
                style={{
                    insetInlineEnd: 24,
                    insetBlockEnd: 24,
                }}
            />
            <Drawer
                title="Ações rápidas"
                placement="bottom"
                onClose={() => setOpen(false)}
                open={open}
                height="auto"
                styles={{
                    body: { paddingBottom: 32 },
                    header: { padding: '16px 24px' },
                }}
            >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {ACTIONS.map(({ key, label, icon, color }) => (
                        <Button
                            key={key}
                            type="default"
                            block
                            size="large"
                            icon={icon}
                            onClick={() => handleAction(key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: 12,
                                height: 52,
                                textAlign: 'left',
                                fontSize: 16,
                            }}
                        >
                            <span style={{ color, fontWeight: 500 }}>{label}</span>
                        </Button>
                    ))}
                </Space>
            </Drawer>
        </>
    );
}
