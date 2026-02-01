import { useEffect } from 'react';
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
import { useCreateIncome, useFinancialInstruments, CreateIncomeRequest } from '../api';

interface IncomeFormModalProps {
    open: boolean;
    onClose: () => void;
}

export function IncomeFormModal({ open, onClose }: IncomeFormModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const createIncome = useCreateIncome();
    const { data: instruments, isLoading: isLoadingInstruments } = useFinancialInstruments();

    useEffect(() => {
        if (open) {
            form.resetFields();
            form.setFieldsValue({
                dateReference: dayjs(),
            });
        }
    }, [open, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const payload: CreateIncomeRequest = {
                financialInstrumentId: values.financialInstrumentId,
                description: values.description,
                amount: values.amount.toString(),
                dateReference: values.dateReference.format('YYYY-MM-DD'),
            };

            await createIncome.mutateAsync(payload);
            message.success('Entrada criada com sucesso!');
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    return (
        <Modal
            title="Nova Entrada"
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Criar"
            cancelText="Cancelar"
            confirmLoading={createIncome.isPending}
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
                    <Input placeholder="Ex: Salário, Freelance, etc" />
                </Form.Item>

                <Form.Item
                    name="amount"
                    label="Valor"
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
                    name="financialInstrumentId"
                    label="Instrumento Financeiro"
                    rules={[{ required: true, message: 'Selecione o instrumento financeiro' }]}
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
                    name="dateReference"
                    label="Data de Referência"
                    rules={[{ required: true, message: 'Informe a data de referência' }]}
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        placeholder="Selecione a data"
                        style={{ width: '100%' }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
