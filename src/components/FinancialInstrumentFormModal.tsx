import { useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    App,
} from 'antd';
import {
    useCreateFinancialInstrument,
    CreateFinancialInstrumentRequest,
    FinancialInstrument
} from '../api';
import { FINANCIAL_INSTRUMENT_TYPE_OPTIONS } from '../utils/constants';

interface FinancialInstrumentFormModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: FinancialInstrument;
}


export function FinancialInstrumentFormModal({
    open,
    onClose,
    initialData
}: FinancialInstrumentFormModalProps) {
    const [form] = Form.useForm();
    const { message } = App.useApp();

    const createInstrument = useCreateFinancialInstrument();

    const isEditing = !!initialData;
    const instrumentType = Form.useWatch('instrumentType', form);

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    name: initialData.name,
                    owner: initialData.owner,
                    instrumentType: initialData.instrumentType,
                    defaultDueDate: initialData.configuration?.defaultDueDate,
                });
            } else {
                form.resetFields();
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const payload: CreateFinancialInstrumentRequest = {
                name: values.name,
                owner: values.owner,
                instrumentType: values.instrumentType || undefined,
                configuration: values.defaultDueDate
                    ? { defaultDueDate: values.defaultDueDate }
                    : undefined,
            };

            await createInstrument.mutateAsync(payload);
            message.success('Instrumento financeiro criado com sucesso!');
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    return (
        <Modal
            title={isEditing ? 'Editar Instrumento Financeiro' : 'Novo Instrumento Financeiro'}
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            okText={isEditing ? 'Salvar' : 'Criar'}
            cancelText="Cancelar"
            confirmLoading={createInstrument.isPending}
            destroyOnClose
            width={480}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="name"
                    label="Nome"
                    rules={[{ required: true, message: 'Informe o nome do instrumento' }]}
                >
                    <Input placeholder="Ex: Nubank, Itaú, C6 Bank" />
                </Form.Item>

                <Form.Item
                    name="owner"
                    label="Titular"
                    rules={[{ required: true, message: 'Informe o titular' }]}
                >
                    <Input placeholder="Nome do titular da conta" />
                </Form.Item>

                <Form.Item
                    name="instrumentType"
                    label="Tipo de Instrumento"
                >
                    <Select
                        placeholder="Selecione o tipo"
                        options={FINANCIAL_INSTRUMENT_TYPE_OPTIONS}
                        allowClear
                    />
                </Form.Item>

                {instrumentType === 'CREDIT_CARD' && (
                    <Form.Item
                        name="defaultDueDate"
                        label="Dia de Vencimento da Fatura"
                        rules={[{ required: true, message: 'Informe o dia de vencimento' }]}
                        tooltip="Dia do mês em que a fatura vence"
                    >
                        <InputNumber
                            placeholder="Ex: 10"
                            style={{ width: '100%' }}
                            min={1}
                            max={31}
                        />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
}
