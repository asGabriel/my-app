import { useEffect, useState, useMemo } from 'react';
import { Modal, Form, Input, Select, DatePicker, App, Tabs, InputNumber, Switch, Card, Tag, Space, Typography, Alert } from 'antd';
import dayjs from 'dayjs';
import { useUpdateDebt, useCreatePayment, useFinancialInstruments, useInstallments, UpdateDebtRequest, CreatePaymentRequest, Debt } from '../api';
import { formatCurrency } from '../utils/format';
import { 
    DEBT_CATEGORY_OPTIONS, 
    EXPENSE_TYPE_OPTIONS,
    DEBT_CATEGORY_LABELS,
    DebtCategory,
} from '../utils/constants';

const { Text } = Typography;

interface DebtEditModalProps {
    open: boolean;
    onClose: () => void;
    debt: Debt | null;
}

export function DebtEditModal({ open, onClose, debt }: DebtEditModalProps) {
    const [editForm] = Form.useForm();
    const [paymentForm] = Form.useForm();
    const { message } = App.useApp();
    const [activeTab, setActiveTab] = useState('edit');
    const [showReconcile, setShowReconcile] = useState(false);

    const updateDebt = useUpdateDebt();
    const createPayment = useCreatePayment();
    const { data: instruments, isLoading: isLoadingInstruments } = useFinancialInstruments();

    const isInstallmentDebt = !!(debt?.installmentCount && debt.installmentCount >= 1);
    const canPay = debt?.status !== 'SETTLED';

    const { data: installments, isLoading: isLoadingInstallments } = useInstallments(
        { debtIds: debt ? [debt.id] : undefined },
        !!debt && isInstallmentDebt && open
    );

    const nextInstallment = useMemo(() => {
        if (!debt || !installments || installments.length === 0) return null;
        const unpaid = installments
            .filter(i => i.debtId === debt.id && !i.isPaid)
            .sort((a, b) => a.installmentId - b.installmentId);
        return unpaid[0] || null;
    }, [installments, debt]);

    useEffect(() => {
        if (open && debt) {
            setActiveTab('edit');
            setShowReconcile(false);
            editForm.setFieldsValue({
                description: debt.description,
                category: debt.category,
                expenseType: debt.expenseType,
                dueDate: debt.dueDate ? dayjs(debt.dueDate) : null,
            });
            paymentForm.resetFields();
            paymentForm.setFieldsValue({
                paymentDate: dayjs(),
                reconcile: false,
            });
        }
    }, [open, debt, editForm, paymentForm]);

    useEffect(() => {
        if (nextInstallment && isInstallmentDebt) {
            paymentForm.setFieldValue('amount', parseFloat(nextInstallment.amount));
        } else if (debt && !isInstallmentDebt) {
            paymentForm.setFieldValue('amount', parseFloat(debt.remainingAmount));
        }
    }, [nextInstallment, isInstallmentDebt, debt, paymentForm]);

    const handleEditSubmit = async () => {
        if (!debt) return;
        try {
            const values = await editForm.validateFields();
            const payload: UpdateDebtRequest = {};
            
            if (values.description !== debt.description) payload.description = values.description;
            if (values.category !== debt.category) payload.category = values.category;
            if (values.expenseType !== debt.expenseType) payload.expenseType = values.expenseType || null;
            if (values.dueDate && values.dueDate.format('YYYY-MM-DD') !== debt.dueDate) {
                payload.dueDate = values.dueDate.format('YYYY-MM-DD');
            }

            if (Object.keys(payload).length === 0) {
                message.info('Nenhuma alteração detectada');
                onClose();
                return;
            }

            await updateDebt.mutateAsync({ debtId: debt.id, data: payload });
            message.success('Débito atualizado com sucesso!');
            onClose();
        } catch (error) {
            console.error('Erro ao atualizar débito:', error);
            message.error('Erro ao atualizar débito');
        }
    };

    const handlePaymentSubmit = async () => {
        if (!debt) return;
        try {
            const values = await paymentForm.validateFields();
            const payload: CreatePaymentRequest = {
                debtId: debt.id,
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

    const handleClose = () => {
        editForm.resetFields();
        paymentForm.resetFields();
        onClose();
    };

    const handleOk = () => {
        if (activeTab === 'edit') {
            handleEditSubmit();
        } else {
            handlePaymentSubmit();
        }
    };

    const getCompareValue = () => {
        if (nextInstallment) return parseFloat(nextInstallment.amount);
        if (debt) return parseFloat(debt.remainingAmount);
        return 0;
    };

    return (
        <Modal
            title={debt?.description || 'Débito'}
            open={open}
            onOk={handleOk}
            onCancel={handleClose}
            okText={activeTab === 'edit' ? 'Salvar' : 'Registrar Pagamento'}
            cancelText="Cancelar"
            confirmLoading={updateDebt.isPending || createPayment.isPending}
            okButtonProps={{ 
                disabled: activeTab === 'payment' && (!canPay || (isInstallmentDebt && !nextInstallment && !isLoadingInstallments))
            }}
            destroyOnClose
            width={500}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'edit',
                        label: 'Editar',
                        children: (
                            <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
                                <Form.Item
                                    name="description"
                                    label="Descrição"
                                    rules={[{ required: true, message: 'Informe a descrição' }]}
                                >
                                    <Input placeholder="Descrição do débito" />
                                </Form.Item>

                                <Form.Item
                                    name="category"
                                    label="Categoria"
                                    rules={[{ required: true, message: 'Selecione a categoria' }]}
                                >
                                    <Select placeholder="Selecione a categoria" options={DEBT_CATEGORY_OPTIONS} />
                                </Form.Item>

                                <Form.Item name="expenseType" label="Tipo de Despesa">
                                    <Select placeholder="Selecione o tipo" options={EXPENSE_TYPE_OPTIONS} allowClear />
                                </Form.Item>

                                <Form.Item name="dueDate" label="Data de Vencimento">
                                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Selecione a data" />
                                </Form.Item>

                                {debt && (
                                    <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 6, fontSize: 12 }}>
                                        <strong>Categoria atual:</strong>{' '}
                                        {DEBT_CATEGORY_LABELS[debt.category as DebtCategory] || debt.category}
                                    </div>
                                )}
                            </Form>
                        ),
                    },
                    {
                        key: 'payment',
                        label: 'Pagamento',
                        disabled: !canPay,
                        children: (
                            <div style={{ marginTop: 8 }}>
                                {!canPay ? (
                                    <Alert message="Este débito já está quitado" type="success" showIcon />
                                ) : (
                                    <>
                                        {debt && (
                                            <Card size="small" style={{ marginBottom: 16 }}>
                                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                        <Text strong>{debt.description}</Text>
                                                        {isInstallmentDebt && (
                                                            <Tag color="blue">{debt.installmentCount}x</Tag>
                                                        )}
                                                    </Space>
                                                    <Text type="secondary">
                                                        Restante: <Text strong style={{ color: '#ff4d4f' }}>
                                                            {formatCurrency(parseFloat(debt.remainingAmount))}
                                                        </Text>
                                                    </Text>
                                                </Space>
                                            </Card>
                                        )}

                                        {isInstallmentDebt && isLoadingInstallments && (
                                            <Alert message="Buscando parcelas..." type="info" showIcon style={{ marginBottom: 16 }} />
                                        )}

                                        {isInstallmentDebt && nextInstallment && (
                                            <Card size="small" style={{ marginBottom: 16, background: '#e6f7ff', borderColor: '#91d5ff' }}>
                                                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                        <Text strong>
                                                            Parcela {nextInstallment.installmentId}/{debt?.installmentCount}
                                                        </Text>
                                                        <Tag color="processing">
                                                            {formatCurrency(parseFloat(nextInstallment.amount))}
                                                        </Tag>
                                                    </Space>
                                                    <Text type="secondary">
                                                        Vencimento: {dayjs(nextInstallment.dueDate).format('DD/MM/YYYY')}
                                                    </Text>
                                                </Space>
                                            </Card>
                                        )}

                                        {isInstallmentDebt && !isLoadingInstallments && !nextInstallment && (
                                            <Alert message="Todas as parcelas já foram pagas" type="success" showIcon style={{ marginBottom: 16 }} />
                                        )}

                                        <Form form={paymentForm} layout="vertical">
                                            <Form.Item
                                                name="financialInstrumentId"
                                                label="Instrumento Financeiro"
                                                rules={[{ required: true, message: 'Selecione o instrumento' }]}
                                            >
                                                <Select
                                                    placeholder="Selecione o instrumento"
                                                    loading={isLoadingInstruments}
                                                    options={instruments?.map((inst) => ({
                                                        label: `${inst.name} - ${inst.identification}`,
                                                        value: inst.id,
                                                    }))}
                                                    showSearch
                                                    optionFilterProp="label"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="paymentDate"
                                                label="Data do Pagamento"
                                                rules={[{ required: true, message: 'Informe a data' }]}
                                            >
                                                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Selecione a data" />
                                            </Form.Item>

                                            <Form.Item name="amount" label="Valor do Pagamento">
                                                <InputNumber
                                                    prefix="R$"
                                                    placeholder="0,00"
                                                    style={{ width: '100%' }}
                                                    precision={2}
                                                    decimalSeparator=","
                                                    min={0}
                                                    onChange={(value) => {
                                                        setShowReconcile(value !== null && value !== getCompareValue());
                                                    }}
                                                />
                                            </Form.Item>

                                            {showReconcile && (
                                                <Form.Item
                                                    name="reconcile"
                                                    label="Baixar débito com este valor?"
                                                    valuePropName="checked"
                                                    tooltip="Marque se o valor pago é diferente do restante, mas deve baixar completamente"
                                                >
                                                    <Switch />
                                                </Form.Item>
                                            )}
                                        </Form>
                                    </>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </Modal>
    );
}
