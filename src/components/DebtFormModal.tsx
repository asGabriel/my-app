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

function getNextDueDateFromDayOfMonth(dayOfMonth: number): dayjs.Dayjs {
    const today = dayjs();
    const day = Math.min(dayOfMonth, today.daysInMonth());
    let next = today.date(day);
    if (next.isBefore(today, 'day') || next.isSame(today, 'day')) {
        const nextMonth = today.add(1, 'month');
        next = nextMonth.date(Math.min(dayOfMonth, nextMonth.daysInMonth()));
    }
    return next;
}

export function DebtFormModal({ open, onClose, initialData }: DebtFormModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const [hasInstallments, setHasInstallments] = useState(false);

    const createDebt = useCreateDebt();
    const { data: instruments, isLoading: isLoadingInstruments } = useFinancialInstruments({
        instrumentTypes: ['CREDIT_CARD'],
    });

    const isEditing = !!initialData;
    const selectedInstrumentId = Form.useWatch('financialInstrumentId', form);
    const selectedInstrument = instruments?.find((i) => i.id === selectedInstrumentId);
    const defaultDueDay = selectedInstrument?.configuration?.defaultDueDate;
    const displayDueDate =
        hasInstallments && defaultDueDay != null
            ? getNextDueDateFromDayOfMonth(defaultDueDay)
            : null;

    useEffect(() => {
        if (open) {
            if (initialData) {
                const installmentCount = initialData.installmentCount;
                setHasInstallments(typeof installmentCount === 'number' && installmentCount >= 1);
                form.setFieldsValue({
                    ...initialData,
                    dueDate: dayjs(initialData.dueDate),
                    totalAmount: parseFloat(initialData.totalAmount),
                    paidAmount: initialData.paidAmount ? parseFloat(initialData.paidAmount) : undefined,
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

            const isParcelado = typeof values.installmentCount === 'number' && values.installmentCount >= 1;
            const dueDateForApi = isParcelado && displayDueDate
                ? displayDueDate.format('YYYY-MM-DD')
                : values.dueDate?.format('YYYY-MM-DD');
            const payload: CreateDebtRequest = {
                description: values.description,
                dueDate: dueDateForApi ?? dayjs().format('YYYY-MM-DD'),
                totalAmount: values.totalAmount.toString(),
                isPaid: false,
                category: values.category || undefined,
                expenseType: values.expenseType || undefined,
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
            className="debt-form-modal"
            styles={{ body: { maxWidth: '100%' }, wrapper: { overflow: 'auto' } }}
        >
            <Form
                form={form}
                layout="vertical"
                className="debt-form-modal__form"
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="description"
                    label="Descrição"
                    rules={[{ required: true, message: 'Informe a descrição' }]}
                >
                    <Input placeholder="Ex: Fatura do cartão, Aluguel, etc" style={{ width: '100%' }} />
                </Form.Item>

                <div className="debt-form-modal__row">
                    <Form.Item
                        name="category"
                        label="Categoria"
                        className="debt-form-modal__field"
                    >
                        <Select
                            placeholder="Selecione a categoria"
                            options={DEBT_CATEGORY_OPTIONS}
                            allowClear
                            style={{ width: '100%' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="expenseType"
                        label="Tipo de Despesa"
                        className="debt-form-modal__field"
                    >
                        <Select
                            placeholder="Fixa ou Variável"
                            options={EXPENSE_TYPE_OPTIONS}
                            allowClear
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="installmentCount"
                    label="Número de Parcelas"
                >
                    <InputNumber
                        placeholder="1 (à vista)"
                        style={{ width: '100%' }}
                        min={1}
                        max={48}
                        onChange={(value) => {
                            const hasInstallments = typeof value === 'number' && value >= 1;
                            setHasInstallments(hasInstallments);
                            if (!hasInstallments) {
                                form.setFieldValue('financialInstrumentId', undefined);
                            }
                        }}
                    />
                </Form.Item>

                {hasInstallments && (
                    <Form.Item
                        name="financialInstrumentId"
                        label="Instrumento Financeiro"
                        rules={[{ required: true, message: 'Selecione o instrumento financeiro para débitos parcelados' }]}
                        tooltip="Obrigatório quando o débito tem parcelas (ex.: cartão de crédito das parcelas)"
                    >
                        <Select
                            placeholder="Selecione o instrumento (ex.: cartão de crédito)"
                            loading={isLoadingInstruments}
                            options={instruments?.map((instrument) => ({
                                label: `${instrument.name} - ${instrument.identification}`,
                                value: instrument.id,
                            }))}
                            showSearch
                            optionFilterProp="label"
                            allowClear={false}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                )}

                {hasInstallments && displayDueDate != null && (
                    <Form.Item label="Data de Vencimento" tooltip="Definida pela configuração do instrumento (dia da fatura)">
                        <DatePicker
                            value={displayDueDate}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            disabled
                        />
                    </Form.Item>
                )}

                {!hasInstallments && (
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
                )}

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
            </Form>
        </Modal>
    );
}
