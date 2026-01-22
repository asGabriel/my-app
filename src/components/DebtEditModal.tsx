import { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, App } from 'antd';
import dayjs from 'dayjs';
import { useUpdateDebt, UpdateDebtRequest } from '../api';
import { 
    DEBT_CATEGORY_OPTIONS, 
    EXPENSE_TYPE_OPTIONS,
    DEBT_CATEGORY_LABELS,
    DebtCategory,
} from '../utils/constants';

interface DebtInfo {
    id: string;
    description: string;
    category: string;
    expenseType?: string | null;
    tags?: string[];
    dueDate: string;
}

interface DebtEditModalProps {
    open: boolean;
    onClose: () => void;
    debt: DebtInfo | null;
}

export function DebtEditModal({ open, onClose, debt }: DebtEditModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const updateDebt = useUpdateDebt();

    useEffect(() => {
        if (open && debt) {
            form.setFieldsValue({
                description: debt.description,
                category: debt.category,
                expenseType: debt.expenseType,
                dueDate: debt.dueDate ? dayjs(debt.dueDate) : null,
            });
        }
    }, [open, debt, form]);

    const handleSubmit = async () => {
        if (!debt) return;

        try {
            const values = await form.validateFields();
            
            const payload: UpdateDebtRequest = {};
            
            if (values.description !== debt.description) {
                payload.description = values.description;
            }
            if (values.category !== debt.category) {
                payload.category = values.category;
            }
            if (values.expenseType !== debt.expenseType) {
                payload.expenseType = values.expenseType || null;
            }
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

    const handleClose = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title="Editar Débito"
            open={open}
            onOk={handleSubmit}
            onCancel={handleClose}
            okText="Salvar"
            cancelText="Cancelar"
            confirmLoading={updateDebt.isPending}
            destroyOnClose
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
                    <Input placeholder="Descrição do débito" />
                </Form.Item>

                <Form.Item
                    name="category"
                    label="Categoria"
                    rules={[{ required: true, message: 'Selecione a categoria' }]}
                >
                    <Select
                        placeholder="Selecione a categoria"
                        options={DEBT_CATEGORY_OPTIONS}
                    />
                </Form.Item>

                <Form.Item
                    name="expenseType"
                    label="Tipo de Despesa"
                >
                    <Select
                        placeholder="Selecione o tipo"
                        options={EXPENSE_TYPE_OPTIONS}
                        allowClear
                    />
                </Form.Item>

                <Form.Item
                    name="dueDate"
                    label="Data de Vencimento"
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                        placeholder="Selecione a data"
                    />
                </Form.Item>
            </Form>

            {debt && (
                <div style={{ 
                    marginTop: 16, 
                    padding: 12, 
                    background: '#f5f5f5', 
                    borderRadius: 6,
                    fontSize: 12,
                }}>
                    <strong>Categoria atual:</strong>{' '}
                    {DEBT_CATEGORY_LABELS[debt.category as DebtCategory] || debt.category}
                </div>
            )}
        </Modal>
    );
}
