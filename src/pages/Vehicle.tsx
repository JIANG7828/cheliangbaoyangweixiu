import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Space,
  Typography,
  Tag,
  List,
  Modal,
  message,
  Row,
  Col,
  Badge
} from 'antd';
import {
  PlusOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Vehicle } from '../types';

const { Text } = Typography;

interface VehiclePageProps {
  vehicles: Vehicle[];
  currentVehicle: Vehicle;
  onAddVehicle: (vehicle: Vehicle) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

const VehiclePage: React.FC<VehiclePageProps> = ({
  vehicles,
  currentVehicle,
  onAddVehicle,
  onSelectVehicle
}) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddVehicle = (values: any) => {
    const vehicle: Vehicle = {
      _id: Date.now().toString(),
      plateNumber: values.plateNumber,
      vehicleModel: values.vehicleModel,
      vin: values.vin || undefined,
      purchaseDate: values.purchaseDate?.format('YYYY-MM-DD')
    };
    onAddVehicle(vehicle);
    message.success('添加成功');
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: '#1677FF' }} />
            <Text strong>车辆管理</Text>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            添加车辆
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        <List
          dataSource={vehicles}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: item._id === currentVehicle._id ? '2px solid #1677FF' : '1px solid #f0f0f0'
                }}
                onClick={() => {
                  onSelectVehicle(item);
                  message.success(`已切换到 ${item.plateNumber}`);
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col flex="auto">
                    <Space direction="vertical" size={8}>
                      <Space>
                        <Text strong style={{ fontSize: 18 }}>{item.plateNumber}</Text>
                        {item._id === currentVehicle._id && (
                          <Badge status="success" text="当前车辆" />
                        )}
                      </Space>
                      <Text type="secondary">{item.vehicleModel}</Text>
                      {item.vin && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          VIN: {item.vin}
                        </Text>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      {/* 添加车辆弹窗 */}
      <Modal
        title="添加车辆"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddVehicle}
        >
          <Form.Item
            name="plateNumber"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="请输入车牌号" />
          </Form.Item>

          <Form.Item
            name="vehicleModel"
            label="车型"
            rules={[{ required: true, message: '请输入车型' }]}
          >
            <Input placeholder="例如：丰田凯美瑞 2020款" />
          </Form.Item>

          <Form.Item name="vin" label="VIN码（可选）">
            <Input placeholder="17位VIN码" maxLength={17} />
          </Form.Item>

          <Form.Item name="purchaseDate" label="购买日期（可选）">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default VehiclePage;
