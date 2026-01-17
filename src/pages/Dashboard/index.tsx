import { Card, Col, Row, Statistic, Progress, Typography, Space } from 'antd';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    UserOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
    EyeOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export function Dashboard() {
    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>
                Visão Geral
            </Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Total de Usuários"
                            value={1234}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                        <Space style={{ marginTop: 8 }}>
                            <Text type="success">
                                <ArrowUpOutlined /> 12%
                            </Text>
                            <Text type="secondary">vs último mês</Text>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Vendas"
                            value={567}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                        <Space style={{ marginTop: 8 }}>
                            <Text type="success">
                                <ArrowUpOutlined /> 8%
                            </Text>
                            <Text type="secondary">vs último mês</Text>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Receita"
                            value={45678.9}
                            precision={2}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                        <Space style={{ marginTop: 8 }}>
                            <Text type="danger">
                                <ArrowDownOutlined /> 3%
                            </Text>
                            <Text type="secondary">vs último mês</Text>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable>
                        <Statistic
                            title="Visualizações"
                            value={89012}
                            prefix={<EyeOutlined />}
                            valueStyle={{ color: '#fa8c16' }}
                        />
                        <Space style={{ marginTop: 8 }}>
                            <Text type="success">
                                <ArrowUpOutlined /> 25%
                            </Text>
                            <Text type="secondary">vs último mês</Text>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="Metas do Mês" bordered={false}>
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text>Vendas</Text>
                                    <Text type="secondary">75%</Text>
                                </div>
                                <Progress percent={75} status="active" strokeColor="#1890ff" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text>Novos Clientes</Text>
                                    <Text type="secondary">60%</Text>
                                </div>
                                <Progress percent={60} status="active" strokeColor="#52c41a" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text>Receita</Text>
                                    <Text type="secondary">90%</Text>
                                </div>
                                <Progress percent={90} status="active" strokeColor="#722ed1" />
                            </div>
                        </Space>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Atividade Recente" bordered={false}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {[
                                { time: 'Agora', text: 'Novo usuário registrado' },
                                { time: '5 min atrás', text: 'Venda #1234 realizada' },
                                { time: '15 min atrás', text: 'Produto atualizado' },
                                { time: '1 hora atrás', text: 'Relatório exportado' },
                                { time: '2 horas atrás', text: 'Configurações alteradas' },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 0',
                                        borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none',
                                    }}
                                >
                                    <Text>{item.text}</Text>
                                    <Text type="secondary">{item.time}</Text>
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
