import React, { useState, useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Space,
  Typography,
  Tag,
  Divider,
  message,
  Row,
  Col,
  AutoComplete
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const totalCost = useMemo(() =>
    projects.reduce((sum, p) => sum + (p.cost || 0), 0),
    [projects]
  );

  const handleProjectNameChange = (value: string) => {
    setProjectNameInput(value);
    if (value) {
      const filtered = COMMON_PROJECTS.filter(p => p.includes(value)).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const addProject = (name?: string) => {
    const projectName = name || projectNameInput;
    if (!projectName) return;

    const cost = parseFloat(projectCostInput) || 0;
    setProjects([...projects, { name: projectName, cost }]);
    setProjectNameInput('');
    setProjectCostInput('');
    setSuggestions([]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const onFinish = (values: any) => {
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
  };

  if (!currentVehicle) {
    return (
      <Card>
        <Text type="secondary">请先添加车辆</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card title="手动记录" style={{ borderRadius: 8 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: new Date(),
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
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {/* 已添加项目列表 */}
              {projects.length > 0 && (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {projects.map((project, index) => (
                    <Row key={index} align="middle" style={{
                      padding: '12px 16px',
                      background: '#fafafa',
                      borderRadius: 6
                    }}>
                      <Col span={2}>
                        <Text type="secondary">{index + 1}.</Text>
                      </Col>
                      <Col span={10}>
                        <Text strong>{project.name}</Text>
                      </Col>
                      <Col span={6}>
                        <Space>
                          <DollarOutlined style={{ color: '#666', fontSize: 12 }} />
                          <Text style={{ color: '#1677FF', fontWeight: 'bold' }}>
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

              {/* 添加项目 */}
              <Space.Compact style={{ width: '100%' }}>
                <AutoComplete
                  style={{ flex: 2 }}
                  value={projectNameInput}
                  onChange={handleProjectNameChange}
                  options={suggestions.map(s => ({ value: s }))}
                  onSelect={(value) => addProject(value)}
                  placeholder="输入项目名称"
                />
                <Input
                  style={{ flex: 1 }}
                  value={projectCostInput}
                  onChange={(e) => setProjectCostInput(e.target.value)}
                  placeholder="金额"
                  prefix="¥"
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => addProject()}
                  disabled={!projectNameInput}
                >
                  添加
                </Button>
              </Space.Compact>
            </Space>
          </Form.Item>

          <Form.Item label="总金额">
            <Card size="small" style={{ background: '#fafafa', borderRadius: 6 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Text type="secondary">共 {projects.length} 个项目</Text>
                </Col>
                <Col>
                  <Title level={4} style={{ margin: 0, color: '#1677FF' }}>
                    ¥{totalCost.toFixed(2)}
                  </Title>
                </Col>
              </Row>
            </Card>
          </Form.Item>

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
            <Button type="primary" htmlType="submit" block size="large">
              保存记录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default ManualRecordPage;
