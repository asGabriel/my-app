import { useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    DatePicker,
    InputNumber,
    Switch,
    Select,
    App,
} from 'antd';
import dayjs from 'dayjs';
import { useCreateRecurrence, useUpdateRecurrence, CreateRecurrenceRequest, Recurrence } from '../api';
import { DEBT_CATEGORY_OPTIONS } from '../utils/constants';

interface RecurrenceFormModalProps {
    open: boolean;
    onClose: () => void;
    recurrence?: Recurrence | null;
}

export function RecurrenceFormModal({ open, onClose, recurrence }: RecurrenceFormModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();

    const createRecurrence = useCreateRecurrence();
    const updateRecurrence = useUpdateRecurrence();

    const isEditing = !!recurrence;

    useEffect(() => {
        if (open) {
            if (recurrence) {
                form.setFieldsValue({
                    description: recurrence.description,
                    category: recurrence.category ?? undefined,
                    amount: parseFloat(recurrence.amount),
                    startDate: dayjs(recurrence.startDate),
                    endDate: recurrence.endDate ? dayjs(recurrence.endDate) : undefined,
                    dayOfMonth: recurrence.dayOfMonth,
                    active: recurrence.active,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    startDate: dayjs(),
                    dayOfMonth: dayjs().date(),
                    active: true,
                });
            }
        }
    }, [open, recurrence, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (isEditing && recurrence) {
                await updateRecurrence.mutateAsync({
                    recurrenceId: recurrence.id,
                    data: {
                        description: values.description,
                        dayOfMonth: values.dayOfMonth,
                        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
                        active: values.active,
                    },
                });
                message.success('Conta recorrente atualizada com sucesso!');
            } else {
                const payload: CreateRecurrenceRequest = {
                    description: values.description,
                    amount: values.amount.toString(),
                    startDate: values.startDate.format('YYYY-MM-DD'),
                    endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
                    dayOfMonth: values.dayOfMonth,
                    category: values.category ?? undefined,
                };
                await createRecurrence.mutateAsync(payload);
                message.success('Conta recorrente criada com sucesso!');
            }
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    const isPending = createRecurrence.isPending || updateRecurrence.isPending;

    return (
        <Modal
            title={isEditing ? 'Editar Conta Recorrente' : 'Nova Conta Recorrente'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText={isEditing ? 'Salvar' : 'Criar'}
            cancelText="Cancelar"
            confirmLoading={isPending}
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
                    <Input placeholder="Ex: Netflix, Spotify, Aluguel, etc" />
                </Form.Item>

                <Form.Item name="category" label="Categoria">
                    <Select
                        placeholder="Selecione a categoria (opcional)"
                        allowClear
                        options={DEBT_CATEGORY_OPTIONS}
                    />
                </Form.Item>

                <Form.Item
                    name="amount"
                    label="Valor"
                    rules={[{ required: !isEditing, message: 'Informe o valor' }]}
                >
                    <InputNumber
                        prefix="R$"
                        placeholder="0,00"
                        style={{ width: '100%' }}
                        precision={2}
                        decimalSeparator=","
                        min={0}
                        disabled={isEditing}
                    />
                </Form.Item>

                <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                        name="startDate"
                        label="Data de Início"
                        rules={[{ required: !isEditing, message: 'Informe a data de início' }]}
                        style={{ flex: 1 }}
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            placeholder="Selecione a data"
                            style={{ width: '100%' }}
                            disabled={isEditing}
                        />
                    </Form.Item>

                    <Form.Item
                        name="endDate"
                        label="Data de Término"
                        style={{ flex: 1 }}
                    >
                        <DatePicker
                            format="DD/MM/YYYY"
                            placeholder="Opcional"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    name="dayOfMonth"
                    label="Dia do Mês"
                    rules={[{ required: true, message: 'Informe o dia do mês' }]}
                    tooltip="Dia em que o débito será gerado mensalmente"
                >
                    <InputNumber
                        placeholder="1"
                        style={{ width: '100%' }}
                        min={1}
                        max={31}
                    />
                </Form.Item>

                {isEditing && (
                    <Form.Item
                        name="active"
                        label="Ativa"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
}
