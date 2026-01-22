import { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    Form,
    DatePicker,
    InputNumber,
    Switch,
    Select,
    List,
    Card,
    Empty,
    App,
    theme,
    Typography,
    Space,
    Tag,
    Alert,
} from 'antd';
import dayjs from 'dayjs';
import {
    useDebts,
    useCreatePayment,
    useFinancialInstruments,
    useInstallments,
    Debt,
    Installment,
    CreatePaymentRequest
} from '../api';
import { Loading } from './Loading';
import { formatCurrency } from '../utils/format';
import { formatDebtStatus, DEBT_STATUS_COLORS } from '../utils/constants';

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
    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
    const [showReconcile, setShowReconcile] = useState(false);

    const { data: debts, isLoading: isLoadingDebts } = useDebts({
        statuses: ['UNPAID', 'PARTIALLY_PAID'],
    });

    const { data: instruments, isLoading: isLoadingInstruments } = useFinancialInstruments();

    const isInstallmentDebt = !!(selectedDebt?.installmentCount && selectedDebt.installmentCount >= 1);

    const { data: installments, isLoading: isLoadingInstallments } = useInstallments(
        {
            debtIds: selectedDebt ? [selectedDebt.id] : undefined,
        },
        !!selectedDebt && isInstallmentDebt
    );

    const createPayment = useCreatePayment();

    const isLoading = isLoadingDebts || isLoadingInstruments;

    const nextInstallment = useMemo(() => {
        if (!selectedDebt || !installments || installments.length === 0) return null;

        const unpaidInstallments = installments
            .filter(i => i.debtId === selectedDebt.id && !i.isPaid)
            .sort((a, b) => a.installmentId - b.installmentId);

        return unpaidInstallments[0] || null;
    }, [installments, selectedDebt]);

    useEffect(() => {
        if (open) {
            setSelectedDebt(null);
            setSelectedInstallment(null);
            setShowReconcile(false);
            form.resetFields();
            form.setFieldsValue({
                paymentDate: dayjs(),
                reconcile: false,
            });
        }
    }, [open, form]);

    useEffect(() => {
        if (nextInstallment && isInstallmentDebt && selectedDebt) {
            if (nextInstallment.debtId === selectedDebt.id) {
                setSelectedInstallment(nextInstallment);
                form.setFieldsValue({
                    amount: parseFloat(nextInstallment.amount),
                });
            }
        }
    }, [nextInstallment, isInstallmentDebt, selectedDebt, form]);

    const handleSelectDebt = (debt: Debt) => {
        setSelectedInstallment(null);
        setShowReconcile(false);
        form.setFieldValue('amount', undefined);

        setSelectedDebt(debt);

        if (!debt.installmentCount || debt.installmentCount <= 1) {
            form.setFieldsValue({
                amount: parseFloat(debt.remainingAmount),
            });
        }
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
                financialInstrumentId: values.financialInstrumentId,
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
                            style={{ maxHeight: 250, overflow: 'auto' }}
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
                                            <Space>
                                                <Text strong>{debt.description}</Text>
                                                {debt.installmentCount && debt.installmentCount >= 1 && (
                                                    <Tag color="blue">{debt.installmentCount}x</Tag>
                                                )}
                                            </Space>
                                            <Tag color={DEBT_STATUS_COLORS[debt.status]}>
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
                            <>
                                {isInstallmentDebt && isLoadingInstallments && (
                                    <Alert
                                        message="Buscando parcelas..."
                                        type="info"
                                        showIcon
                                    />
                                )}

                                {isInstallmentDebt && selectedInstallment && (
                                    <Card
                                        size="small"
                                        style={{
                                            backgroundColor: token.colorInfoBg,
                                            borderColor: token.colorInfoBorder,
                                        }}
                                    >
                                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Text strong style={{ fontSize: 16 }}>
                                                    Parcela {selectedInstallment.installmentId}/{selectedDebt.installmentCount}
                                                </Text>
                                                <Tag color="processing">
                                                    {formatCurrency(parseFloat(selectedInstallment.amount))}
                                                </Tag>
                                            </Space>
                                            <Text type="secondary">
                                                Vencimento: {dayjs(selectedInstallment.dueDate).format('DD/MM/YYYY')}
                                            </Text>
                                        </Space>
                                    </Card>
                                )}

                                {isInstallmentDebt && !isLoadingInstallments && !selectedInstallment && installments?.length === 0 && (
                                    <Alert
                                        message="Nenhuma parcela em aberto encontrada"
                                        type="warning"
                                        showIcon
                                    />
                                )}

                                <Form
                                    form={form}
                                    layout="vertical"
                                >
                                    <Form.Item
                                        name="financialInstrumentId"
                                        label="Instrumento Financeiro"
                                        rules={[{ required: true, message: 'Selecione o instrumento' }]}
                                    >
                                        <Select
                                            placeholder="Selecione o instrumento"
                                            loading={isLoadingInstruments}
                                            options={instruments?.map((instrument) => ({
                                                label: `${instrument.name} - ${instrument.identification}`,
                                                value: instrument.id,
                                            }))}
                                            showSearch
                                            optionFilterProp="label"
                                        />
                                    </Form.Item>

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
                                                const compareValue = selectedInstallment
                                                    ? parseFloat(selectedInstallment.amount)
                                                    : parseFloat(selectedDebt.remainingAmount);
                                                setShowReconcile(value !== null && value !== compareValue);
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
                            </>
                        )}
                    </div>
                )}
            </Loading>
        </Modal>
    );
}
