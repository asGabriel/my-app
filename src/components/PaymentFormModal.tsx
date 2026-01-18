import { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    DatePicker,
    InputNumber,
    Switch,
    List,
    Card,
    Empty,
    App,
    theme,
    Typography,
    Space,
    Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useDebts, useCreatePayment, Debt, CreatePaymentRequest } from '../api';
import { Loading } from './Loading';
import { formatCurrency, formatDebtStatus, debtStatusColors } from '../utils/format';

interface PaymentFormModalProps {
    open: boolean;
    onClose: () => void;
}

const { Text } = Typography;

export function PaymentFormModal({ open, onClose }: PaymentFormModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const { token } = theme.useToken();
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [showReconcile, setShowReconcile] = useState(false);

    const { data: debts, isLoading } = useDebts({
        statuses: ['UNPAID', 'PARTIALLY_PAID'],
    });

    const createPayment = useCreatePayment();

    useEffect(() => {
        if (open) {
            setSelectedDebt(null);
            setShowReconcile(false);
            form.resetFields();
            form.setFieldsValue({
                paymentDate: dayjs(),
                reconcile: false,
            });
        }
    }, [open, form]);

    const handleSelectDebt = (debt: Debt) => {
        setSelectedDebt(debt);
        form.setFieldsValue({
            amount: parseFloat(debt.remainingAmount),
        });
    };

    const handleSubmit = async () => {
        if (!selectedDebt) {
            message.warning('Selecione um débito para pagar');
            return;
        }

        try {
            const values = await form.validateFields();

            const payload: CreatePaymentRequest = {
                debtId: selectedDebt.id,
                paymentDate: values.paymentDate.format('YYYY-MM-DD'),
                amount: values.amount?.toString() || '',
                reconcile: values.reconcile || false,
                // TODO: implement account selection - using mock accountId for now
                accountId: '00000000-0000-0000-0000-000000000000',
            };

            await createPayment.mutateAsync(payload);
            message.success('Pagamento registrado com sucesso!');
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    const unpaidDebts = debts || [];

    return (
        <Modal
            title="Novo Pagamento"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Registrar Pagamento"
            cancelText="Cancelar"
            confirmLoading={createPayment.isPending}
            destroyOnClose
            width={600}
            okButtonProps={{ disabled: !selectedDebt }}
        >
            <Loading loading={isLoading}>
                {unpaidDebts.length === 0 ? (
                    <Empty description="Nenhum débito pendente encontrado" />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <Text strong>Selecione o débito a ser pago:</Text>

                        <List
                            dataSource={unpaidDebts}
                            style={{ maxHeight: 300, overflow: 'auto' }}
                            renderItem={(debt) => (
                                <Card
                                    size="small"
                                    style={{
                                        marginBottom: 8,
                                        cursor: 'pointer',
                                        border: selectedDebt?.id === debt.id
                                            ? `2px solid ${token.colorPrimary}`
                                            : `1px solid ${token.colorBorderSecondary}`,
                                        backgroundColor: selectedDebt?.id === debt.id
                                            ? token.colorPrimaryBg
                                            : undefined,
                                    }}
                                    onClick={() => handleSelectDebt(debt)}
                                >
                                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Text strong>{debt.description}</Text>
                                            <Tag color={debtStatusColors[debt.status]}>
                                                {formatDebtStatus(debt.status)}
                                            </Tag>
                                        </Space>
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Text type="secondary">
                                                Vencimento: {dayjs(debt.dueDate).format('DD/MM/YYYY')}
                                            </Text>
                                            <Text strong style={{ color: token.colorError }}>
                                                Restante: {formatCurrency(parseFloat(debt.remainingAmount))}
                                            </Text>
                                        </Space>
                                    </Space>
                                </Card>
                            )}
                        />

                        {selectedDebt && (
                            <Form
                                form={form}
                                layout="vertical"
                            >
                                <Form.Item
                                    name="paymentDate"
                                    label="Data do Pagamento"
                                    rules={[{ required: true, message: 'Informe a data do pagamento' }]}
                                >
                                    <DatePicker
                                        format="DD/MM/YYYY"
                                        placeholder="Selecione a data"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="amount"
                                    label="Valor do Pagamento"
                                >
                                    <InputNumber
                                        prefix="R$"
                                        placeholder="0,00"
                                        style={{ width: '100%' }}
                                        precision={2}
                                        decimalSeparator=","
                                        min={0}
                                        onChange={(value) => {
                                            const remaining = parseFloat(selectedDebt.remainingAmount);
                                            setShowReconcile(value !== null && value !== remaining);
                                        }}
                                    />
                                </Form.Item>

                                {showReconcile && (
                                    <Form.Item
                                        name="reconcile"
                                        label="Baixar débito com este valor?"
                                        valuePropName="checked"
                                        tooltip="Marque se o valor pago é diferente do valor restante, mas deve baixar o débito completamente"
                                    >
                                        <Switch />
                                    </Form.Item>
                                )}
                            </Form>
                        )}
                    </div>
                )}
            </Loading>
        </Modal>
    );
}
