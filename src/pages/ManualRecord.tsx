import React, { useState, useMemo, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Space,
  Typography,
  message,
  Row,
  Col,
  SelectProps
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Vehicle, MaintenanceRecord, MaintenanceProject } from '../types';
import { COMMON_PROJECTS } from '../types';

const { Title, Text } = Typography;

interface ManualRecordPageProps {
  currentVehicle: Vehicle;
  records: MaintenanceRecord[];
  onAddRecord: (record: MaintenanceRecord) => void;
}

const ManualRecordPage: React.FC<ManualRecordPageProps> = ({ currentVehicle, onAddRecord }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<MaintenanceProject[]>([]);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectCostInput, setProjectCostInput] = useState('');

  const totalCost = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.cost || 0), 0),
    [projects]
  );

  const projectOptions: SelectProps['options'] = COMMON_PROJECTS.map(p => ({ value: p, label: p }));

  const handleProjectSelect = useCallback((value: string) => {
    const cost = parseFloat(projectCostInput) || 0;
    setProjects(prev => [...prev, { name: value, cost }]);
    setProjectNameInput('');
    setProjectCostInput('');
  }, [projectCostInput]);

  const addProject = useCallback(() => {
    if (!projectNameInput) return;
    const cost = parseFloat(projectCostInput) || 0;
    setProjects(prev => [...prev, { name: projectNameInput, cost }]);
    setProjectNameInput('');
    setProjectCostInput('');
  }, [projectNameInput, projectCostInput]);

  const removeProject = useCallback((index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  }, []);

  const onFinish = useCallback((values: any) => {
    if (projects.length === 0) {
      message.warning('请至少添加一个项目');
      return;
    }

    const record: MaintenanceRecord = {
      _id: Date.now().toString(),
      vehicleId: currentVehicle._id,
      date: values.date.format('YYYY-MM-DD HH:mm'),
      location: values.location || '',
      projects,
      totalCost,
      mechanic: values.mechanic || '',
      recordType: values.recordType || '保养'
    };

    onAddRecord(record);
    message.success('保存成功');
    setTimeout(() => navigate('/'), 1000);
  }, [projects, totalCost, currentVehicle, onAddRecord, navigate]);

  if (!currentVehicle) {
    return (
      <Card>
        <Text type="secondary">请先添加车辆</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card title="手动记录">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: dayjs(),
            recordType: '保养'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="时间"
                rules={[{ required: true, message: '请选择时间' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="地点">
                <Input prefix={<EnvironmentOutlined />} placeholder="输入门店名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="项目" required>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {projects.length > 0 && (
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {projects.map((project, index) => (
                    <Row key={index} align="middle" style={{
                      padding: '14px 16px',
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #f0f0f0'
                    }}>
                      <Col span={2}>
                        <Text style={{ color: '#8C8C8C' }}>{index + 1}.</Text>
                      </Col>
                      <Col span={10}>
                        <Text strong style={{ color: '#262626', fontSize: 15 }}>{project.name}</Text>
                      </Col>
                      <Col span={6}>
                        <Space>
                          <DollarOutlined style={{ color: '#595959', fontSize: 13 }} />
                          <Text style={{ color: '#1677FF', fontWeight: 'bold', fontSize: 15 }}>
                            ¥{project.cost.toFixed(2)}
                          </Text>
                        </Space>
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeProject(index)}
                        />
                      </Col>
                    </Row>
                  ))}
                </Space>
              )}

              <Row gutter={12}>
                <Col span={10}>
                  <Select
                    showSearch
                    value={projectNameInput || undefined}
                    onSearch={setProjectNameInput}
                    onChange={handleProjectSelect}
                    options={projectOptions}
                    placeholder="选择或输入项目名称"
                    filterOption={(input, option) =>
                      (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Col>
                <Col span={8}>
                  <Input
                    value={projectCostInput}
                    onChange={(e) => setProjectCostInput(e.target.value)}
                    placeholder="输入金额"
                    prefix="¥"
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={6}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addProject}
                    disabled={!projectNameInput}
                    block
                    style={{ height: 40 }}
                  >
                    添加
                  </Button>
                </Col>
              </Row>
            </Space>
          </Form.Item>

          {projects.length > 0 && (
            <Form.Item label="总金额">
              <Card size="small" style={{ background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Text style={{ color: '#595959', fontSize: 14 }}>共 {projects.length} 个项目</Text>
                  </Col>
                  <Col>
                    <Title level={4} style={{ margin: 0, color: '#1677FF', fontWeight: 'bold' }}>
                      ¥{totalCost.toFixed(2)}
                    </Title>
                  </Col>
                </Row>
              </Card>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="mechanic" label="维修人员（可选）">
                <Input placeholder="输入维修人员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="recordType" label="记录类型">
                <Select>
                  <Select.Option value="保养">保养</Select.Option>
                  <Select.Option value="维修">维修</Select.Option>
                  <Select.Option value="更换配件">更换配件</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" style={{ height: 48, fontSize: 16 }}>
              保存记录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default ManualRecordPage;
