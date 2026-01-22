import { useEffect, useState } from 'react';
import {
    Modal,
    Form,
    Input,
    DatePicker,
    InputNumber,
    Select,
    App,
} from 'antd';
import dayjs from 'dayjs';
import { useCreateDebt, useFinancialInstruments, CreateDebtRequest, Debt } from '../api';
import { DEBT_CATEGORY_OPTIONS, EXPENSE_TYPE_OPTIONS } from '../utils/constants';

interface DebtFormModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: Debt;
}

export function DebtFormModal({ open, onClose, initialData }: DebtFormModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [hasInstallments, setHasInstallments] = useState(false);

    const createDebt = useCreateDebt();
    const { data: instruments, isLoading: isLoadingInstruments } = useFinancialInstruments();

    const isEditing = !!initialData;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const installmentCount = initialData.installmentCount;
                setHasInstallments(!!installmentCount && installmentCount >= 1);
                form.setFieldsValue({
                    ...initialData,
                    dueDate: dayjs(initialData.dueDate),
                    totalAmount: parseFloat(initialData.totalAmount),
                    paidAmount: initialData.paidAmount ? parseFloat(initialData.paidAmount) : undefined,
                    discountAmount: initialData.discountAmount ? parseFloat(initialData.discountAmount) : undefined,
                });
            } else {
                form.resetFields();
                setHasInstallments(false);
                form.setFieldsValue({
                    dueDate: dayjs(),
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const payload: CreateDebtRequest = {
                description: values.description,
                dueDate: values.dueDate.format('YYYY-MM-DD'),
                totalAmount: values.totalAmount.toString(),
                isPaid: false,
                category: values.category || undefined,
                expenseType: values.expenseType || undefined,
                discountAmount: values.discountAmount?.toString(),
                installmentCount: values.installmentCount || undefined,
                financialInstrumentId: values.financialInstrumentId || undefined,
            };

            await createDebt.mutateAsync(payload);
            message.success('Débito criado com sucesso!');
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    return (
        <Modal
            title={isEditing ? 'Editar Débito' : 'Novo Débito'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText={isEditing ? 'Salvar' : 'Criar'}
            cancelText="Cancelar"
            confirmLoading={createDebt.isPending}
            destroyOnClose
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="description"
                    label="Descrição"
                    rules={[{ required: true, message: 'Informe a descrição' }]}
                >
                    <Input placeholder="Ex: Fatura do cartão, Aluguel, etc" />
                </Form.Item>

                <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                        name="category"
                        label="Categoria"
                        style={{ flex: 1 }}
                    >
                        <Select
                            placeholder="Selecione a categoria"
                            options={DEBT_CATEGORY_OPTIONS}
                            allowClear
                        />
                    </Form.Item>

                    <Form.Item
                        name="expenseType"
                        label="Tipo de Despesa"
                        style={{ flex: 1 }}
                    >
                        <Select
                            placeholder="Fixa ou Variável"
                            options={EXPENSE_TYPE_OPTIONS}
                            allowClear
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="dueDate"
                    label="Data de Vencimento"
                    rules={[{ required: true, message: 'Informe a data de vencimento' }]}
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        placeholder="Selecione a data"
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    name="totalAmount"
                    label="Valor Total"
                    rules={[{ required: true, message: 'Informe o valor' }]}
                >
                    <InputNumber
                        prefix="R$"
                        placeholder="0,00"
                        style={{ width: '100%' }}
                        precision={2}
                        decimalSeparator=","
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    name="installmentCount"
                    label="Número de Parcelas"
                >
                    <InputNumber
                        placeholder="1"
                        style={{ width: '100%' }}
                        min={1}
                        max={48}
                        onChange={(value) => {
                            setHasInstallments(!!value && value > 1);
                            if (!value || value <= 1) {
                                form.setFieldValue('financialInstrumentId', undefined);
                            }
                        }}
                    />
                </Form.Item>

                {hasInstallments && (
                    <Form.Item
                        name="financialInstrumentId"
                        label="Instrumento Financeiro"
                        rules={[{ required: true, message: 'Selecione o instrumento para débitos parcelados' }]}
                        tooltip="Obrigatório para débitos com parcelas"
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
                )}

                <Form.Item
                    name="discountAmount"
                    label="Valor de Desconto"
                >
                    <InputNumber
                        prefix="R$"
                        placeholder="0,00"
                        style={{ width: '100%' }}
                        precision={2}
                        decimalSeparator=","
                        min={0}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
