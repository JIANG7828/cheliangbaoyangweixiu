import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  DatePicker,
  Space,
  Typography,
  List,
  Modal,
  message,
  Row,
  Col,
  Badge,
  Popconfirm,
  Radio
} from 'antd';
import {
  PlusOutlined,
  CarOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Vehicle } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface VehiclePageProps {
  vehicles: Vehicle[];
  currentVehicle: Vehicle;
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

const VehiclePage: React.FC<VehiclePageProps> = ({
  vehicles,
  currentVehicle,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSelectVehicle
}) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.setFieldsValue({
      plateNumber: vehicle.plateNumber,
      vehicleModel: vehicle.vehicleModel,
      vin: vehicle.vin || undefined,
      purchaseDate: vehicle.purchaseDate ? dayjs(vehicle.purchaseDate) : undefined,
      fuelTankCapacity: vehicle.fuelTankCapacity || undefined,
      mileageInterval: vehicle.mileageInterval || 10000,
    });
    setIsModalOpen(true);
  };

  const handleSave = (values: any) => {
    const modelStr = values.vehicleModel || '';
    const parts = modelStr.split(' ');
    const brand = parts[0] || '';
    const model = parts.slice(1).join(' ') || '';
    const yearMatch = modelStr.match(/\d{4}/);

    const vehicleData: Vehicle = {
      _id: editingVehicle ? editingVehicle._id : Date.now().toString(),
      plateNumber: values.plateNumber,
      vehicleModel: modelStr,
      vin: values.vin || undefined,
      purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
      brand,
      model,
      year: yearMatch ? parseInt(yearMatch[0]) : undefined,
      mileage: editingVehicle?.mileage || undefined,
      fuelTankCapacity: values.fuelTankCapacity || undefined,
      mileageInterval: values.mileageInterval || 10000,
    };

    if (editingVehicle) {
      onUpdateVehicle(vehicleData);
      message.success('更新成功');
    } else {
      onAddVehicle(vehicleData);
      message.success('添加成功');
    }
    setIsModalOpen(false);
    form.resetFields();
    setEditingVehicle(null);
  };

  const handleDelete = (vehicle: Vehicle) => {
    onDeleteVehicle(vehicle._id);
    message.success('删除成功');
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: '#1677FF' }} />
            <Text strong style={{ color: '#262626' }}>车辆管理</Text>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAdd}
          >
            添加车辆
          </Button>
        }
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
                  border: item._id === currentVehicle._id ? '2px solid #1677FF' : '1px solid #d9d9d9'
                }}
              >
                <Row justify="space-between" align="middle">
                  <Col flex="auto" style={{ cursor: 'pointer' }} onClick={() => {
                    onSelectVehicle(item);
                    message.success(`已切换到 ${item.plateNumber}`);
                  }}>
                    <Space direction="vertical" size={8}>
                      <Space>
                        <Text strong style={{ fontSize: 18, color: '#262626' }}>{item.plateNumber}</Text>
                        {item._id === currentVehicle._id && (
                          <Badge status="success" text="当前车辆" />
                        )}
                      </Space>
                      <Text style={{ color: '#595959' }}>{item.vehicleModel}</Text>
                      {item.vin && (
                        <Text style={{ fontSize: 12, color: '#8C8C8C' }}>
                          VIN: {item.vin}
                        </Text>
                      )}
                    </Space>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                      >
                        编辑
                      </Button>
                      {vehicles.length > 1 && (
                        <Popconfirm
                          title="确认删除此车辆？"
                          description="删除后不可恢复，相关保养记录将保留"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDelete(item);
                          }}
                          onCancel={(e) => e?.stopPropagation()}
                          okText="删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingVehicle ? '编辑车辆' : '添加车辆'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingVehicle(null);
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
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

          <Form.Item
            name="purchaseDate"
            label="购买日期"
            rules={[{ required: true, message: '请选择购买日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="fuelTankCapacity"
            label="油箱容积"
            rules={[{ required: true, message: '请输入油箱容积' }]}
            extra="用于 AI 分析加油量是否合理、估算续航里程等"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="例如：50"
              min={10}
              max={200}
              addonAfter="升"
              precision={0}
            />
          </Form.Item>

          <Form.Item
            name="mileageInterval"
            label="保养间隔"
            rules={[{ required: true, message: '请选择保养间隔' }]}
            extra="常规保养里程间隔，决定保养周期追踪的节点间距"
          >
            <Radio.Group optionType="button" buttonStyle="solid">
              <Radio.Button value={5000}>5000 km</Radio.Button>
              <Radio.Button value={10000}>10000 km</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingVehicle ? '更新' : '保存'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default VehiclePage;
