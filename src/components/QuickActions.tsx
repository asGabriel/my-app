import { FloatButton, theme } from 'antd';
import {
    PlusOutlined,
    DollarOutlined,
    CreditCardOutlined,
    WalletOutlined,
} from '@ant-design/icons';

interface QuickActionsProps {
    onAddDebt?: () => void;
    onAddPayment?: () => void;
    onAddIncome?: () => void;
}

export function QuickActions({ onAddDebt, onAddPayment, onAddIncome }: QuickActionsProps) {
    const { token } = theme.useToken();

    return (
        <FloatButton.Group
            trigger="click"
            type="primary"
            style={{ 
                insetInlineEnd: 24,
                insetBlockEnd: 24,
            }}
            icon={<PlusOutlined />}
        >
            <FloatButton
                icon={<CreditCardOutlined />}
                tooltip="Novo Débito"
                onClick={onAddDebt}
                style={{
                    backgroundColor: token.colorWarning,
                }}
            />
            <FloatButton
                icon={<WalletOutlined />}
                tooltip="Novo Pagamento"
                onClick={onAddPayment}
                style={{
                    backgroundColor: token.colorError,
                }}
            />
            <FloatButton
                icon={<DollarOutlined />}
                tooltip="Nova Entrada"
                onClick={onAddIncome}
                style={{
                    backgroundColor: token.colorSuccess,
                }}
            />
        </FloatButton.Group>
    );
}
