import React from 'react';
import { Card, Row, Col, Space, Typography, Tag, Button, Statistic } from 'antd';
import {
  FileTextOutlined,
  CameraOutlined,
  HistoryOutlined,
  BellOutlined,
  CarOutlined,
  RightOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Vehicle, MaintenanceRecord } from '../types';

const { Title, Text } = Typography;

interface HomePageProps {
  currentVehicle: Vehicle;
  vehicles: Vehicle[];
  records: MaintenanceRecord[];
  onVehicleChange: (vehicle: Vehicle) => void;
}

const HomePage: React.FC<HomePageProps> = ({ currentVehicle, vehicles, records, onVehicleChange }) => {
  const navigate = useNavigate();
  const vehicleRecords = records.filter(r => r.vehicleId === currentVehicle?._id);
  const recentRecords = vehicleRecords.slice(0, 5);
  const totalCost = vehicleRecords.reduce((sum, r) => sum + r.totalCost, 0);

  const actionItems = [
    { icon: <FileTextOutlined />, title: '手动记录', path: '/manual', color: '#1677FF' },
    { icon: <CameraOutlined />, title: '拍照记录', path: '/photo', color: '#52C41A' },
    { icon: <HistoryOutlined />, title: '履历查询', path: '/history', color: '#FAAD14' },
    { icon: <BellOutlined />, title: '保养提醒', path: '/reminder', color: '#FF4D4F' }
  ];

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case '保养': return 'success';
      case '维修': return 'warning';
      case '更换配件': return 'processing';
      default: return 'default';
    }
  };

  if (!currentVehicle) {
    return (
      <Card>
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '60px 0' }}>
          <CarOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <Title level={4} style={{ color: '#666', marginBottom: 8 }}>请先添加车辆</Title>
          <Text type="secondary">添加车辆后即可开始记录保养信息</Text>
          <Button type="primary" onClick={() => navigate('/vehicle')} style={{ marginTop: 24 }}>
            添加车辆
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {/* 车辆信息卡片 */}
      <Card
        hoverable
        onClick={() => navigate('/vehicle')}
        style={{ borderRadius: 8 }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={8}>
              <Space>
                <CarOutlined style={{ fontSize: 24, color: '#1677FF' }} />
                <Title level={4} style={{ margin: 0 }}>{currentVehicle.plateNumber}</Title>
              </Space>
              <Text type="secondary">{currentVehicle.vehicleModel}</Text>
            </Space>
          </Col>
          <Col>
            <RightOutlined style={{ color: '#999', fontSize: 16 }} />
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="记录总数"
              value={vehicleRecords.length}
              suffix="条"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="累计费用"
              value={totalCost}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1677FF' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="车辆数量"
              value={vehicles.length}
              suffix="辆"
            />
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card title="快捷操作" style={{ borderRadius: 8 }}>
        <Row gutter={16}>
          {actionItems.map((item) => (
            <Col span={6} key={item.path}>
              <Button
                type="default"
                icon={item.icon}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  height: 80,
                  fontSize: 16,
                  color: '#333',
                  borderColor: '#f0f0f0'
                }}
              >
                {item.title}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 最近记录 */}
      <Card
        title="最近记录"
        extra={
          <Button type="link" onClick={() => navigate('/history')}>
            查看全部
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        {recentRecords.length > 0 ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {recentRecords.map((record) => (
              <Card
                key={record._id}
                size="small"
                hoverable
                style={{ borderRadius: 8 }}
              >
                <Row justify="space-between" align="middle">
                  <Col flex="auto">
                    <Space direction="vertical" size={8}>
                      <Space>
                        <Text strong>{record.date}</Text>
                        <Tag color={getRecordTypeColor(record.recordType)}>
                          {record.recordType}
                        </Tag>
                      </Space>
                      <Text type="secondary">
                        {record.projects.map(p => p.name).join('、')}
                      </Text>
                      <Space>
                        <EnvironmentOutlined style={{ color: '#999' }} />
                        <Text type="secondary">{record.location}</Text>
                      </Space>
                    </Space>
                  </Col>
                  <Col>
                    <Statistic
                      value={record.totalCost}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ color: '#1677FF', fontSize: 18 }}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        ) : (
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <ClockCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Text type="secondary">暂无保养记录</Text>
            <Button type="primary" onClick={() => navigate('/manual')}>
              添加第一条记录
            </Button>
          </Space>
        )}
      </Card>
    </Space>
  );
};

export default HomePage;
